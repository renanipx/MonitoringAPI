import { useState, useEffect } from "react";
import { getMetricsOverview, listMonitors, getRecentIncidents, deleteMonitor } from "../services/api";
import { MonitorForm } from "../components/monitoring/MonitorForm";
import { MetricPanel } from "../components/monitoring/MetricPanel";
import { MiniMetricCard } from "../components/monitoring/MiniMetricCard";
import { Plus, Globe, Activity, ServerCrash, Clock, CheckCircle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
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
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<any>(null);
  const [monitorToDelete, setMonitorToDelete] = useState<any>(null);
  const [keepIncidentsOnDelete, setKeepIncidentsOnDelete] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [overviewData, monitorsData, incidentsData] = await Promise.all([
        getMetricsOverview(),
        listMonitors(),
        getRecentIncidents()
      ]);
      setOverviewMetrics(overviewData);
      setMonitors(monitorsData.monitors || []);
      setIncidents(incidentsData.incidents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!monitorToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMonitor(monitorToDelete.id, keepIncidentsOnDelete);
      setMonitorToDelete(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete monitor:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const totalMonitors = monitors.length;
  const onlineMonitors = monitors.filter(m => {
    if (m.recent_checks && m.recent_checks.length > 0 && m.recent_checks[0] !== null) return m.recent_checks[0].is_up;
    return m.last_status >= 200 && m.last_status < 300;
  }).length;
  const offlineMonitors = monitors.filter(m => {
    if (m.recent_checks && m.recent_checks.length > 0 && m.recent_checks[0] !== null) return !m.recent_checks[0].is_up;
    return m.last_status >= 400 || m.last_status === 0;
  }).length;

  const current24h = overviewMetrics.slice(-24).filter(x => typeof x.avg_response_time === 'number');
  const prev24h = overviewMetrics.slice(-48, -24).filter(x => typeof x.avg_response_time === 'number');
  
  const currentAvgResponseTime = current24h.length > 0 ? Math.round(current24h.reduce((acc, curr) => acc + curr.avg_response_time, 0) / current24h.length) : 0;
  const prevAvgResponseTime = prev24h.length > 0 ? Math.round(prev24h.reduce((acc, curr) => acc + curr.avg_response_time, 0) / prev24h.length) : 0;
  const responseTimeTrend = currentAvgResponseTime === prevAvgResponseTime ? 'neutral' : currentAvgResponseTime < prevAvgResponseTime ? 'up' : 'down'; 

  const currentUptime = current24h.length > 0 ? current24h.reduce((acc, curr) => acc + curr.uptime_percentage, 0) / current24h.length : 100;
  const totalChecks24h = overviewMetrics.slice(-24).reduce((acc, curr) => acc + (curr.total_checks || 0), 0);

  const totalIncidents24h = incidents.filter(i => new Date(i.started_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
  const activeIncidentsCount = incidents.filter(i => !i.resolved_at).length;

  // New Insights
  const resolvedIncidents = incidents.filter(i => i.resolved_at);
  const avgIncidentDurationMs = resolvedIncidents.length > 0 
    ? resolvedIncidents.reduce((acc, i) => acc + (new Date(i.resolved_at).getTime() - new Date(i.started_at).getTime()), 0) / resolvedIncidents.length 
    : 0;
  const avgIncidentDurationStr = avgIncidentDurationMs > 0 
    ? `${Math.round(avgIncidentDurationMs / 60000)}m` 
    : '0m';

  const mostUnstableMonitor = monitors.length > 0 
    ? [...monitors].sort((a, b) => {
        const uA = a.metrics_24h && a.metrics_24h.length > 0 ? a.metrics_24h.reduce((acc: any, curr: any) => acc + curr.uptime_percentage, 0) / a.metrics_24h.length : 100;
        const uB = b.metrics_24h && b.metrics_24h.length > 0 ? b.metrics_24h.reduce((acc: any, curr: any) => acc + curr.uptime_percentage, 0) / b.metrics_24h.length : 100;
        return uA - uB; // Lowest uptime first
      })[0]
    : null;


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
              <MiniMetricCard 
                title="Global Avg Response Time"
                value={currentAvgResponseTime}
                unit="ms"
                icon={<Clock size={20} color="#38bdf8" />}
                trendDirection={responseTimeTrend}
                trendValue={prevAvgResponseTime ? `${Math.abs(currentAvgResponseTime - prevAvgResponseTime)}ms` : undefined}
                chartData={current24h}
                chartDataKey="avg_response_time"
                chartColor="#38bdf8"
              />
              
              <MiniMetricCard 
                title="Global Uptime %"
                value={currentUptime % 1 !== 0 ? currentUptime.toFixed(2) : currentUptime}
                unit="%"
                icon={<CheckCircle size={20} color="#22c55e" />}
                trendDirection={currentUptime >= 99.9 ? 'up' : currentUptime < 95.0 ? 'down' : 'neutral'}
                trendText={currentUptime >= 99.9 ? 'Excellent' : currentUptime < 95.0 ? 'Critical' : 'Degraded'}
                chartData={current24h}
                chartDataKey="uptime_percentage"
                chartColor="#22c55e"
              />

              <MiniMetricCard 
                title="Incidents (24h)"
                value={totalIncidents24h}
                icon={<ServerCrash size={20} color="#f87171" />}
                trendDirection={totalIncidents24h === 0 ? 'up' : 'down'}
                trendValue={avgIncidentDurationStr !== '0m' ? `Avg: ${avgIncidentDurationStr}` : undefined}
                trendText={activeIncidentsCount > 0 ? `${activeIncidentsCount} active now` : 'All resolved'}
              />

              <MiniMetricCard 
                title="Most Unstable"
                value={mostUnstableMonitor ? mostUnstableMonitor.name : 'None'}
                icon={<Activity size={20} color="#a855f7" />}
                trendDirection={mostUnstableMonitor ? 'down' : 'neutral'}
                trendText={mostUnstableMonitor && mostUnstableMonitor.metrics_24h && mostUnstableMonitor.metrics_24h.length > 0 
                    ? `Uptime: ${(mostUnstableMonitor.metrics_24h.reduce((acc:any, curr:any) => acc + curr.uptime_percentage, 0) / mostUnstableMonitor.metrics_24h.length).toFixed(2)}%`
                    : '100% Uptime'
                }
              />
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
                        const isUp = (m.recent_checks && m.recent_checks.length > 0 && m.recent_checks[0] !== null) 
                          ? m.recent_checks[0].is_up 
                          : m.last_status >= 200 && m.last_status < 300;
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
          <div className="tab-pane monitors-grid mt-4">
            {monitors.map(m => {
              const activeInc = incidents.find(i => i.monitor_id === m.id && !i.resolved_at); // Wait, incidents are loaded but may not map exactly to this if not top 20, but it gets top 20 recent. Actually we should compute from `recent_checks`.
              const isUp = (m.recent_checks && m.recent_checks.length > 0 && m.recent_checks[0] !== null) ? m.recent_checks[0].is_up : m.last_status >= 200 && m.last_status < 300;
              const mUptime = m.metrics_24h && m.metrics_24h.length > 0 ? (m.metrics_24h.reduce((a:any,b:any) => a + b.uptime_percentage, 0) / m.metrics_24h.length).toFixed(2) : 100;
              const mAvgResp = m.metrics_24h && m.metrics_24h.length > 0 ? Math.round(m.metrics_24h.reduce((a:any,b:any) => a + b.avg_response_time, 0) / m.metrics_24h.length) : 0;
              
              const lastCheck = m.recent_checks && m.recent_checks.length > 0 && m.recent_checks[0] !== null ? m.recent_checks[0] : null;

              // Very naive status duration approach since we lack rigorous status history transition rows
              let statusDuration = 'Status duration untracked';
              if (activeInc && !isUp) {
                const minsOffline = Math.round((Date.now() - new Date(activeInc.started_at).getTime()) / 60000);
                statusDuration = `Offline for ${minsOffline}m`;
              } else if (isUp) {
                statusDuration = `Online`;
              }
              
              return (
                <Card key={m.id} style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '1rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '1rem', width: '100%', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`status-badge ${isUp ? 'status-online' : 'status-offline'}`}>
                          <span className="status-dot"></span>{isUp ? 'Online' : 'Offline'}
                        </span>
                        <strong style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{m.name}</strong>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{m.url} • {m.interval_minutes}m interval</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', flexWrap: 'wrap' }}>
                     <div style={{ flex: 1, minWidth: '120px', position: 'relative' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 2, position: 'relative' }}>
                         <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Avg. Response (24h)</span>
                         <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>{mAvgResp}ms</span>
                       </div>
                       {m.metrics_24h && m.metrics_24h.length > 0 && (
                         <div style={{ position: 'absolute', bottom: -10, left: -10, width: 'calc(100% + 20px)', height: '40px', opacity: 0.5, pointerEvents: 'none' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={m.metrics_24h}>
                                <Line type="monotone" dataKey="avg_response_time" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                              </LineChart>
                            </ResponsiveContainer>
                         </div>
                       )}
                     </div>
                     <div style={{ flex: 1, minWidth: '120px' }}>
                       <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Status Note</span>
                       <span style={{ fontSize: '0.85rem', color: isUp ? '#4ade80' : '#f87171' }}>
                         {statusDuration}
                         {!isUp && lastCheck?.error_message && <><br/>({lastCheck.error_message})</>}
                       </span>
                     </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                       <span>Uptime Pipeline (Last 30 checks)</span>
                       <span style={{color: Number(mUptime) >= 99.0 ? '#4ade80' : '#f87171'}}>{mUptime}% / 24h</span>
                     </div>
                     <div style={{ display: 'flex', gap: '2px', height: '24px' }}>
                        {m.recent_checks && m.recent_checks.slice().reverse().map((chk: any, idx: number) => (
                           chk !== null && <div key={idx} style={{ flex: 1, backgroundColor: chk.is_up ? '#22c55e' : '#ef4444', borderRadius: '2px', opacity: chk.is_up ? 0.7 : 1, transition: 'all 0.2s', cursor: 'pointer' }} title={`${new Date(chk.checked_at).toLocaleTimeString()} - ${chk.response_time_ms}ms`} />
                        ))}
                     </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={() => { setEditingMonitor(m); setShowAddModal(true); }}>Configure</button>
                    <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => setMonitorToDelete(m)}>Delete</button>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="tab-pane mt-4">
            {incidents.length === 0 ? (
              <Card className="table-card" style={{ maxWidth: 'none', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                No incidents reported recently.
              </Card>
            ) : (
              <Card className="table-card" style={{ maxWidth: 'none' }}>
                <div className="table-responsive">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Monitor</th>
                        <th>Status</th>
                        <th>Started At</th>
                        <th>Resolved At</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidents.map(inc => (
                        <tr key={inc.id}>
                          <td><strong>{inc.monitor_name}</strong></td>
                          <td>
                            <span className={`status-badge ${inc.resolved_at ? 'status-online' : 'status-offline'}`}>
                              <span className="status-dot"></span>
                              {inc.resolved_at ? 'Resolved' : 'Active'}
                            </span>
                          </td>
                          <td>{new Date(inc.started_at).toLocaleString()}</td>
                          <td>{inc.resolved_at ? new Date(inc.resolved_at).toLocaleString() : 'Ongoing'}</td>
                          <td className="text-muted" style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={inc.error_details}>{inc.error_details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
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

      {monitorToDelete && (
        <div className="modal-backdrop" onClick={() => setMonitorToDelete(null)}>
          <div className="modal dashboard-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2 style={{ color: '#ef4444' }}>Delete Monitor?</h2>
            <p className="modal-subtitle" style={{ marginBottom: '1.5rem' }}>This will stop monitoring immediately.</p>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#f8fafc' }}>
                  <input 
                    type="checkbox" 
                    checked={keepIncidentsOnDelete}
                    onChange={(e) => setKeepIncidentsOnDelete(e.target.checked)}
                    style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
                  />
                  Keep incidents history
               </label>
               <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 1.5rem' }}>If unchecked, all related incidents will be deleted permanently.</p>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setMonitorToDelete(null)} disabled={isDeleting} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="btn-danger">{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
