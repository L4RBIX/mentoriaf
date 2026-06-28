export function CodeCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`terminal-panel ${className ?? ""}`}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export function SandboxInstance({ id, code }: { id: string; code: string }) {
  return (
    <div className="sandbox-instance">
      <div className="instance-head">
        <span>{id}</span>
        <em>completed</em>
      </div>
      <div className="instance-lines">
        {code.split("\n").map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    </div>
  );
}
