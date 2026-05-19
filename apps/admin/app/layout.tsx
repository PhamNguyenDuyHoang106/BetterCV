export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
          <strong>BetterCV Admin</strong>
          <span style={{ color: "#64748b", fontSize: 14 }}>Admin Panel</span>
        </nav>
        {children}
      </body>
    </html>
  );
}
