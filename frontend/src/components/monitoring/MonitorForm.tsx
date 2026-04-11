import { useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { createMonitor } from "../../services/api";
import { Plus } from "lucide-react";
import { useToast } from "../ui/Toast";

interface MonitorFormProps {
  onSuccess: () => void;
}

export function MonitorForm({ onSuccess }: MonitorFormProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [interval, setIntervalValue] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createMonitor(name, url, interval);
      setName("");
      setUrl("");
      setIntervalValue(5);
      showToast("Monitor created successfully!", "success");
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create monitor";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="monitor-form">
      <div className="form-grid">
        <Input
          label="Monitor name"
          placeholder="e.g. Payments API"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="URL to monitor"
          placeholder="https://api.example.com/health"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <div className="input-group">
          <label className="input-label">Check interval</label>
          <select
            className="form-select"
            value={interval}
            onChange={(e) => setIntervalValue(Number(e.target.value))}
            required
          >
            <option value={1}>1 min</option>
            <option value={5}>5 min</option>
            <option value={10}>10 min</option>
            <option value={30}>30 min</option>
          </select>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <Button type="submit" loading={loading} className="submit-btn">
          <Plus size={18} />
          <span>Create Monitor</span>
        </Button>
      </div>
    </form>
  );
}
