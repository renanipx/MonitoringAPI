import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicStatus } from "../services/api";
import { Card } from "../components/ui/Card";
import { Heatmap } from "../components/monitoring/Heatmap";
import { Globe, Activity } from "lucide-react";
import "../styles/App.css";

export default function PublicStatusPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      getPublicStatus(token)
        .then(setData)
        .catch(() => setError("Status page not found or unavailable"));
    }
  }, [token]);

  if (error) {
    return (
      <div className="app flex-center">
        <Card className="p-8 text-center" style={{ maxWidth: 400 }}>
          <Activity size={48} className="text-red mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-muted">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) {
    return <div className="app flex-center text-muted">Loading status...</div>;
  }

  const isUp = data.last_status >= 200 && data.last_status < 300;

  return (
    <div className="app public-status-page" style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <header className="mb-8" style={{ textAlign: "center" }}>
        <h1 className="text-3xl font-bold mb-2">Service Status</h1>
        <p className="text-muted">Real-time status for {data.name}</p>
      </header>

      <Card className="mb-8 p-6" style={{ 
        backgroundColor: isUp ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
        borderColor: isUp ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)" 
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Globe size={32} className={isUp ? "text-green" : "text-red"} />
            <div>
              <h2 className="text-xl font-bold m-0">{data.name}</h2>
              <p className="text-muted m-0">{data.url}</p>
            </div>
          </div>
          <div className={`status-badge ${isUp ? "status-online" : "status-offline"}`} style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }}>
            <span className="status-dot"></span>
            {isUp ? "All Systems Operational" : "Service Disruption"}
          </div>
        </div>
      </Card>

      <Card className="mb-8 p-6">
        <h3 className="text-lg font-semibold mb-4">Uptime History (30 Days)</h3>
        <Heatmap data={data.heatmap} />
      </Card>

      {data.recent_incidents && data.recent_incidents.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Past Incidents</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {data.recent_incidents.map((inc: any) => (
              <div key={inc.id} style={{ padding: "1rem", border: "1px solid #333", borderRadius: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong>{inc.error_details}</strong>
                  <span className="text-muted">{new Date(inc.started_at).toLocaleString()}</span>
                </div>
                {inc.resolved_at ? (
                  <span className="text-green text-sm">Resolved {new Date(inc.resolved_at).toLocaleString()}</span>
                ) : (
                  <span className="text-red text-sm">Currently Active</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
