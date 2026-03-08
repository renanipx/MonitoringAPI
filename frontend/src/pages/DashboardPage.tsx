import { useState } from "react";
import { Card, CardDescription, CardTitle } from "../components/ui/Card";
import { MonitorForm } from "../components/monitoring/MonitorForm";
import { MonitorList } from "../components/monitoring/MonitorList";
import { LogOut, LayoutDashboard, Plus } from "lucide-react";
import "../styles/App.css";

type DashboardPageProps = {
  user: {
    id: string;
    email: string;
  };
  onLogout: () => void;
};

function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMonitorAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="app dashboard-app">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-left">
            <LayoutDashboard size={24} className="text-sky-400" />
            <h1>Monitoring Dashboard</h1>
          </div>
          <div className="header-right">
            <span className="user-email">{user.email}</span>
            <button className="logout-btn" onClick={onLogout} title="Log out">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          <section className="add-monitor-section">
            <Card className="add-card">
              <div className="card-header-with-icon">
                <Plus size={20} className="text-green-500" />
                <CardTitle>Add New Monitor</CardTitle>
              </div>
              <CardDescription>
                Register a new API or website to start monitoring its uptime and performance.
              </CardDescription>
              <MonitorForm onSuccess={handleMonitorAdded} />
            </Card>
          </section>

          <section className="monitors-section mt-8">
            <div className="section-title-row mb-4">
              <Activity size={20} className="text-sky-400" />
              <h2>Your Monitors</h2>
            </div>
            <MonitorList refreshKey={refreshKey} />
          </section>
        </main>
      </div>
    </div>
  );
}

// Minimal extra styles for dashboard layout
const Activity = ({ size, className }: { size: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export default DashboardPage;
