import { useEffect, useState } from "react";
import { listMonitors, deleteMonitor, getMonitorStats } from "../../services/api";
import { Card } from "../ui/Card";
import { MonitorChart } from "./MonitorChart";
import { Heatmap } from "./Heatmap";
import { Trash2, Activity, Globe, Search, Eye, Pencil, Share2 } from "lucide-react";
import { useToast } from "../ui/Toast";

interface MonitorListProps {
  refreshKey: number;
}

export function MonitorList({ refreshKey }: MonitorListProps) {
  const { showToast } = useToast();
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonitor, setSelectedMonitor] = useState<any | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [prevStatuses, setPrevStatuses] = useState<Record<string, number>>({});
  const [animatingIds, setAnimatingIds] = useState<Record<string, string>>({});

  async function fetchMonitors() {
    setLoading(true);
    try {
      const data = await listMonitors();
      const newMonitors = data.monitors;
      
      // Detect status changes
      const newAnims: Record<string, string> = {};
      newMonitors.forEach((m: any) => {
        const prevStatus = prevStatuses[m.id];
        if (prevStatus !== undefined && prevStatus !== m.last_status) {
          const isNowOffline = m.last_status >= 500 || m.last_status === 0;
          newAnims[m.id] = isNowOffline ? "status-changing-offline" : "status-changing";
          
          if (isNowOffline) {
            showToast(`Monitor ${m.name} is offline!`, "error");
          } else if (prevStatus >= 500 || prevStatus === 0) {
            showToast(`Monitor ${m.name} is back online!`, "success");
          }
        }
      });

      if (Object.keys(newAnims).length > 0) {
        setAnimatingIds(prev => ({ ...prev, ...newAnims }));
        setTimeout(() => {
          setAnimatingIds(prev => {
            const next = { ...prev };
            Object.keys(newAnims).forEach(id => delete next[id]);
            return next;
          });
        }, 2000);
      }

      setMonitors(newMonitors);
      
      // Update previous statuses
      const nextStatuses: Record<string, number> = {};
      newMonitors.forEach((m: any) => {
        nextStatuses[m.id] = m.last_status;
      });
      setPrevStatuses(nextStatuses);

    } catch (err) {
      setError("Failed to load monitors");
      showToast("Failed to load monitors", "error");
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
      showToast("Monitor deleted successfully!", "success");
      fetchMonitors();
      if (selectedMonitor?.id === id) {
        setSelectedMonitor(null);
        setStats(null);
      }
    } catch (err) {
      showToast("Failed to delete monitor", "error");
    }
  }

  async function handleSelect(monitor: any) {
    setSelectedMonitor(monitor);
    setStats(null);
    try {
      const data = await getMonitorStats(monitor.id);
      setStats(data);
    } catch (err) {
      showToast("Failed to load stats", "error");
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

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 30) return "just now";
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const Sparkline = ({ data }: { data: any[] }) => {
    if (!data || data.length < 2) return null;
    
    // Reverse to show chronological order (left to right)
    const checks = [...data].reverse();
    const width = 120;
    const height = 30;
    const padding = 2;
    
    const maxTime = Math.max(...checks.map(c => c.response_time_ms || 0), 100);
    const minTime = Math.min(...checks.map(c => c.response_time_ms || 0), 0);
    const range = maxTime - minTime || 1;

    const points = checks.map((c, i) => {
      const x = (i / (checks.length - 1)) * width;
      const y = height - padding - (((c.response_time_ms || 0) - minTime) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(" ");

    // Determine trend color
    const isUnstable = checks.some(c => !c.is_up);
    const avg = checks.reduce((acc, c) => acc + (c.response_time_ms || 0), 0) / checks.length;
    const variance = checks.reduce((acc, c) => acc + Math.pow((c.response_time_ms || 0) - avg, 2), 0) / checks.length;
    
    let color = "#22c55e"; // stable green
    if (isUnstable) color = "#ef4444"; // unstable red
    else if (Math.sqrt(variance) > avg * 0.3) color = "#eab308"; // fluctuating yellow

    return (
      <svg width={width} height={height} className="sparkline">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  if (loading && monitors.length === 0) return <div className="loading">Loading monitors...</div>;
  if (error) return <div className="error">{error}</div>;

  const totalMonitors = monitors.length;
  const onlineMonitors = monitors.filter(m => m.last_status >= 200 && m.last_status < 300).length;
  const offlineMonitors = monitors.filter(m => m.last_status >= 500 || m.last_status === 0).length;
  const avgResponseTime = monitors.length > 0 
    ? Math.round(monitors.reduce((acc, m) => acc + (m.last_response_time_ms || 0), 0) / monitors.length) 
    : 0;

  const filteredMonitors = monitors.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.url.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isOnline = m.last_status >= 200 && m.last_status < 300;
    const isOffline = m.last_status >= 500 || m.last_status === 0;

    if (statusFilter === "online") return matchesSearch && isOnline;
    if (statusFilter === "offline") return matchesSearch && isOffline;
    return matchesSearch;
  });

  return (
    <div className="monitor-container">
      <div className="dashboard-summary">
        <Card className="summary-card">
          <div className="summary-icon total">
            <Globe size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total</span>
            <span className="summary-value">{totalMonitors}</span>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="summary-icon online">
            <Activity size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Online</span>
            <span className="summary-value text-green">{onlineMonitors}</span>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="summary-icon offline">
            <Activity size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Offline</span>
            <span className="summary-value text-red">{offlineMonitors}</span>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="summary-icon avg">
            <Activity size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Avg. Response</span>
            <span className="summary-value">{avgResponseTime}ms</span>
          </div>
        </Card>
      </div>

      <div className="filter-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search monitors by name or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="status-filters">
          <button
            className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${statusFilter === "online" ? "active" : ""}`}
            onClick={() => setStatusFilter("online")}
          >
            Online
          </button>
          <button
            className={`filter-btn ${statusFilter === "offline" ? "active" : ""}`}
            onClick={() => setStatusFilter("offline")}
          >
            Offline
          </button>
        </div>
      </div>

      <div className="monitor-list-grid">
        {filteredMonitors.length === 0 ? (
          <p className="empty-state">
            {searchTerm || statusFilter !== "all" 
              ? "No monitors match your search/filter." 
              : "No monitors registered yet. Add one above!"}
          </p>
        ) : (
          filteredMonitors.map((m) => {
            const statusInfo = getStatusInfo(m.last_status);
            const isOffline = m.last_status >= 500 || m.last_status === 0;
            const animationClass = animatingIds[m.id] || "";
            return (
              <Card
                key={m.id}
                className={`monitor-card ${selectedMonitor?.id === m.id ? "selected" : ""} ${isOffline ? "is-offline" : ""} ${animationClass}`}
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
                        <div className="card-actions">
                          <button
                            className="action-btn share"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (m.status_page_token) {
                                window.open(`/status/${m.status_page_token}`, '_blank');
                              } else {
                                showToast("No public status token assigned yet.", "error");
                              }
                            }}
                            title="Public Status Page"
                          >
                            <Share2 size={16} />
                          </button>
                          <button
                            className="action-btn view"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(m);
                            }}
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert("Edit functionality coming soon!");
                            }}
                            title="Edit monitor"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="action-btn delete"
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
                    </div>
                    <p className="monitor-url">{m.url}</p>
                    {m.recent_checks && m.recent_checks.length > 0 && (
                      <div className="sparkline-wrapper">
                        <Sparkline data={m.recent_checks} />
                      </div>
                    )}
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
                    <span 
                      className="last-check" 
                      title={m.last_check_at ? new Date(m.last_check_at).toLocaleString() : ""}
                    >
                      {m.last_check_at
                        ? getRelativeTime(m.last_check_at)
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
                <Heatmap data={stats.heatmap} />
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
