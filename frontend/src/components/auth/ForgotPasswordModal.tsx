import { useState, type FormEvent } from "react";
import { Modal, ModalActions } from "../ui/Modal";
import { requestPasswordReset } from "../../services/api";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start password reset";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    onClose();
    setSent(false);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={sent ? "Check your email" : "Reset password"}
      subtitle={
        sent
          ? `If an account exists for ${email}, we sent a link to reset your password.`
          : "Enter the email associated with your account and we will send a reset link."
      }
    >
      {sent ? (
        <ModalActions>
          <button type="button" onClick={handleClose}>
            Back to login
          </button>
        </ModalActions>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <ModalActions>
            <button type="button" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </ModalActions>
        </form>
      )}
    </Modal>
  );
}
