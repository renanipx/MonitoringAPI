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

  const getStatusInfo = (status: number) => {
    if (status >= 200 && status < 300) {
      return { label: "Online", className: "status-online", color: "#22c55e" };
    }
    if (status >= 400 && status < 500) {
      return { label: "Degraded", className: "status-degraded", color: "#eab308" };
    }
    if (status >= 500 || status === 0) {
      return { label: "Offline", className: "status-offline", color: "#ef4444" };
    }
    return { label: "Pending", className: "status-pending", color: "#9ca3af" };
  };

  const getResponseTimeColor = (ms: number | undefined) => {
    if (!ms) return "text-muted";
    if (ms < 200) return "response-fast";
    if (ms <= 500) return "response-moderate";
    return "response-slow";
  };

  if (loading && monitors.length === 0) return <div className="loading">Loading monitors...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="monitor-container">
      <div className="monitor-list-grid">
        {monitors.length === 0 ? (
          <p className="empty-state">No monitors registered yet. Add one above!</p>
        ) : (
          monitors.map((m) => {
            const statusInfo = getStatusInfo(m.last_status);
            return (
              <Card
                key={m.id}
                className={`monitor-card ${selectedMonitor?.id === m.id ? "selected" : ""}`}
                onClick={() => handleSelect(m)}
              >
                <div className="monitor-card-body">
                  <div className="monitor-main-info">
                    <div className="monitor-header-top">
                      <div className="monitor-title-row">
                        <Globe size={18} className="monitor-icon" />
                        <h3>{m.name}</h3>
                      </div>
                      <div className="monitor-header-right">
                        {m.last_response_time_ms !== undefined && m.last_response_time_ms !== null && (
                          <span className={`response-time ${getResponseTimeColor(m.last_response_time_ms)}`}>
                            {m.last_response_time_ms}ms
                          </span>
                        )}
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(m.id);
                          }}
                          title="Delete monitor"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="monitor-url">{m.url}</p>
                  </div>

                  <div className="monitor-footer">
                    <div className="status-group">
                      <div className={`status-badge ${statusInfo.className}`}>
                        <span className="status-dot"></span>
                        {statusInfo.label}
                      </div>
                      {m.last_status > 0 && (
                        <span className="status-code">{m.last_status}</span>
                      )}
                    </div>
                    <span className="last-check">
                      {m.last_check_at
                        ? new Date(m.last_check_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Never"}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
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
