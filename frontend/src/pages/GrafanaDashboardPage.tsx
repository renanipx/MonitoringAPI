import { useState, useEffect } from "react";
import { getMetricsOverview, listMonitors } from "../services/api";
import { MonitorForm } from "../components/monitoring/MonitorForm";
import { MetricPanel } from "../components/monitoring/MetricPanel";
import { LogOut, LayoutDashboard, Plus, Globe, Activity, ServerCrash } from "lucide-react";
import { Card } from "../components/ui/Card";
import "../styles/App.css";

type GrafanaDashboardPageProps = {
  user: {
    id: string;
    email: string;
  };
  onLogout: () => void;
};

export default function GrafanaDashboardPage({ user, onLogout }: GrafanaDashboardPageProps) {
  const [overviewMetrics, setOverviewMetrics] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    try {
      const [overviewData, monitorsData] = await Promise.all([
        getMetricsOverview(),
        listMonitors()
      ]);
      setOverviewMetrics(overviewData);
      setMonitors(monitorsData.monitors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const totalMonitors = monitors.length;
  const onlineMonitors = monitors.filter(m => m.last_status >= 200 && m.last_status < 300).length;
  const offlineMonitors = monitors.filter(m => m.last_status >= 500 || m.last_status === 0).length;

  return (
    <div className="app grafana-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-logo">
          <Activity size={28} className="text-sky-400" />
          <h2>Watchdog</h2>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item active"><LayoutDashboard size={18} /> Overview</button>
          <button className="nav-item"><Globe size={18} /> Monitors</button>
          <button className="nav-item"><ServerCrash size={18} /> Incidents</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="user-avatar">{user.email.charAt(0).toUpperCase()}</div>
            <span className="user-email-truncate">{user.email}</span>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <main className="dashboard-content grafana-content">
        <header className="grafana-header">
          <div className="header-title">
            <h1>Platform Overview</h1>
            <p>Real-time metrics and system health</p>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Monitor
          </button>
        </header>

        {loading && monitors.length === 0 ? (
          <div className="loading-state">Loading dashboard...</div>
        ) : (
          <>
            <div className="kpi-grid">
              <Card className="kpi-card">
                <div className="kpi-icon-wrapper text-sky-400"><Globe size={24}/></div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Monitors</span>
                  <span className="kpi-value">{totalMonitors}</span>
                </div>
              </Card>
              <Card className="kpi-card">
                <div className="kpi-icon-wrapper text-green-500"><Activity size={24}/></div>
                <div className="kpi-info">
                  <span className="kpi-label">Online</span>
                  <span className="kpi-value text-green-500">{onlineMonitors}</span>
                </div>
              </Card>
              <Card className="kpi-card">
                <div className="kpi-icon-wrapper text-red-500"><ServerCrash size={24}/></div>
                <div className="kpi-info">
                  <span className="kpi-label">Offline</span>
                  <span className="kpi-value text-red-500">{offlineMonitors}</span>
                </div>
              </Card>
            </div>

            <div className="panels-grid mt-6">
              <div className="panel-col-span-2">
                <MetricPanel 
                  title="Global Average Response Time (24h)" 
                  data={overviewMetrics} 
                  dataKey="avg_response_time" 
                  color="#38bdf8"
                  type="area"
                  unit="ms"
                />
              </div>
              <div className="panel-col-span-1">
                <MetricPanel 
                  title="Global Uptime %" 
                  data={overviewMetrics} 
                  dataKey="uptime_percentage" 
                  color="#22c55e"
                  type="line"
                  unit="%"
                />
              </div>
            </div>

            <div className="monitors-table-section mt-6">
              <Card className="table-card">
                <div className="table-header">
                  <h2>Active Monitors</h2>
                </div>
                <div className="table-responsive">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Target</th>
                        <th>Interval</th>
                        <th>Last Check</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monitors.map(m => {
                        const isUp = m.last_status >= 200 && m.last_status < 300;
                        return (
                          <tr key={m.id}>
                            <td><strong>{m.name}</strong></td>
                            <td>
                              <span className={`status-badge ${isUp ? 'status-online' : 'status-offline'}`}>
                                <span className="status-dot"></span>
                                {isUp ? 'Online' : 'Offline'}
                              </span>
                            </td>
                            <td className="text-muted">{m.url}</td>
                            <td>{m.interval_minutes}m</td>
                            <td>{m.last_check_at ? new Date(m.last_check_at).toLocaleTimeString() : 'Pending'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </>
        )}

      </main>

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal dashboard-modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Monitor</h2>
            <p className="modal-subtitle">Configure advanced checks and alerts</p>
            <MonitorForm onSuccess={() => { setShowAddModal(false); fetchData(); }} />
            <div className="modal-actions mt-4">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
