-- Adiciona novos campos na tabela de monitores
ALTER TABLE monitors 
  ADD COLUMN webhook_url TEXT,
  ADD COLUMN status_page_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Cria a tabela de incidentes para o tracking formal
CREATE TABLE incidents (
  id BIGSERIAL PRIMARY KEY,
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  error_details TEXT
);

-- Índices adicionais para consultas eficientes no dashboard
CREATE INDEX idx_incidents_monitor_id_started_at ON incidents(monitor_id, started_at DESC);
CREATE INDEX idx_incidents_resolved_at ON incidents(monitor_id) WHERE resolved_at IS NULL;
