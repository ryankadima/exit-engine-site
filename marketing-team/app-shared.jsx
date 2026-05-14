// Marketing Team OS — shared UI primitives + nav + footer
// Used across all section files. Exposes components on window.

const Logo = ({ size = 18, mono = false }) => (
  <span
    className="nav-logo"
    style={{ fontSize: size, color: mono ? "currentColor" : undefined }}
  >
    E<span className="x" style={mono ? { color: "currentColor" } : undefined}>X</span>IT&nbsp;ENGINE
  </span>
);

const Eyebrow = ({ children, muted = false, onDark = false }) => (
  <div className="eyebrow-row" style={onDark ? { color: "rgba(255,255,255,0.7)" } : undefined}>
    <span className={"eyebrow" + (muted ? " muted" : "")} style={onDark ? { color: "rgba(255,255,255,0.95)" } : undefined}>
      {children}
    </span>
  </div>
);

const SectionNum = ({ n, children }) => (
  <div className="section-num">
    <span className="line" />
    <span>§{n} · {children}</span>
  </div>
);

const ArrowUR = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    style={{ display: "inline-block", verticalAlign: "middle" }}
    aria-hidden="true"
  >
    <path
      d="M4 12 L12 4 M6 4 L12 4 L12 10"
      stroke={color}
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="square"
    />
  </svg>
);

const ArrowR = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    style={{ display: "inline-block", verticalAlign: "middle" }}
    aria-hidden="true"
  >
    <path
      d="M3 8 L13 8 M9 4 L13 8 L9 12"
      stroke={color}
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="square"
    />
  </svg>
);

const Btn = ({ children, kind = "primary", size, block, onClick, disabled, href, style, ...rest }) => {
  const cls = [
    "btn",
    kind === "primary" && "btn-primary",
    kind === "ink" && "btn-ink",
    kind === "ghost" && "btn-ghost",
    size === "sm" && "sm",
    size === "lg" && "lg",
    block && "block",
    rest.className,
  ]
    .filter(Boolean)
    .join(" ");
  const Tag = href ? "a" : "button";
  return (
    <Tag
      className={cls}
      onClick={onClick}
      disabled={disabled}
      href={href}
      style={style}
    >
      {children}
    </Tag>
  );
};

const Chip = ({ children, kind }) => (
  <span className={"chip" + (kind ? " " + kind : "")}>{children}</span>
);

// Sticky page nav
const Nav = () => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    ["The 4R model", "context"],
    ["Diagnostic", "diagnostic"],
    ["4R library", "library"],
    ["Agents", "agents"],
  ];
  const goTo = (id, e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };
  return (
    <nav className={"nav" + (scrolled ? " is-scrolled" : "")}>
      <div className="container nav-inner">
        <a href="#top" onClick={(e) => goTo("top", e)} style={{ display: "inline-flex" }}>
          <Logo size={18} />
        </a>
        <div className="nav-links">
          {links.map(([label, id]) => (
            <a key={id} href={"#" + id} onClick={(e) => goTo(id, e)}>{label}</a>
          ))}
        </div>
        <Btn size="sm" onClick={() => {
          const el = document.getElementById("book");
          if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
        }}>
          Book a call <ArrowUR />
        </Btn>
      </div>
    </nav>
  );
};

// Footer
const Footer = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <Logo size={16} />
      <span>© 2026 EXIT ENGINE · BUILT FOR exitengine.us/team</span>
      <span>RYAN@EXITENGINE.US</span>
    </div>
  </footer>
);

// Smooth scroll helper
function scrollToId(id, offset = 80) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.offsetTop - offset, behavior: "smooth" });
}

// Tiny utility: copy text to clipboard with feedback
function useCopy(timeoutMs = 1800) {
  const [copied, setCopied] = React.useState(false);
  const copy = React.useCallback((text) => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeoutMs);
    } catch (e) {
      // fallback: ignore — clipboard not available
    }
  }, [timeoutMs]);
  return [copied, copy];
}

Object.assign(window, {
  Logo, Eyebrow, SectionNum, ArrowUR, ArrowR, Btn, Chip,
  Nav, Footer, scrollToId, useCopy,
});
