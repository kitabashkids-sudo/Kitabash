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
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_batches_course ON batches(course_id);
CREATE INDEX idx_batches_instructor ON batches(instructor_id);

CREATE TABLE batch_members (
  batch_id   TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (batch_id, user_id)
);

CREATE TABLE live_sessions (
  id           TEXT PRIMARY KEY,
  batch_id     TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  course_id    TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id    TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  starts_at    TEXT NOT NULL,                  -- ISO timestamp (UTC)
  duration_min INTEGER NOT NULL DEFAULT 60,
  status       TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended','cancelled')),
  external_url TEXT NOT NULL DEFAULT '',       -- optional Zoom/Meet link instead of built-in video
  started_at   TEXT,
  ended_at     TEXT,
  created_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_live_batch ON live_sessions(batch_id, starts_at);

CREATE TABLE live_attendance (
  session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_join TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen  TEXT NOT NULL DEFAULT (datetime('now')),
  seconds    INTEGER NOT NULL DEFAULT 0,
  joins      INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (session_id, user_id)
);

CREATE TABLE live_messages (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_live_messages ON live_messages(session_id, created_at);

-- Small key/value store (e.g. course-library install progress)
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
