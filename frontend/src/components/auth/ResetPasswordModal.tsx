import { useState, type FormEvent } from "react";
import { Modal, ModalActions } from "../ui/Modal";
import { resetPassword } from "../../services/api";
import { Button } from "../ui/Button";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSuccess: () => void;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  token,
  onSuccess,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await resetPassword(token, password);
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create new password"
      subtitle="Choose a strong password and keep it safe."
    >
      <form onSubmit={handleSubmit}>
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <ModalActions>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <Button type="submit" loading={loading} className="submit-btn-glow submit-btn-auth">
            Save new password
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
