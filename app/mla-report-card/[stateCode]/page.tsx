import type { CSSProperties } from "react"

export const dynamic = "force-dynamic"

const BLOCKER_BY_STATE = {
  rj: {
    link: "https://dainik.bhaskar.com/nr3RLgz8dQb",
    text: "राजस्थान के 200 विधायकों के भास्कर सर्वे का रिजल्ट और रिपोर्ट कार्ड केवल दैनिक भास्कर एप पर देख सकते हैं।\nविधायकों का एक साल का परफॉर्मेंस रिपोर्ट कार्ड देखने के लिए अभी डाउनलोड करें दैनिक भास्कर एप।",
  },
  mp: {
    link: "https://dainik.bhaskar.com/dmUObLN7dQb",
    text: "मध्यप्रदेश के 230 विधायकों के भास्कर सर्वे का रिजल्ट और रिपोर्ट कार्ड केवल दैनिक भास्कर एप पर देख सकते हैं।\nविधायकों का एक साल का परफॉर्मेंस रिपोर्ट कार्ड देखने के लिए अभी डाउनलोड करें दैनिक भास्कर एप।",
  },
  cg: {
    link: "https://dainik.bhaskar.com/TlDs2Vn8dQb",
    text: "छत्तीसगढ़ के 90 विधायकों के भास्कर सर्वे का रिजल्ट और रिपोर्ट कार्ड केवल दैनिक भास्कर एप पर देख सकते हैं।\nविधायकों का एक साल का परफॉर्मेंस रिपोर्ट कार्ड देखने के लिए अभी डाउनलोड करें दैनिक भास्कर एप।",
  },
  up: {
    link: "https://example.com/up-mla-report-card",
    text: "उत्तर प्रदेश के विधायक रिपोर्ट कार्ड और सर्वे रिजल्ट फिलहाल केवल दैनिक भास्कर एप पर उपलब्ध हैं।\nपूरा अनुभव देखने के लिए अभी ऐप डाउनलोड करें।",
  },
} as const

type StateCode = keyof typeof BLOCKER_BY_STATE

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18.3 5.71C17.91 5.32 17.28 5.32 16.89 5.71L12 10.59L7.11 5.7C6.72 5.31 6.09 5.31 5.7 5.7C5.31 6.09 5.31 6.72 5.7 7.11L10.59 12L5.7 16.89C5.31 17.28 5.31 17.91 5.7 18.3C6.09 18.69 6.72 18.69 7.11 18.3L12 13.41L16.89 18.3C17.28 18.69 17.91 18.69 18.3 18.3C18.69 17.91 18.69 17.28 18.3 16.89L13.41 12L18.3 7.11C18.68 6.73 18.68 6.09 18.3 5.71Z"
        fill="#fff"
      />
    </svg>
  )
}

function RoundedLogo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "93px",
        height: "93px",
        borderRadius: "18px",
        background: "#fff",
        color: "#000",
        fontWeight: 800,
        lineHeight: 0.95,
        position: "relative",
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "999px",
          background: "#ff8400",
          position: "absolute",
          top: "10px",
        }}
      />
      <div style={{ marginTop: "14px", fontSize: "20px" }}>दैनिक</div>
      <div style={{ fontSize: "20px" }}>भास्कर</div>
    </div>
  )
}

function StoreBadge({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "160px",
        height: "46px",
        borderRadius: "6px",
        background: "#000",
        color: "#fff",
        fontSize: "14px",
        fontWeight: 700,
      }}
    >
      {label}
    </div>
  )
}

export default async function MlaReportCardBlockerPage({
  params,
}: {
  params: Promise<{ stateCode: string }>
}) {
  const { stateCode } = await params
  const normalizedStateCode = stateCode.toLowerCase() as StateCode
  const blockerData =
    BLOCKER_BY_STATE[normalizedStateCode] ?? BLOCKER_BY_STATE.up

  const bannerImg = `https://images.bhaskarassets.com/thumb/600x0/web2images/web-frontend/mla-report-card/${normalizedStateCode}-result-og-image-hi.jpg`
  const qrCodeImg = `https://images.bhaskarassets.com/thumb/800x0/web2images/web-frontend/mla-report-card/${normalizedStateCode.toUpperCase()}_MLA_Results_QR-code-pos-hi.jpeg`

  const containerStyle: CSSProperties = {
    height: "100vh",
    width: "100%",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 4,
    background: "#1c1c1c",
  }

  const closeButtonStyle: CSSProperties = {
    display: "flex",
    position: "absolute",
    top: "28px",
    right: "28px",
    width: "46px",
    height: "46px",
    background: "#b4b4b4",
    borderRadius: "50%",
    cursor: "pointer",
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
  }

  const wrapperBoxStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    position: "absolute",
    justifyContent: "space-between",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "1024px",
    zIndex: 2,
  }

  const imageBoxStyle: CSSProperties = {
    width: "600px",
    borderRadius: "12px",
    border: "1px solid #eaeaea",
    overflow: "hidden",
    background: "#fff1c9",
  }

  const contentBoxStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "310px",
  }

  const logoWrapperStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    display: "block",
    border: "2px solid #353637",
    borderRadius: "20px",
    width: "96px",
    height: "96px",
  }

  const textStyle: CSSProperties = {
    display: "block",
    color: "#e4e6eb",
    whiteSpace: "pre-line",
    textAlign: "center",
    fontSize: "24px",
    lineHeight: "36px",
    marginTop: "24px",
    fontWeight: 700,
  }

  const appDownloadScannerStyle: CSSProperties = {
    marginTop: "36px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    maxWidth: "340px",
    padding: "10px",
    background: "#353637",
    borderRadius: "8px",
  }

  const qrStyle: CSSProperties = {
    padding: "4px",
    background: "#ffffff",
    height: "140px",
    width: "140px",
  }

  const storeInfoStyle: CSSProperties = {
    marginLeft: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
  }

  const appTextStyle: CSSProperties = {
    textAlign: "center",
    fontSize: "18px",
    fontWeight: 700,
    lineHeight: "normal",
    color: "#e4e6eb",
    paddingBottom: "6px",
  }

  return (
    <div style={containerStyle}>
      <a href="/mla-report-card" aria-label="Close" style={closeButtonStyle}>
        <CloseIcon />
      </a>

      <div style={wrapperBoxStyle}>
        <div style={imageBoxStyle}>
          <img
            style={{ display: "block", width: "100%", borderRadius: "12px" }}
            src={bannerImg}
            alt="Survey Banner"
          />
        </div>

        <div style={contentBoxStyle}>
          <div style={logoWrapperStyle}>
            <RoundedLogo />
          </div>

          <p style={textStyle}>{blockerData.text}</p>

          <div style={appDownloadScannerStyle}>
            <img style={qrStyle} src={qrCodeImg} alt="DB QR Code" />

            <div style={storeInfoStyle}>
              <span style={appTextStyle}>
                एप डाउनलोड करने के लिए QR स्कैन करें
              </span>
              <a
                target="_blank"
                href={blockerData.link}
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <StoreBadge label="GET IT ON Google Play" />
              </a>
              <a
                target="_blank"
                href={blockerData.link}
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <StoreBadge label="Download on the App Store" />
              </a>
            </div>
          </div>

          <a
            href={blockerData.link}
            target="_self"
            style={{
              display: "none",
              width: "100%",
              marginTop: "24px",
              fontSize: "18px",
              fontWeight: 600,
              lineHeight: "28px",
              borderRadius: "8px",
              background: "#ff8400",
              padding: "10px 16px",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            भास्कर ऐप डाउनलोड करें
          </a>
        </div>
      </div>
    </div>
  )
}
