import type { AppIconName } from "./data";
import { appIcons } from "./data";

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="kicker">
      <span />
      {children}
    </div>
  );
}

export function AppIcon({ name }: { name: AppIconName }) {
  return <img src={appIcons[name]} alt="" />;
}

export function ButtonLink({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <a className={className} href="#">
      {children}
    </a>
  );
}
