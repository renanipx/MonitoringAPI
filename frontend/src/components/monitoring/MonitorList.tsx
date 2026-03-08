import { useEffect, useState } from "react";
import { listMonitors, deleteMonitor, getMonitorStats } from "../../services/api";
import { Card } from "../ui/Card";
import { MonitorChart } from "./MonitorChart.tsx";
import { Trash2, Activity, Globe } from "lucide-react";

interface MonitorListProps {
  refreshKey: number;
}

export function MonitorList({ refreshKey }: MonitorListProps) {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonitor, setSelectedMonitor] = useState<any | null>(null);
  const [stats, setStats] = useState<any | null>(null);

  async function fetchMonitors() {
    setLoading(true);
    try {
      const data = await listMonitors();
      setMonitors(data.monitors);
    } catch (err) {
      setError("Failed to load monitors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMonitors();
  }, [refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this monitor?")) return;
    try {
      await deleteMonitor(id);
      fetchMonitors();
      if (selectedMonitor?.id === id) {
        setSelectedMonitor(null);
        setStats(null);
      }
    } catch (err) {
      alert("Failed to delete monitor");
    }
  }

  async function handleSelect(monitor: any) {
    setSelectedMonitor(monitor);
    setStats(null);
    try {
      const data = await getMonitorStats(monitor.id);
      setStats(data);
    } catch (err) {
      alert("Failed to load stats");
    }
  }

  if (loading && monitors.length === 0) return <div className="loading">Loading monitors...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="monitor-container">
      <div className="monitor-list-grid">
        {monitors.length === 0 ? (
          <p className="empty-state">No monitors registered yet. Add one above!</p>
        ) : (
          monitors.map((m) => (
            <Card key={m.id} className={`monitor-card ${selectedMonitor?.id === m.id ? "selected" : ""}`}>
              <div className="monitor-card-header">
                <div className="monitor-info" onClick={() => handleSelect(m)}>
                  <div className="monitor-title-row">
                    <Globe size={16} />
                    <h3>{m.name}</h3>
                  </div>
                  <span className="monitor-url">{m.url}</span>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(m.id);
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="monitor-status-row">
                <div className={`status-badge ${m.last_status >= 200 && m.last_status < 300 ? "up" : "down"}`}>
                  {m.last_status === 0 ? "Offline" : (m.last_status || "Pending")}
                </div>
                <span className="last-check">
                  {m.last_check_at ? new Date(m.last_check_at).toLocaleTimeString() : "Never checked"}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {selectedMonitor && (
        <div className="monitor-details mt-8">
          <Card className="stats-card">
            <div className="stats-header">
              <Activity size={20} />
              <h2>Statistics: {selectedMonitor.name}</h2>
              {stats && <div className="uptime-badge">Uptime 24h: {stats.uptime_24h}%</div>}
            </div>
            
            {stats ? (
              <div className="chart-wrapper">
                <MonitorChart data={stats.recent_checks} />
              </div>
            ) : (
              <div className="loading-stats">Loading stats...</div>
            )}

            <div className="incident-history mt-6">
              <h3>Recent Checks</h3>
              <div className="checks-table-wrapper">
                <table className="checks-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Response</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recent_checks || []).map((check: any) => (
                      <tr key={check.id}>
                        <td>{new Date(check.checked_at).toLocaleString()}</td>
                        <td>
                          <span className={`status-pill ${check.is_up ? "up" : "down"}`}>
                            {check.status_code || "Error"}
                          </span>
                        </td>
                        <td>{check.response_time_ms}ms</td>
                        <td>{check.is_up ? "OK" : (check.error_message || "Failed")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
