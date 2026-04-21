import React from "react";
import { Card } from "../ui/Card";
import { StatusBadge } from "../ui/StatusBadge";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import "../../styles/dashboard.css";

interface MonitorCardProps {
  monitor: any;
  incidents: any[];
  onEdit: (monitor: any) => void;
  onDelete: (monitor: any) => void;
}

export function MonitorCard({ monitor, incidents, onEdit, onDelete }: MonitorCardProps) {
  const m = monitor;
  const activeInc = incidents.find(i => i.monitor_id === m.id && !i.resolved_at);
  const isUp = (m.recent_checks && m.recent_checks.length > 0 && m.recent_checks[0] !== null) 
    ? m.recent_checks[0].is_up 
    : m.last_status >= 200 && m.last_status < 300;
  
  const mUptime = m.metrics_24h && m.metrics_24h.length > 0 
    ? (m.metrics_24h.reduce((a: any, b: any) => a + b.uptime_percentage, 0) / m.metrics_24h.length).toFixed(2) 
    : "100.00";
    
  const mAvgResp = m.metrics_24h && m.metrics_24h.length > 0 
    ? Math.round(m.metrics_24h.reduce((a: any, b: any) => a + b.avg_response_time, 0) / m.metrics_24h.length) 
    : 0;
  
  const lastCheck = m.recent_checks && m.recent_checks.length > 0 && m.recent_checks[0] !== null 
    ? m.recent_checks[0] 
    : null;

  let statusDuration = "Online";
  let statusType = isUp ? "ONLINE" : "OFFLINE";
  
  if (activeInc && !isUp) {
    const minsOffline = Math.round((Date.now() - new Date(activeInc.started_at).getTime()) / 60000);
    statusDuration = `Offline for ${minsOffline}m`;
    statusType = "ACTIVE";
  }

  return (
    <Card className="monitor-card">
      <div className="monitor-card-header">
        <div className="monitor-card-title-group">
          <div className="monitor-card-status-row">
            <StatusBadge status={statusType} label={isUp ? "Online" : "Offline"} showDot={false} />
            <strong className="monitor-name">{m.name}</strong>
          </div>
          <span className="monitor-url-subtitle">{m.url}</span>
        </div>
        <div className="monitor-interval-badge">{m.interval_minutes}m</div>
      </div>
      
      <div className="monitor-card-stats-grid">
         <div className="monitor-stat-item">
           <div className="monitor-stat-header">
             <span className="monitor-stat-label">Avg. Response (24h)</span>
             <span className="monitor-stat-value">{mAvgResp}ms</span>
           </div>
           {m.metrics_24h && m.metrics_24h.length > 0 && (
             <div className="monitor-card-mini-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={m.metrics_24h}>
                    <Line type="monotone" dataKey="avg_response_time" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
             </div>
           )}
         </div>
         <div className="monitor-stat-item">
           <span className="monitor-stat-label">Status Note</span>
           <span className={`monitor-stat-duration ${isUp ? "text-green" : "text-red"}`}>
             {statusDuration}
             {!isUp && lastCheck?.error_message && <><br/><span className="error-small">({lastCheck.error_message})</span></>}
           </span>
         </div>
      </div>

      <div className="monitor-uptime-pipeline-section">
          <div className="monitor-pipeline-header">
            <span>Uptime Pipeline <small>(Last 30 checks)</small></span>
            <span className={Number(mUptime) >= 99.0 ? "text-green" : "text-red"}>
               <strong>{mUptime}%</strong>
            </span>
          </div>
         <div className="uptime-pipeline-grid">
            {m.recent_checks && m.recent_checks.slice().reverse().map((chk: any, idx: number) => (
               chk !== null && (
                 <div 
                   key={idx} 
                   className={`uptime-bar ${chk.is_up ? "up" : "down"}`}
                   title={`${new Date(chk.checked_at).toLocaleTimeString()} - ${chk.response_time_ms}ms${!chk.is_up ? ` (${chk.error_message || "Error"})` : ""}`}
                 />
               )
            ))}
         </div>
      </div>
      
      <div className="monitor-card-actions">
        <button className="btn-secondary btn-sm" onClick={() => onEdit(m)}>Configure</button>
        <button className="btn-secondary btn-sm btn-danger-outline" onClick={() => onDelete(m)}>Delete</button>
      </div>
    </Card>
  );
}
