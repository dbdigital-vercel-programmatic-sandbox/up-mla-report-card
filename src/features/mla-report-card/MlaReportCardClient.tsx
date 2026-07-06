"use client"

import type { CSSProperties } from "react"
import { useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"

import { usePullToRefreshDisabler, useWebviewContext } from "@/bridge"

import { BackIcon, WhatsappIcon } from "./icons"
import styles from "./mla-report-card.module.css"
import { MlaReportCardSection } from "./MlaReportCardSections"
import {
  shareCommon,
  triggerContentConsumedEvent,
  triggerContentOpenedEvent,
  type WebviewBridgeActions,
} from "./utils"
import type { MlaReportCardData, MlaTranslations } from "./types"

type Props = {
  data: MlaReportCardData
  translations: MlaTranslations
}

export function MlaReportCardClient({ data, translations }: Props) {
  usePullToRefreshDisabler()

  const {
    closeScreen,
    isWebview,
    methodExists,
    trackMixpanelEvent,
    trackInteractivePage,
    shareArticle,
  } = useWebviewContext()
  const bridgeActions = useMemo<WebviewBridgeActions>(
    () => ({
      isWebview,
      methodExists,
      trackMixpanelEvent,
      trackInteractivePage,
      shareArticle,
    }),
    [
      isWebview,
      methodExists,
      trackMixpanelEvent,
      trackInteractivePage,
      shareArticle,
    ]
  )
  const searchParams = useSearchParams()
  const openDropdownId = searchParams.get("dropdown")
  const source = searchParams.get("source") ?? "mlaReportCard"

  useEffect(() => {
    triggerContentOpenedEvent(bridgeActions, source, data.meta.title)
    triggerContentConsumedEvent(bridgeActions, source, data.meta.title)
  }, [bridgeActions, data.meta.title, source])

  const updatePopupSearchParams = (dropdownId: string | null) => {
    const urlParams = new URLSearchParams(searchParams.toString())

    if (dropdownId) {
      urlParams.set("dropdown", dropdownId)
    } else {
      urlParams.delete("dropdown")
    }

    const newQuery = urlParams.toString()
    const newUrl = newQuery
      ? `${window.location.pathname}?${newQuery}`
      : window.location.pathname

    window.history.replaceState(null, "", newUrl)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.headerBack}
            onClick={closeScreen}
          >
            <BackIcon
              className={styles.headerBackIcon}
              style={
                {
                  "--foreground-color": "var(--primary-color)",
                } as CSSProperties
              }
            />
          </button>
          <span className={styles.headerTitle}>{data.meta.headerText}</span>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.headerShare}
            aria-label={translations.shareButtonText}
            onClick={() =>
              shareCommon({
                bridgeActions,
                deeplink: data.meta.deeplink,
                contentTitle: data.meta.title,
                source,
                category: "Top Sharing button",
                subSource: "Top Sharing button",
                shareText: data.meta.shareText,
                shareImage: data.meta.ogImage,
              })
            }
          >
            <WhatsappIcon
              className={styles.headerShareIcon}
              style={
                {
                  "--foreground-color": "var(--primary-color)",
                } as CSSProperties
              }
            />
          </button>
        </div>
      </header>

      <main className={styles.content}>
        <MlaReportCardSection
          data={data}
          translations={translations}
          source={source}
          openDropdownId={openDropdownId}
          onToggleDropdown={updatePopupSearchParams}
        />
      </main>
    </div>
  )
}
