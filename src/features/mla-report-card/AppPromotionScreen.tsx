/* eslint-disable @next/next/no-img-element */
import type { MlaReportCardData } from "./types"
import styles from "./app-promotion.module.css"

type Props = {
  data: MlaReportCardData
}

export function AppPromotionScreen({ data }: Props) {
  const promotion = data.meta.appPromotion
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(data.meta.deeplink)}`

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.visualWrap}>
          <img
            className={styles.visual}
            src={data.meta.ogImage}
            alt={promotion.title}
          />
        </div>

        <div className={styles.content}>
          <div className={styles.logoWrap} aria-hidden="true">
            <img className={styles.logoMark} src={promotion.logo} alt="" />
          </div>

          <p className={styles.bodyText}>{promotion.bodyText}</p>

          <div className={styles.qrPanel}>
            <img className={styles.qrCode} src={qrCodeUrl} alt="DB QR Code" />
            <div className={styles.qrCopy}>
              <strong>{promotion.qrText}</strong>
              <span>Dainik Bhaskar App</span>
            </div>
          </div>

          <a className={styles.downloadButton} href={promotion.webBlockerLink}>
            {promotion.buttonText}
          </a>
        </div>
      </section>
    </main>
  )
}
