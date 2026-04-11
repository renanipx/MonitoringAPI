import { useState, type FormEvent, useEffect } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { createMonitor, updateMonitor } from "../../services/api";
import { Plus, Save } from "lucide-react";
import { useToast } from "../ui/Toast";

interface MonitorFormProps {
  onSuccess: () => void;
  initialData?: any; // To allow editing
}

export function MonitorForm({ onSuccess, initialData }: MonitorFormProps) {
  const { showToast } = useToast();
  const [name, setName] = useState(initialData?.name || "");
  const [url, setUrl] = useState(initialData?.url || "");
  const [interval, setIntervalValue] = useState(initialData?.interval_minutes || 5);
  const [webhookUrl, setWebhookUrl] = useState(initialData?.webhook_url || "");
  const [method, setMethod] = useState(initialData?.method || "GET");
  const [expectedStatusCode, setExpectedStatusCode] = useState(initialData?.expected_status_code || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setUrl(initialData.url || "");
      setIntervalValue(initialData.interval_minutes || 5);
      setWebhookUrl(initialData.webhook_url || "");
      setMethod(initialData.method || "GET");
      setExpectedStatusCode(initialData.expected_status_code || "");
    }
  }, [initialData]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const code = expectedStatusCode ? parseInt(expectedStatusCode as string) : null;
      if (initialData?.id) {
        await updateMonitor(initialData.id, name, url, interval, webhookUrl, method, code);
        showToast("Monitor updated successfully!", "success");
      } else {
        await createMonitor(name, url, interval, webhookUrl, method, code);
        showToast("Monitor created successfully!", "success");
      }
      
      if (!initialData) {
        setName("");
        setUrl("");
        setIntervalValue(5);
        setWebhookUrl("");
        setMethod("GET");
        setExpectedStatusCode("");
      }
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save monitor";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="monitor-form">
      {initialData && (
        <div className="editing-indicator" style={{ marginBottom: '1rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }}>
          <Save size={16} /> Editing Mode Active
        </div>
      )}
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
        <div className="input-group">
          <label className="input-label">HTTP Method</label>
          <select
            className="form-select"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
        <Input
          label="Expected Status Code (Optional)"
          placeholder="e.g. 200 (default: 2xx)"
          type="number"
          value={expectedStatusCode}
          onChange={(e) => setExpectedStatusCode(e.target.value)}
        />
        <Input
          label="Discord/Slack Webhook URL (Optional)"
          placeholder="https://discord.com/api/webhooks/..."
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
        />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions mt-4">
        <Button type="submit" loading={loading} className="submit-btn" style={{marginTop: "1rem"}}>
          {initialData ? <Save size={18} /> : <Plus size={18} />}
          <span>{initialData ? "Save Changes" : "Create Monitor"}</span>
        </Button>
      </div>
    </form>
  );
}
