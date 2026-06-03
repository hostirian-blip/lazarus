// Lazarus wordmark — a green "pulse" mark (the heartbeat coming back) + name.
export function Brand({ size = 22, light = false }: { size?: number; light?: boolean }) {
  return (
    <span className="brand" style={light ? { color: "var(--ink)" } : undefined}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2 12h4l2.5 7 4-15 2.5 8H22" />
      </svg>
      Lazarus
    </span>
  );
}
