import type { AppIconName } from "./data";
import { AppIcon } from "./shared";

export function DashboardCard({
  className,
  icon,
  text,
}: {
  className: string;
  icon: AppIconName;
  text: string;
}) {
  return (
    <div className={`floating-task ${className}`}>
      <AppIcon name={icon} />
      <span>{text}</span>
    </div>
  );
}

export function AgentTile({
  title,
  icons,
  status,
}: {
  title: string;
  icons: AppIconName[];
  status: string;
}) {
  return (
    <div className="agent-tile">
      <span className="green-dot" />
      <strong>{title}</strong>
      <div>
        {icons.map((icon) => (
          <AppIcon key={icon} name={icon} />
        ))}
      </div>
      <p>{status}</p>
    </div>
  );
}
