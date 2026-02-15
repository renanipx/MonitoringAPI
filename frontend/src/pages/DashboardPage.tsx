import "../App.css";

type DashboardPageProps = {
  user: {
    id: string;
    email: string;
  };
  onLogout: () => void;
};

function DashboardPage({ user, onLogout }: DashboardPageProps) {
  return (
    <div className="app">
      <div className="card">
        <h1>Monitoring dashboard</h1>
        <p className="card-subtitle">
          Soon you will see the real-time status of your APIs here.
        </p>
        <p>Signed in as {user.email}</p>
        <button type="button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
