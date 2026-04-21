import { ReactNode, useState } from "react";
import { Activity, LayoutDashboard, Globe, ServerCrash, LogOut, Menu, X } from "lucide-react";

interface DashboardLayoutProps {
  user: { email: string };
  onLogout: () => void;
  activeTab: 'overview' | 'monitors' | 'incidents';
  onTabChange: (tab: 'overview' | 'monitors' | 'incidents') => void;
  children: ReactNode;
}

export function DashboardLayout({ user, onLogout, activeTab, onTabChange, children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="main-dashboard-wrapper">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <div className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <Activity size={28} className="text-sky-400" />
          <h2>Watchdog</h2>
          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { onTabChange('overview'); setIsMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={18} /> Overview
          </button>
          <button 
            className={`nav-item ${activeTab === 'monitors' ? 'active' : ''}`}
            onClick={() => { onTabChange('monitors'); setIsMobileMenuOpen(false); }}
          >
            <Globe size={18} /> Monitors
          </button>
          <button 
            className={`nav-item ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => { onTabChange('incidents'); setIsMobileMenuOpen(false); }}
          >
            <ServerCrash size={18} /> Incidents
          </button>
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

      <main className="dashboard-main-content">
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <h2>Watchdog</h2>
        </div>
        <div className="dashboard-scrollable-area">
          {children}
        </div>
      </main>
    </div>
  );
}
