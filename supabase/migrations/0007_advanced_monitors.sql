-- Adiciona campos avançados para monitors
ALTER TABLE monitors 
  ADD COLUMN method TEXT NOT NULL DEFAULT 'GET',
  ADD COLUMN expected_status_code INTEGER; -- NULL significa que aceitamos 200..299

-- Índice útil para o painel estilo Grafana que consome histórico recente de forma rápida
CREATE INDEX IF NOT EXISTS idx_monitor_checks_is_up_checked_at 
ON monitor_checks(is_up, checked_at DESC);
