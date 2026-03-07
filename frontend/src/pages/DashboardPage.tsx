import { Card, CardDescription, CardTitle } from "../components/ui/Card";
import "../styles/App.css";

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
      <Card>
        <CardTitle>Monitoring dashboard</CardTitle>
        <CardDescription>
          Soon you will see the real-time status of your APIs here.
        </CardDescription>
        <p>Signed in as {user.email}</p>
        <button type="button" onClick={onLogout}>
          Log out
        </button>
      </Card>
    </div>
  );
}

export default DashboardPage;
