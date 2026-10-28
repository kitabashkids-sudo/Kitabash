-- PostgreSQL / Supabase version of sqlite/002_live_classes.sql.
-- Batches (a cohort of students taking a course with a teacher) and live classes.

CREATE TABLE batches (
  id            TEXT PRIMARY KEY,
  course_id     TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  instructor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  schedule_note TEXT NOT NULL DEFAULT '',      -- e.g. "Mon & Wed, 5–6 pm"
  capacity      INTEGER NOT NULL DEFAULT 10,
  starts_on     TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_batches_course ON batches(course_id);
CREATE INDEX idx_batches_instructor ON batches(instructor_id);

CREATE TABLE batch_members (
  batch_id   TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (batch_id, user_id)
);

CREATE TABLE live_sessions (
  id           TEXT PRIMARY KEY,
  batch_id     TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  course_id    TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id    TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  starts_at    TIMESTAMPTZ NOT NULL,                  -- ISO timestamp (UTC)
  duration_min INTEGER NOT NULL DEFAULT 60,
  status       TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended','cancelled')),
  external_url TEXT NOT NULL DEFAULT '',       -- optional Zoom/Meet link instead of built-in video
  started_at   TIMESTAMPTZ,
  ended_at     TIMESTAMPTZ,
  created_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_live_batch ON live_sessions(batch_id, starts_at);

CREATE TABLE live_attendance (
  session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_join TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
  seconds    INTEGER NOT NULL DEFAULT 0,
  joins      INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (session_id, user_id)
);

CREATE TABLE live_messages (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_live_messages ON live_messages(session_id, created_at);

-- Small key/value store (e.g. course-library install progress)
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lock out Supabase's public API roles (same model as 001)
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon'; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated'; END IF;
END $$;
