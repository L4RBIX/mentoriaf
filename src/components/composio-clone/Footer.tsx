const footerColumns = [
  ["PLATFORM", "PLATFORM OVERVIEW", "ANTI-FRAUD ENGINE", "ANALYTICS", "IIKO INTEGRATION", "API DOCS"],
  ["ANTI-FRAUD", "CAMERA LOCK", "PHOTO FINGERPRINT", "GEMINI VISION", "RISK ENGINE", "ANTI-COLLUSION", "BLACK BOX AUDIT"],
  ["COMPANY", "ABOUT", "CONTACT", "TERMS", "PRIVACY POLICY"],
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="section-shell footer-grid">
        <div className="footer-brand">
          <span className="font-mono font-semibold tracking-tight text-white text-[1.1rem]">PHYLAX</span>
          <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", opacity: 0.4, fontFamily: "inherit" }}>
            Write-offs under control.
          </p>
        </div>
        {footerColumns.map(([title, ...items]) => (
          <div className="footer-column" key={title}>
            <h3>{title}</h3>
            {items.map((item) => (
              <a href="#" key={item}>
                {item}
              </a>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
