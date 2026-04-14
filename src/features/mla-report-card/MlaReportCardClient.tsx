/* eslint-disable @next/next/no-img-element */
"use client"

import type { CSSProperties } from "react"
import { useEffect, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { usePullToRefreshDisabler, useWebviewContext } from "@/bridge"

import { BackIcon, ClockIcon, WhatsappIcon } from "./icons"
import styles from "./mla-report-card.module.css"
import {
  DynamicMediaBlock,
  ItemDetail,
  MediaBlock,
  MlaCard,
  ProgressReport,
  Tab4Section,
} from "./MlaReportCardSections"
import {
  getSelectedSeat,
  getTransformedMlaListForCards,
  renderTemplateContent,
  shareCommon,
  triggerContentConsumedEvent,
  triggerContentItemClickedEvent,
  triggerContentOpenedEvent,
  type WebviewBridgeActions,
} from "./utils"
import type {
  ContentBlock,
  District,
  MlaCampaignData,
  MlaTranslations,
} from "./types"

type Props = {
  campaignId: string
  campaignData: MlaCampaignData
  translations: MlaTranslations
}

export function MlaReportCardClient({
  campaignId,
  campaignData,
  translations,
}: Props) {
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTab = searchParams.get("activeTab") ?? "4"
  const selectedVidhanId = searchParams.get("vidhan")
  const openDropdownId = searchParams.get("dropdown")
  const resolvedSource = searchParams.get("source")
  const sourceForEvents = resolvedSource || activeTab

  useEffect(() => {
    triggerContentOpenedEvent(
      bridgeActions,
      sourceForEvents,
      campaignData.meta.title
    )
    triggerContentConsumedEvent(
      bridgeActions,
      sourceForEvents,
      campaignData.meta.title
    )
  }, [bridgeActions, campaignData.meta.title, sourceForEvents])

  const selectedSeatDetails = selectedVidhanId
    ? getSelectedSeat(selectedVidhanId, campaignData, translations)
    : null

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

  const updateSearchParams = (
    updates: Record<string, string | null>,
    mode: "push" | "replace" = "replace"
  ) => {
    const nextParams = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        nextParams.delete(key)
      } else {
        nextParams.set(key, value)
      }
    })

    const nextUrl = nextParams.toString()
      ? `${pathname}?${nextParams.toString()}`
      : pathname

    if (mode === "push") {
      router.push(nextUrl, { scroll: false })
    } else {
      router.replace(nextUrl, { scroll: false })
    }
  }

  const currentTabData = campaignData[activeTab as keyof MlaCampaignData]
  const visibleBlocks: ContentBlock[] = Array.isArray(currentTabData)
    ? (
        currentTabData as Array<
          ContentBlock | District | MlaCampaignData["tabs"][number]
        >
      ).filter(
        (block): block is ContentBlock =>
          typeof block === "object" && "type" in block
      )
    : []

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
          <span className={styles.headerTitle}>
            {campaignData.meta.headerText}
          </span>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.headerShare}
            aria-label={translations.shareButtonText}
            onClick={() =>
              shareCommon({
                bridgeActions,
                deeplink: campaignData.meta.deeplink,
                contentTitle: campaignData.meta.title,
                source: sourceForEvents,
                category: activeTab,
                subSource: "Top Sharing button",
                translations,
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

      {campaignData.tabs.length > 1 ? (
        <div className={styles.tabsSpacer}>
          <div className={styles.tabs}>
            {campaignData.tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={tab.id === activeTab ? styles.activeTab : styles.tab}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "auto" })
                  triggerContentItemClickedEvent({
                    bridgeActions,
                    contentTitle: campaignData.meta.title,
                    category: "Top Buttons",
                    subSource: tab.id,
                    source: sourceForEvents,
                  })
                  updateSearchParams({ activeTab: tab.id }, "replace")
                }}
              >
                {tab.displayName}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <main className={styles.content}>
        {visibleBlocks.map((block, index) => {
          switch (block.type) {
            case "media":
              return (
                <div key={`${activeTab}-${index}`}>
                  <MediaBlock
                    media={block.data}
                    shareLabel={translations.shareButtonText}
                    onShare={() =>
                      shareCommon({
                        bridgeActions,
                        deeplink: campaignData.meta.deeplink,
                        contentTitle: campaignData.meta.title,
                        source: sourceForEvents,
                        category: "Header Video",
                        subSource: "Inside Graphic",
                        translations,
                      })
                    }
                  />
                </div>
              )
            case "lineSeparatorWithTitle":
              return (
                <div
                  key={`${activeTab}-${index}`}
                  className={styles.dividerContainer}
                >
                  <div className={styles.dividerLine} />
                  <div className={styles.dividerText}>{block.data.title}</div>
                  <div className={styles.dividerLine} />
                </div>
              )
            case "dynamicMedia":
              return (
                <div key={`${activeTab}-${index}`}>
                  <DynamicMediaBlock
                    data={block.data}
                    translations={translations}
                    onSelectionChange={(title) =>
                      triggerContentItemClickedEvent({
                        bridgeActions,
                        contentTitle: campaignData.meta.title,
                        source: sourceForEvents,
                        subSource: title,
                        category: "Filters",
                      })
                    }
                    onShare={() =>
                      shareCommon({
                        bridgeActions,
                        deeplink: campaignData.meta.deeplink,
                        contentTitle: campaignData.meta.title,
                        source: sourceForEvents,
                        category: block.data.title,
                        subSource: "Inside Graphic",
                        translations,
                      })
                    }
                  />
                </div>
              )
            case "progress":
              return (
                <div key={`${activeTab}-${index}`}>
                  <ProgressReport
                    title={block.data.title}
                    description={block.data.description}
                    items={block.data.items}
                  />
                </div>
              )
            case "horizontalList": {
              const items = getTransformedMlaListForCards(
                block.data.tag,
                campaignData.districts,
                translations
              )

              return (
                <div key={`${activeTab}-${index}`}>
                  <section>
                    {block.data.canShowTopDivider ? (
                      <div className={styles.separationLine} />
                    ) : null}
                    <div className={styles.listHeader}>
                      <h3 className={styles.sectionTitle}>
                        {block.data.title}
                      </h3>
                      {block.data.partyIcon ? (
                        <img
                          src={block.data.partyIcon}
                          alt=""
                          className={styles.listHeaderIcon}
                        />
                      ) : null}
                    </div>
                    <div className={styles.horizontalList}>
                      {items.map((item) => (
                        <MlaCard
                          key={item.id}
                          item={item}
                          layout="horizontal"
                          scoreLabel={translations.score}
                          onClick={(id) => {
                            updateSearchParams({ vidhan: id }, "push")
                          }}
                        />
                      ))}
                    </div>
                  </section>
                </div>
              )
            }
            case "verticalList": {
              const items = getTransformedMlaListForCards(
                block.data.tag,
                campaignData.districts,
                translations
              )

              return (
                <div key={`${activeTab}-${index}`}>
                  <section>
                    {block.data.canShowTopDivider ? (
                      <div className={styles.separationLine} />
                    ) : null}
                    <div className={styles.verticalList}>
                      <h3 className={styles.sectionTitle}>
                        {block.data.title}
                      </h3>
                      {items.map((item) => (
                        <MlaCard
                          key={item.id}
                          item={item}
                          layout="vertical"
                          scoreLabel={translations.score}
                          onClick={(id) => {
                            updateSearchParams({ vidhan: id }, "push")
                          }}
                        />
                      ))}
                    </div>
                  </section>
                </div>
              )
            }
            case "comingSoon":
              return (
                <div
                  key={`${activeTab}-${index}`}
                  className={styles.staticCard}
                >
                  <ClockIcon
                    className={styles.staticCardClock}
                    style={
                      {
                        "--foreground-color": "var(--primary-color)",
                      } as CSSProperties
                    }
                  />
                  <div className={styles.staticCardText}>
                    {renderTemplateContent(block.data.templateContent)}
                  </div>
                </div>
              )
            case "richText":
              return (
                <div key={`${activeTab}-${index}`} className={styles.richText}>
                  {renderTemplateContent(block.data.templateContent)}
                </div>
              )
            case "tab4":
              return (
                <div key={`${activeTab}-${index}`}>
                  <Tab4Section
                    campaignId={campaignId}
                    campaignData={campaignData}
                    translations={translations}
                    source={sourceForEvents}
                    openDropdownId={openDropdownId}
                    onToggleDropdown={updatePopupSearchParams}
                  />
                </div>
              )
            default:
              return null
          }
        })}
      </main>

      {selectedSeatDetails ? (
        <ItemDetail
          item={selectedSeatDetails}
          translations={translations}
          deeplink={
            activeTab === "3"
              ? campaignData.meta.day3Deeplink
              : campaignData.meta.day4Deeplink
          }
          contentTitle={campaignData.meta.title}
          source={sourceForEvents}
          closeLabel={translations.close}
          onClose={() => router.back()}
        />
      ) : null}
    </div>
  )
}
