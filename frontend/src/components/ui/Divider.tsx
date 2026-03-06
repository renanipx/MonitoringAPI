export function Divider({ children }: { children?: React.ReactNode }) {
  return (
    <div className="divider">
      {children && <span>{children}</span>}
    </div>
  );
}
