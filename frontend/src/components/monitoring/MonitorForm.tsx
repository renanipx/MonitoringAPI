import { useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { createMonitor } from "../../services/api";

interface MonitorFormProps {
  onSuccess: () => void;
}

export function MonitorForm({ onSuccess }: MonitorFormProps) {
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
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create monitor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="monitor-form">
      <div className="form-grid">
        <Input
          label="Monitor name"
          placeholder="My API"
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
        <Input
          label="Interval (minutes)"
          type="number"
          min={1}
          max={60}
          value={interval}
          onChange={(e) => setIntervalValue(Number(e.target.value))}
          required
        />
      </div>
      {error && <p className="error">{error}</p>}
      <Button type="submit" loading={loading} className="mt-4">
        Add Monitor
      </Button>
    </form>
  );
}
