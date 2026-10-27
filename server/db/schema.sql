-- GeoIstmo · esquema de la base de datos (SQLite) · versión alfa del Avance 3
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, grade TEXT NOT NULL DEFAULT '12.º',
  code TEXT NOT NULL UNIQUE,
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('estudiante','docente','administrador')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL, expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY, number INTEGER NOT NULL UNIQUE, title TEXT NOT NULL,
  short_title TEXT NOT NULL, description TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY, module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '',
  minutes INTEGER NOT NULL DEFAULT 6, UNIQUE (module_id, position)
);
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY, topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, title TEXT NOT NULL, content_json TEXT NOT NULL,
  UNIQUE (topic_id, position)
);
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('relacionar','seleccion','vf')),
  purpose TEXT NOT NULL CHECK (purpose IN ('mision','autoevaluacion')),
  title TEXT NOT NULL, instructions TEXT NOT NULL DEFAULT '',
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  mission_slot INTEGER CHECK (mission_slot BETWEEN 1 AND 3),
  xp INTEGER NOT NULL DEFAULT 10, lives INTEGER NOT NULL DEFAULT 3,
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0,1))
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_activity_slot ON activities(mission_slot) WHERE mission_slot IS NOT NULL;
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY, activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, prompt TEXT NOT NULL,
  data_json TEXT NOT NULL,      -- lo que ve el estudiante
  answer_json TEXT NOT NULL,    -- respuesta correcta: SOLO el servidor la lee
  explanation TEXT NOT NULL DEFAULT '', UNIQUE (activity_id, position)
);
CREATE TABLE IF NOT EXISTS section_modules (
  section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'cerrado' CHECK (status IN ('abierto','programado','cerrado')),
  opens_at TEXT, PRIMARY KEY (section_id, module_id)
);
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TEXT NOT NULL, PRIMARY KEY (user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'en_curso' CHECK (status IN ('en_curso','completado','sin_vidas')),
  lives_left INTEGER NOT NULL, combo INTEGER NOT NULL DEFAULT 0, best_combo INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL, answered INTEGER NOT NULL DEFAULT 0, points REAL NOT NULL DEFAULT 0,
  score_pct INTEGER, xp_awarded INTEGER NOT NULL DEFAULT 0, day TEXT NOT NULL,
  started_at TEXT NOT NULL, finished_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_attempts_user_act ON attempts(user_id, activity_id);
CREATE TABLE IF NOT EXISTS attempt_answers (
  attempt_id INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  response_json TEXT NOT NULL, score REAL NOT NULL, is_correct INTEGER NOT NULL,
  PRIMARY KEY (attempt_id, question_id)
);
CREATE TABLE IF NOT EXISTS xp_ledger (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, reason TEXT NOT NULL, ref TEXT NOT NULL, day TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_xp_user ON xp_ledger(user_id, day);
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY, position INTEGER NOT NULL UNIQUE, name TEXT NOT NULL, place TEXT NOT NULL,
  image TEXT NOT NULL, is_shield INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS daily_missions (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, day TEXT NOT NULL,
  completed_at TEXT NOT NULL, bonus_xp INTEGER NOT NULL DEFAULT 0, badge_id INTEGER REFERENCES badges(id),
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS user_badges (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TEXT NOT NULL, PRIMARY KEY (user_id, badge_id)
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
