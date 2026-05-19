export default function AdminDashboard() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Admin Dashboard</h1>
      <p style={{ marginTop: 16, color: "#64748b" }}>
        This admin panel is under development. Future features:
      </p>
      <ul style={{ marginTop: 16, paddingLeft: 24, color: "#475569" }}>
        <li>User management</li>
        <li>Template management</li>
        <li>AI prompt management</li>
        <li>Billing & subscription overview</li>
        <li>Safety rule management</li>
        <li>Analytics dashboard</li>
      </ul>
    </main>
  );
}
