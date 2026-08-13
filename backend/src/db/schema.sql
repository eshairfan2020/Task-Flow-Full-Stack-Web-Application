-- =============================================================
-- TaskFlow schema
-- Demonstrates: Tables, Primary Key, Foreign Key, Composite Key,
-- Normalization (1NF/2NF/3NF), Indexes, Relationships (1-M, M-M)
-- =============================================================

CREATE DATABASE IF NOT EXISTS taskflow;
USE taskflow;

-- ---------------------------------------------------------------
-- users
-- 1NF: every column atomic (no comma-separated lists), each row unique via PK.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,   -- Primary Key (surrogate key)
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,            -- bcrypt hash, never plaintext
  role          ENUM('admin','member') NOT NULL DEFAULT 'member', -- RBAC
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)                -- candidate key -> enforced unique index
);

-- ---------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  owner_id    INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_teams_owner
    FOREIGN KEY (owner_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- team_members (junction table => Many-to-Many between users & teams)
-- Composite Primary Key: (team_id, user_id) — no row can duplicate this pair,
-- avoiding a partial dependency you'd get from a surrogate id here (2NF).
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
  team_id   INT NOT NULL,
  user_id   INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),                  -- Composite Key
  CONSTRAINT fk_tm_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- tasks
-- 3NF note: we store team_id + assignee_id directly (not team_name/assignee_name),
-- so no non-key column depends on another non-key column (no transitive dependency).
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  team_id      INT NOT NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  status       ENUM('todo','in_progress','done') NOT NULL DEFAULT 'todo',
  priority     ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  assignee_id  INT NULL,
  created_by   INT NOT NULL,
  due_date     DATE NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_team     FOREIGN KEY (team_id)     REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tasks_creator  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tasks_team_status (team_id, status),    -- speeds up "board view" queries
  INDEX idx_tasks_assignee (assignee_id)
);

-- ---------------------------------------------------------------
-- task_comments (1-to-many from tasks)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_comments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  task_id     INT NOT NULL,
  user_id     INT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_comments_task (task_id)
);

-- ---------------------------------------------------------------
-- refresh_tokens — supports JWT refresh-token rotation & logout-everywhere
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  revoked     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- Example query patterns referenced from the README
--   (WHERE / GROUP BY / HAVING / ORDER BY / JOIN)
-- =============================================================

-- JOIN + WHERE + ORDER BY: board view for a team
-- SELECT t.id, t.title, t.status, u.name AS assignee
-- FROM tasks t
-- LEFT JOIN users u ON u.id = t.assignee_id
-- WHERE t.team_id = ?
-- ORDER BY FIELD(t.priority,'high','medium','low'), t.due_date;

-- GROUP BY + HAVING: members with more than 5 open tasks
-- SELECT u.name, COUNT(*) AS open_tasks
-- FROM tasks t
-- JOIN users u ON u.id = t.assignee_id
-- WHERE t.status != 'done'
-- GROUP BY u.id, u.name
-- HAVING COUNT(*) > 5
-- ORDER BY open_tasks DESC;
