import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function WebviewPage() {
  const campaignIds = [22,23];

  return (
    <main
      style={{ minHeight: "100vh", padding: "24px", background: "#fafafa" }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800 }}>
          MLA Report Card
        </h1>
        <p style={{ color: "#4b5563", lineHeight: 1.6 }}>
          Open one of the migrated MLA report card campaigns below.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          {campaignIds.map((campaignId) => (
            <Link
              key={campaignId}
              href={`/webview/mla-report-card/${campaignId}`}
              style={{
                borderRadius: "999px",
                border: "1px solid #d1d5db",
                padding: "12px 16px",
                background: "#fff",
                color: "#111827",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Campaign {campaignId}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
