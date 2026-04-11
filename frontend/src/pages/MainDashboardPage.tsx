import { useState, useEffect } from "react";
import { getMetricsOverview, listMonitors } from "../services/api";
import { MonitorForm } from "../components/monitoring/MonitorForm";
import { MetricPanel } from "../components/monitoring/MetricPanel";
import { Plus, Globe, Activity, ServerCrash } from "lucide-react";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { DashboardLayout } from "../components/layout/DashboardLayout";

type MainDashboardPageProps = {
  user: {
    id: string;
    email: string;
  };
  onLogout: () => void;
};

export default function MainDashboardPage({ user, onLogout }: MainDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'monitors' | 'incidents'>('overview');
  const [overviewMetrics, setOverviewMetrics] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<any>(null);

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
    <>
      <DashboardLayout 
        user={user} 
        onLogout={onLogout} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      >
        <PageHeader 
          title={activeTab === 'overview' ? 'Platform Overview' : activeTab === 'monitors' ? 'Manage Monitors' : 'Recent Incidents'}
          subtitle={activeTab === 'overview' ? 'Real-time metrics and system health' : activeTab === 'monitors' ? 'View and edit your existing monitors' : 'A history of downtimes across your monitors.'}
        action={
          <button className="btn-primary" onClick={() => { setEditingMonitor(null); setShowAddModal(true); }}>
            <Plus size={16} /> Add Monitor
          </button>
        }
      />

      {loading && monitors.length === 0 ? (
          <div className="loading-state">Loading dashboard...</div>
        ) : activeTab === 'overview' ? (
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
              <Card className="table-card" style={{ maxWidth: 'none' }}>
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
        ) : activeTab === 'monitors' ? (
          <div className="tab-pane">
            <Card className="table-card" style={{ maxWidth: 'none' }}>
                <div className="table-responsive">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Name/URL</th>
                        <th>Status</th>
                        <th>Method</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monitors.map(m => {
                        const isUp = m.last_status >= 200 && m.last_status < 300;
                        return (
                          <tr key={m.id}>
                            <td>
                              <strong>{m.name}</strong>
                              <br/><span style={{fontSize: '0.8rem', color: '#94a3b8'}}>{m.url}</span>
                            </td>
                            <td>
                              <span className={`status-badge ${isUp ? 'status-online' : 'status-offline'}`}>
                                <span className="status-dot"></span>
                                {isUp ? 'Online' : 'Offline'}
                              </span>
                            </td>
                            <td>{m.method || 'GET'}</td>
                            <td>
                              <button className="btn-secondary" style={{padding: '0.25rem 0.5rem'}} onClick={() => { setEditingMonitor(m); setShowAddModal(true); }}>Edit</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
            </Card>
          </div>
        ) : (
          <div className="tab-pane">
            <Card className="table-card mt-4" style={{ maxWidth: 'none', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              No incidents reported recently.
            </Card>
          </div>
        )}

    </DashboardLayout>

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal dashboard-modal" onClick={e => e.stopPropagation()}>
            <h2>{editingMonitor ? 'Edit Monitor' : 'Create New Monitor'}</h2>
            <p className="modal-subtitle">Configure advanced checks and alerts</p>
            <MonitorForm onSuccess={() => { setShowAddModal(false); fetchData(); }} initialData={editingMonitor} />
            <div className="modal-actions mt-4">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
