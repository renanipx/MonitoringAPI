-- Tabela de Monitores
CREATE TABLE monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  interval_minutes INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_status INTEGER,
  last_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Histórico de Pings (Checks)
CREATE TABLE monitor_checks (
  id BIGSERIAL PRIMARY KEY,
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  status_code INTEGER,
  response_time_ms INTEGER,
  is_up BOOLEAN NOT NULL,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_monitors_user_id ON monitors(user_id);
CREATE INDEX idx_monitor_checks_monitor_id_checked_at ON monitor_checks(monitor_id, checked_at DESC);
