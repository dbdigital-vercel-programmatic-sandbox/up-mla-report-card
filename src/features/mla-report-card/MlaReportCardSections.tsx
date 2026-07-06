/* eslint-disable @next/next/no-img-element */
"use client"

import type { CSSProperties, ReactNode } from "react"
import { useMemo, useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { useWebviewContext } from "@/bridge"

import { SearchSheet } from "./SearchSheet"
import { PopupCloseIcon, TapHandIcon, TallyArrowIcon, WhatsappIcon } from "./icons"
import styles from "./mla-report-card.module.css"
import {
  getSelectedSeat,
  shareCommon,
  triggerContentFilterAddedEvent,
  type WebviewBridgeActions,
} from "./utils"
import { usePrefillDistrictsAndSeat } from "./usePrefillDistrictsAndSeat"
import type {
  MlaReportCardData,
  MlaTranslations,
  ProgressDetails,
} from "./types"

const PARTY_HIGHLIGHT_BASE = [
  "भाजपा",
  "बीजेपी",
  "भारतीय जनता पार्टी",
  "कांग्रेस",
  "काँग्रेस",
  "कॉंग्रेस",
  "इंडियन नेशनल कांग्रेस",
  "सपा",
  "समाजवादी पार्टी",
  "बसपा",
  "बहुजन समाज पार्टी",
  "सुभासपा",
  "निषाद पार्टी",
  "आरएलडी",
  "रालोद",
  "लोकदल",
  "राष्ट्रीय लोक दल",
  "बीएपी",
  "भारतीय आदिवासी पार्टी",
  "जीजीपी",
  "गोंडवाना गणतंत्र पार्टी",
  "गोंडवाना गणतन्त्र पार्टी",
  "जनसत्ता दल लोकतांत्रिक",
  "जनसत्ता दल",
  "अपना दल (एस)",
  "अपना दल एस",
  "अपना दल",
  "निर्दलीय",
  "अन्य",
] as const

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function makeTextVariants(text: string) {
  const trimmed = text.trim()
  const noBrackets = trimmed.replace(/[()]/g, "")
  const compact = noBrackets.replace(/\s+/g, " ").trim()
  const noSpace = compact.replace(/\s+/g, "")

  return new Set([trimmed, noBrackets.trim(), compact, noSpace].filter(Boolean))
}

export function ProgressReport({
  items,
  title,
  description,
  shareButtonText,
  onShareItem,
  highlightTerms,
  renderItemHeader,
}: {
  items: ProgressDetails[]
  title?: string
  description?: string
  shareButtonText?: string
  onShareItem?: (item: ProgressDetails) => void
  highlightTerms?: string[]
  renderItemHeader?: (item: ProgressDetails, index: number) => ReactNode
}) {
  const [accordionState, setAccordionState] = useState<Record<string, boolean>>(
    {}
  )

  const boldNumberAndFollowingWord = (text: string) => {
    const words = text.split(/\s+/)
    const result: ReactNode[] = []
    let hasBolded = false

    for (let i = 0; i < words.length; i += 1) {
      if (!hasBolded && /\d+/.test(words[i] ?? "") && words[i + 1]) {
        result.push(<strong key={`bold-num-${i}`}>{words[i]}</strong>, " ")
        result.push(
          <strong key={`bold-word-${i + 1}`}>{words[i + 1]}</strong>,
          " "
        )
        hasBolded = true
        i += 1
      } else {
        result.push(<span key={`word-${i}`}>{words[i]}</span>, " ")
      }
    }

    return result
  }

  const renderHighlightedTitle = (text: string) => {
    const candidateSet = new Set<string>()
    PARTY_HIGHLIGHT_BASE.forEach((term) => {
      makeTextVariants(term).forEach((variant) => candidateSet.add(variant))
    })
    ;(highlightTerms ?? []).forEach((term) => {
      makeTextVariants(term).forEach((variant) => candidateSet.add(variant))
    })

    const terms = [...candidateSet].filter(Boolean)
    if (terms.length === 0) {
      return text
    }

    const escapedTerms = terms
      .map((term) => escapeRegex(term))
      .sort((left, right) => right.length - left.length)

    const regex = new RegExp(`(${escapedTerms.join("|")})`, "g")
    const parts = text.split(regex)

    return parts.map((part, index) => {
      if (!part) {
        return null
      }

      const isHighlight = terms.some(
        (candidate) =>
          candidate === part ||
          makeTextVariants(candidate).has(part) ||
          makeTextVariants(part).has(candidate)
      )

      return isHighlight ? (
        <span key={`hl-${index}`} className={styles.questionHighlightText}>
          {part}
        </span>
      ) : (
        <span key={`tx-${index}`}>{part}</span>
      )
    })
  }

  return (
    <section className={styles.progressSection}>
      {(title || description) && (
        <div className={styles.sectionHeader}>
          {title ? <h3 className={styles.sectionTitle}>{title}</h3> : null}
          {description ? (
            <p className={styles.sectionDescription}>{description}</p>
          ) : null}
        </div>
      )}
      {items.map((item, index) => (
        <div
          key={`${item.title ?? "progress"}-${index}`}
          className={styles.progressItem}
        >
          {renderItemHeader ? renderItemHeader(item, index) : null}
          {item.title ? (
            <h4 className={styles.progressTitle}>
              {renderHighlightedTitle(item.title)}
            </h4>
          ) : null}
          {item.progressSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={styles.progressCategory}>
              {section.description ? (
                <p className={styles.progressDescription}>
                  {section.imageUrl ? (
                    <img
                      src={section.imageUrl}
                      alt=""
                      className={styles.progressSmallIcon}
                    />
                  ) : null}
                  <span>{boldNumberAndFollowingWord(section.description)}</span>
                </p>
              ) : null}
              {section.progressBars.map((bar, barIndex) => {
                const bifurcations = bar.bifurcations ?? []
                const hasBifurcations = bifurcations.length > 0
                const accordionKey = `${item.title ?? "progress"}-${index}-${sectionIndex}-${bar.title}`
                const firstBifurcationIndex = section.progressBars.findIndex(
                  (progressBar) => (progressBar.bifurcations?.length ?? 0) > 0
                )
                const isOpen =
                  accordionState[accordionKey] ??
                  (hasBifurcations && barIndex === firstBifurcationIndex)

                return (
                  <div key={bar.title} className={styles.progressBarRow}>
                    {hasBifurcations ? (
                      <div className={styles.progressAccordion}>
                        <div className={styles.progressAccordionHeader}>
                          <div className={styles.progressBarTrack}>
                            <span className={styles.progressBarTitleText}>
                              {bar.title}
                            </span>
                            <div
                              className={styles.progressBarFill}
                              style={{
                                width: bar.percent,
                                backgroundColor: bar.color,
                                opacity: bar.opacity,
                              }}
                            />
                            <span className={styles.progressBarValueText}>
                              {bar.percent}
                            </span>
                          </div>
                          <button
                            type="button"
                            className={styles.progressAccordionButton}
                            aria-expanded={isOpen}
                            onClick={() =>
                              setAccordionState((current) => ({
                                ...current,
                                [accordionKey]: !isOpen,
                              }))
                            }
                          >
                            <ChevronDownIcon
                              className={styles.progressAccordionIcon}
                              style={
                                {
                                  "--foreground-color": "var(--primary-color)",
                                  transform: isOpen
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                } as CSSProperties
                              }
                            />
                          </button>
                        </div>
                        {isOpen ? (
                          <div className={styles.bifurcationList}>
                            {bifurcations.map((bifurcation) => (
                              <div
                                key={bifurcation.id}
                                className={styles.bifurcationRow}
                              >
                                <div className={styles.bifurcationTrack}>
                                  <span className={styles.bifurcationTitleText}>
                                    {bifurcation.title}
                                  </span>
                                  <div
                                    className={styles.bifurcationFill}
                                    style={{
                                      width: bifurcation.percent,
                                      backgroundColor: bifurcation.color,
                                      opacity: bifurcation.opacity,
                                    }}
                                  />
                                  <span className={styles.bifurcationValueText}>
                                    {bifurcation.percent}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className={styles.progressBarTrack}>
                        <span className={styles.progressBarTitleText}>
                          {bar.title}
                        </span>
                        <div
                          className={styles.progressBarFill}
                          style={{
                            width: bar.percent,
                            backgroundColor: bar.color,
                            opacity: bar.opacity,
                          }}
                        />
                        <span className={styles.progressBarValueText}>
                          {bar.percent}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          {item.footerDescription ? (
            <div
              className={styles.progressFooter}
              style={{ color: item.footerDescription.color }}
            >
              {item.footerDescription.thumbIcon ? (
                <span>{item.footerDescription.thumbIcon}</span>
              ) : null}
              <span>{item.footerDescription.text}</span>
            </div>
          ) : null}
          {shareButtonText && onShareItem ? (
            <button
              type="button"
              className={styles.shareButton}
              onClick={() => onShareItem(item)}
            >
              <WhatsappIcon
                className={styles.shareIconSvg}
                style={
                  {
                    "--foreground-color": "var(--white-color)",
                  } as CSSProperties
                }
              />
              {shareButtonText}
            </button>
          ) : null}
        </div>
      ))}
    </section>
  )
}

export function MlaReportCardSection({
  data,
  translations,
  source,
  openDropdownId,
  onToggleDropdown,
}: {
  data: MlaReportCardData
  translations: MlaTranslations
  source: string
  openDropdownId: string | null
  onToggleDropdown: (id: string | null) => void
}) {
  const { isWebview, methodExists, trackMixpanelEvent, shareArticle } =
    useWebviewContext()
  const bridgeActions = useMemo<WebviewBridgeActions>(
    () => ({
      isWebview,
      methodExists,
      trackMixpanelEvent,
      trackInteractivePage: () => {},
      shareArticle,
    }),
    [isWebview, methodExists, trackMixpanelEvent, shareArticle]
  )
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(
    null
  )
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null)
  const { userResponse, districtStorageKey, seatStorageKey } =
    usePrefillDistrictsAndSeat({
      districts: data.districts,
      setDistrict: setSelectedDistrictId,
      setVidhanSeat: setSelectedSeatId,
    })

  const districtOptions = useMemo(
    () =>
      [...data.districts]
        .sort((left, right) => {
          if (left.district_english_name && right.district_english_name) {
            return left.district_english_name.localeCompare(
              right.district_english_name
            )
          }

          return Number(left.position) - Number(right.position)
        })
        .map((district) => ({
          id: district.id,
          name: district.district_name,
          englishName: district.district_english_name ?? district.district_name,
        })),
    [data.districts]
  )

  const seatOptions =
    data.districts
      .find((district) => district.id === selectedDistrictId)
      ?.seats.map((seat) => ({
        id: seat.id,
        name: seat.seat_name,
        englishName: seat.seat_english_name || seat.seat_name,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)) ?? []

  const selectedItem = selectedSeatId
    ? getSelectedSeat(
        selectedSeatId.toString(),
        data,
        translations,
        userResponse ?? undefined
      )
    : null

  return (
    <section className={styles.tab4Section}>
      <div className={styles.selectorStack}>
        <button
          type="button"
          className={styles.selectorButton}
          onClick={() => onToggleDropdown("district-selector")}
        >
          <div className={styles.selectorTextWrap}>
            <strong>
              {districtOptions.find(
                (district) => district.id === selectedDistrictId
              )?.name ?? translations.chooseDistrict}
            </strong>
          </div>
          <TallyArrowIcon
            className={styles.selectorArrowIcon}
            style={
              { "--foreground-color": "var(--primary-color)" } as CSSProperties
            }
          />
        </button>

        <button
          type="button"
          className={styles.selectorButton}
          disabled={!selectedDistrictId}
          onClick={() => onToggleDropdown("vidhan-selector")}
        >
          <div className={styles.selectorTextWrap}>
            <strong>
              {seatOptions.find((seat) => seat.id === selectedSeatId)?.name ??
                (selectedDistrictId
                  ? translations.seatPlaceholder
                  : translations.selectDistrictFirst)}
            </strong>
          </div>
          <TallyArrowIcon
            className={styles.selectorArrowIcon}
            style={
              {
                "--foreground-color": selectedDistrictId
                  ? "var(--primary-color)"
                  : "var(--tertiary-color)",
              } as CSSProperties
            }
          />
        </button>
      </div>

      {!selectedSeatId ? (
        <div className={styles.tapHint}>
          <TapHandIcon
            className={styles.tapHandIcon}
            style={
              {
                "--foreground-color": "var(--primary-color)",
              } as CSSProperties
            }
          />
          <div className={styles.tapHintText}>
            {translations.checkSurveyResultDescription}
          </div>
        </div>
      ) : null}

      {selectedItem ? (
        <>
          <div className={styles.surveyResultDividerContainer}>
            <div className={styles.surveyResultDividerLine} />
            <div className={styles.surveyResultDividerText}>
              {translations.surveyResultHeading}
            </div>
            <div className={styles.surveyResultDividerLine} />
          </div>
          <ProgressReport
            items={selectedItem.listItems[0]?.progressDetails ?? []}
            shareButtonText={translations.shareButtonText}
            highlightTerms={[
              selectedItem.cardDetails.title ?? "",
              selectedItem.cardDetails.subTitle.split(",")[0] ?? "",
              selectedItem.cardDetails.partyName ?? "",
            ]}
            renderItemHeader={(_item, index) => {
              if (index !== 0) {
                return null
              }

              return (
                <div className={styles.progressMlaHeader}>
                  {selectedItem.cardDetails.imageUrl ? (
                    <img
                      src={selectedItem.cardDetails.imageUrl}
                      alt={selectedItem.cardDetails.title ?? ""}
                      className={styles.progressMlaImage}
                    />
                  ) : null}
                  <div className={styles.progressMlaText}>
                    <div className={styles.progressMlaName}>
                      {selectedItem.cardDetails.title ?? ""}
                    </div>
                    <div className={styles.progressMlaMeta}>
                      {selectedItem.cardDetails.subTitle}
                    </div>
                  </div>
                  {selectedItem.cardDetails.smallImageUrl ||
                  selectedItem.cardDetails.partyName ? (
                    <div className={styles.progressMlaParty}>
                      {selectedItem.cardDetails.smallImageUrl ? (
                        <img
                          src={selectedItem.cardDetails.smallImageUrl}
                          alt={selectedItem.cardDetails.partyName ?? ""}
                          className={styles.progressMlaPartyIcon}
                        />
                      ) : null}
                      {selectedItem.cardDetails.partyName ? (
                        <div className={styles.progressMlaPartyName}>
                          {selectedItem.cardDetails.partyName}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            }}
            onShareItem={(progressItem) =>
              shareCommon({
                bridgeActions,
                deeplink: data.meta.deeplink,
                contentTitle: data.meta.title,
                source,
                category: "MLA Page",
                subSource:
                  progressItem.title ?? selectedItem.cardDetails.subTitle,
                translations,
              })
            }
          />
        </>
      ) : null}

      {openDropdownId ? (
        <div
          className={styles.sheetOverlay}
          onClick={() => onToggleDropdown(null)}
        >
          <div
            className={styles.sheet}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.sheetHeader}>
              <span className={styles.sheetHeaderSpacer} />
              <h4 className={styles.sheetTitle}>
                {openDropdownId === "district-selector"
                  ? translations.districtSheetTitle
                  : translations.seatSheetTitle}
              </h4>
              <button
                type="button"
                className={styles.popupCloseButton}
                onClick={() => onToggleDropdown(null)}
              >
                <PopupCloseIcon
                  className={styles.popupCloseIcon}
                  style={
                    {
                      "--foreground-color": "var(--secondary-color)",
                      width: "24px",
                      height: "24px",
                    } as CSSProperties
                  }
                />
              </button>
            </div>

            {openDropdownId === "district-selector" ? (
              <SearchSheet
                key="district-selector"
                options={districtOptions}
                topHeading={translations.districtSearchPlaceholder}
                onSelect={(district) => {
                  triggerContentFilterAddedEvent({
                    bridgeActions,
                    source,
                    district: district.englishName,
                    contentTitle: data.meta.title || "",
                  })
                  setSelectedDistrictId(district.id)
                  setSelectedSeatId(null)
                  window.localStorage.setItem(
                    districtStorageKey,
                    district.id.toString()
                  )
                  window.localStorage.setItem(seatStorageKey, "")
                  onToggleDropdown(null)
                }}
              />
            ) : (
              <SearchSheet
                key={`seat-selector-${selectedDistrictId ?? "none"}`}
                options={seatOptions}
                topHeading={translations.seatSearchPlaceholder}
                onSelect={(seat) => {
                  const payload = {
                    event: "Interactive Survey User Info Submitted",
                    properties: {
                      "Content Location": seat.name,
                      District:
                        districtOptions.find(
                          (district) => district.id === selectedDistrictId
                        )?.name ?? "",
                      "Content Title": data.meta.title,
                      "Content Type": "Interactive Survey",
                    },
                  }

                  console.log(payload)
                  trackMixpanelEvent(payload)
                  setSelectedSeatId(seat.id)
                  window.localStorage.setItem(
                    seatStorageKey,
                    seat.id.toString()
                  )
                  onToggleDropdown(null)
                }}
              />
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
