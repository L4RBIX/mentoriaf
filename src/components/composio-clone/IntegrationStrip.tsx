type LogoItem =
  | { type: "img"; src: string; alt: string; height?: number; screen?: boolean }
  | { type: "brand"; label: string; italic?: boolean };

const logos: LogoItem[] = [
  { type: "img", src: "/images/mentoria-logo-transparent.png", alt: "Mentoria", height: 84 },
  { type: "img", src: "/images/bhn-logo-white.svg", alt: "Bahandi", height: 52 },
  { type: "brand", label: "iiko", italic: true },
];

const repeated = [...logos, ...logos, ...logos, ...logos];

export function IntegrationStrip() {
  return (
    <div className="logo-marquee" aria-label="PHYLAX ecosystem">
      <div className="logo-track">
        {repeated.map((item, i) => {
          if (item.type === "img") {
            return (
              <img
                key={i}
                src={item.src}
                alt={item.alt}
                className={item.screen ? "logo-img-screen" : "logo-img"}
                style={{ height: item.height ?? 26 }}
              />
            );
          }
          return (
            <span
              key={i}
              className="logo-brand"
              style={item.italic ? { fontStyle: "italic" } : undefined}
            >
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
