import { Button } from "../ui/Button";

interface GoogleLoginButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export function GoogleLoginButton({ onClick, loading }: GoogleLoginButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="social-button social-google"
      onClick={onClick}
      disabled={loading}
    >
      <span className="social-icon">G</span>
      <span>Continue with Google</span>
    </Button>
  );
}
