export default function Home() {
  return (
    <main style={{ padding: 48, fontFamily: "system-ui", maxWidth: 640 }}>
      <h1>Lazarus</h1>
      <p>Self-serve lead re-nurturing. Upload your dead leads, bring them back.</p>
      <p style={{ display: "flex", gap: 12 }}>
        <a
          href="/signup"
          style={{
            padding: "10px 16px",
            background: "#111",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Get started
        </a>
        <a
          href="/login"
          style={{
            padding: "10px 16px",
            border: "1px solid #ccc",
            borderRadius: 6,
            textDecoration: "none",
            color: "#111",
          }}
        >
          Log in
        </a>
      </p>
    </main>
  );
}
