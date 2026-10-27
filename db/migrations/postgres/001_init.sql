-- Kitabash core schema — PostgreSQL / Supabase.
-- Same tables and columns as db/migrations/sqlite/001_init.sql so the app's portable SQL
-- runs unchanged. JSON is stored as TEXT (validated by the app); flags are INTEGER 0/1.
--
-- SECURITY MODEL ON SUPABASE
-- The Kitabash server is the ONLY client of these tables. It connects with the database
-- connection string (role "postgres", the table owner) and enforces permissions itself.
-- Row Level Security is ENABLED with NO policies on every table, and all privileges are
-- revoked from Supabase's "anon" and "authenticated" roles, so the public REST/GraphQL APIs
-- (which use the anon key) can read or change NOTHING — not answer keys, not student data.

-- ── Identity & access ────────────────────────────────────────
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE ,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','instructor','student','guardian')),
  birth_year    INTEGER,
  password_hash TEXT NOT NULL,
  disabled      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,            -- sha256 of the cookie token
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE guardian_links (
  guardian_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_ai    INTEGER NOT NULL DEFAULT 0,   -- may use the AI tutor
  consent_audio INTEGER NOT NULL DEFAULT 0,   -- may record audio in the browser
  consented_at  TIMESTAMPTZ,
  PRIMARY KEY (guardian_id, student_id)
);

-- ── Taxonomy ─────────────────────────────────────────────────
CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT 'book',
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subjects (
  id          TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Courses & curriculum ─────────────────────────────────────
CREATE TABLE courses (
  id                  TEXT PRIMARY KEY,
  subject_id          TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT NOT NULL DEFAULT '',
  age_min             INTEGER,
  age_max             INTEGER,
  grade_level         TEXT NOT NULL DEFAULT '',
  proficiency         TEXT NOT NULL DEFAULT 'beginner',
  prerequisites       TEXT NOT NULL DEFAULT '[]',
  objectives          TEXT NOT NULL DEFAULT '[]',
  outcomes            TEXT NOT NULL DEFAULT '[]',
  duration_minutes    INTEGER NOT NULL DEFAULT 0,
  required_tools      TEXT NOT NULL DEFAULT '[]',
  teaching_style      TEXT NOT NULL DEFAULT '',
  assessment_approach TEXT NOT NULL DEFAULT '',
  safety_requirements TEXT NOT NULL DEFAULT '',
  completion_criteria TEXT NOT NULL DEFAULT '{"minLessons":"all","minScorePct":60}',
  instructor_notes    TEXT NOT NULL DEFAULT '',
  student_intro       TEXT NOT NULL DEFAULT '',
  theme               TEXT NOT NULL DEFAULT 'sunrise',
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','testing','review','approved','published','archived')),
  version             INTEGER NOT NULL DEFAULT 1,
  is_template         INTEGER NOT NULL DEFAULT 0,
  created_by          TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE course_versions (
  id          TEXT PRIMARY KEY,
  course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  label       TEXT NOT NULL DEFAULT '',
  snapshot    TEXT NOT NULL,              -- full JSON of course + modules + lessons + activities
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, version)
);

CREATE TABLE curriculum_tracks (
  id             TEXT PRIMARY KEY,
  course_id      TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  pathway        TEXT NOT NULL DEFAULT 'board' CHECK (pathway IN ('board','olympiad','general')),
  board          TEXT NOT NULL DEFAULT '',    -- CBSE | CISCE | Cambridge IGCSE | Olympiad body | ''
  grade          TEXT NOT NULL DEFAULT '',
  subject        TEXT NOT NULL DEFAULT '',
  syllabus_code  TEXT NOT NULL DEFAULT '',
  syllabus_year  TEXT NOT NULL DEFAULT '',
  title          TEXT NOT NULL,
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE modules (
  id         TEXT PRIMARY KEY,
  course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  track_id   TEXT REFERENCES curriculum_tracks(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  summary    TEXT NOT NULL DEFAULT '',
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE lessons (
  id               TEXT PRIMARY KEY,
  module_id        TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id        TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  objective        TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 20,
  position         INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved')),
  learn            TEXT NOT NULL DEFAULT '{"cards":[]}',   -- student-facing explanation cards
  hook             TEXT NOT NULL DEFAULT '{}',             -- 3-second visual hook definition
  teacher          TEXT NOT NULL DEFAULT '{}',             -- teacher-only panel content (protected)
  source_refs      TEXT NOT NULL DEFAULT '[]',             -- [{resourceId, ref, quote}]
  generated        INTEGER NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activities (
  id           TEXT PRIMARY KEY,
  lesson_id    TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  phase        TEXT NOT NULL CHECK (phase IN ('learn','perform','probe')),
  type         TEXT NOT NULL,             -- key in the activity registry
  title        TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  position     INTEGER NOT NULL DEFAULT 0,
  config       TEXT NOT NULL DEFAULT '{}',  -- student-safe configuration
  answer_key   TEXT NOT NULL DEFAULT '{}',  -- PROTECTED: never sent to students
  hints        TEXT NOT NULL DEFAULT '[]',  -- hint ladder, revealed one at a time
  points       INTEGER NOT NULL DEFAULT 10,
  required     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE assessments (
  id          TEXT PRIMARY KEY,
  lesson_id   TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  rubric      TEXT NOT NULL DEFAULT '[]',   -- [{criterion, levels:[...]}] (teacher-only)
  pass_pct    INTEGER NOT NULL DEFAULT 60
);

CREATE TABLE curriculum_mappings (
  id                TEXT PRIMARY KEY,
  track_id          TEXT NOT NULL REFERENCES curriculum_tracks(id) ON DELETE CASCADE,
  lesson_id         TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  topic             TEXT NOT NULL,
  objective         TEXT NOT NULL DEFAULT '',
  assessment_format TEXT NOT NULL DEFAULT '',
  reference_source  TEXT NOT NULL DEFAULT '',
  review_status     TEXT NOT NULL DEFAULT 'unverified'
                    CHECK (review_status IN ('unverified','in_review','approved','rejected')),
  reviewed_by       TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Knowledge library & media ────────────────────────────────
CREATE TABLE resources (
  id                TEXT PRIMARY KEY,
  course_id         TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  kind              TEXT NOT NULL CHECK (kind IN ('file','url')),
  source            TEXT NOT NULL DEFAULT '',   -- original filename or URL
  mime              TEXT NOT NULL DEFAULT '',
  storage_path      TEXT,
  size_bytes        BIGINT NOT NULL DEFAULT 0,
  version           INTEGER NOT NULL DEFAULT 1,
  audience          TEXT NOT NULL DEFAULT 'teacher' CHECK (audience IN ('teacher','student')),
  extraction_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (extraction_status IN ('pending','extracted','unsupported','failed','url_unverified','url_reachable','url_unreachable')),
  extraction_note   TEXT NOT NULL DEFAULT '',
  text_chars        INTEGER NOT NULL DEFAULT 0,
  replaced_by       TEXT REFERENCES resources(id) ON DELETE SET NULL,
  created_by        TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE resource_chunks (
  id          TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  ord         INTEGER NOT NULL,
  ref         TEXT NOT NULL DEFAULT '',   -- "page 3", "slide 2", "section: Needs", "rows 1-20"
  text        TEXT NOT NULL
);
CREATE INDEX idx_chunks_course ON resource_chunks(course_id);

CREATE TABLE assets (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('video','image','svg','audio')),
  mime         TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes   BIGINT NOT NULL DEFAULT 0,
  tags         TEXT NOT NULL DEFAULT '[]',
  alt_text     TEXT NOT NULL DEFAULT '',
  captions     TEXT NOT NULL DEFAULT '',
  version      INTEGER NOT NULL DEFAULT 1,
  created_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── AI agents ────────────────────────────────────────────────
CREATE TABLE agents (
  id                   TEXT PRIMARY KEY,
  course_id            TEXT NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
  draft_version_id     TEXT,
  published_version_id TEXT
);

CREATE TABLE agent_versions (
  id          TEXT PRIMARY KEY,
  agent_id    TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  config      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','testing','review','approved','published','archived')),
  note        TEXT NOT NULL DEFAULT '',
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, version)
);

CREATE TABLE agent_test_cases (
  id           TEXT PRIMARY KEY,
  agent_id     TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  category     TEXT NOT NULL,     -- typical | incorrect | misconception | off_topic | age | ambiguous | unsupported | grounding | safety
  prompt       TEXT NOT NULL,
  student_age  INTEGER,
  expectations TEXT NOT NULL DEFAULT '{}',  -- {mustInclude:[], mustNotInclude:[], expectRefusal, expectCitation, expectEscalation}
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_test_runs (
  id           TEXT PRIMARY KEY,
  test_case_id TEXT NOT NULL REFERENCES agent_test_cases(id) ON DELETE CASCADE,
  version_id   TEXT NOT NULL REFERENCES agent_versions(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL,
  response     TEXT NOT NULL,
  meta         TEXT NOT NULL DEFAULT '{}',
  checks       TEXT NOT NULL DEFAULT '[]',
  passed       INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pseudonymous: stores a salted hash, never the user id or name.
CREATE TABLE agent_logs (
  id          TEXT PRIMARY KEY,
  course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id   TEXT,
  surface     TEXT NOT NULL,      -- tutor | cofacilitator | sandbox
  learner_ref TEXT NOT NULL,
  question    TEXT NOT NULL,      -- redacted of emails/phones before storage
  intent      TEXT NOT NULL,
  grounded    INTEGER NOT NULL DEFAULT 0,
  answered    INTEGER NOT NULL DEFAULT 1,
  escalated   INTEGER NOT NULL DEFAULT 0,
  rating      INTEGER,            -- learner thumbs up/down
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Learning records ─────────────────────────────────────────
CREATE TABLE enrolments (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE TABLE lesson_progress (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id    TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  phase        TEXT NOT NULL DEFAULT 'learn',
  status       TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  score        INTEGER NOT NULL DEFAULT 0,
  max_score    INTEGER NOT NULL DEFAULT 0,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE attempts (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  lesson_id   TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  response    TEXT NOT NULL,
  score       INTEGER NOT NULL,
  max_score   INTEGER NOT NULL,
  correct     INTEGER NOT NULL,
  needs_review INTEGER NOT NULL DEFAULT 0,
  hints_used  INTEGER NOT NULL DEFAULT 0,
  feedback    TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempts_user ON attempts(user_id, lesson_id);

CREATE TABLE instructor_feedback (
  id             TEXT PRIMARY KEY,
  attempt_id     TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  instructor_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
  comment        TEXT NOT NULL,
  score_override INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Platform ─────────────────────────────────────────────────
CREATE TABLE integrations (
  key         TEXT PRIMARY KEY,
  enabled     INTEGER NOT NULL DEFAULT 1,
  last_check  TEXT,
  last_error  TEXT
);

CREATE TABLE audit_log (
  id         TEXT PRIMARY KEY,
  user_id    TEXT,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT,
  detail     TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Lock down Supabase's public API roles ───────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrolments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
  END IF;
END $$;
