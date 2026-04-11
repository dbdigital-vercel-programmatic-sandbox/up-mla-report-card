/* eslint-disable @next/next/no-img-element */
"use client"

import type { CSSProperties, ReactNode } from "react"
import { useEffect, useMemo, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { bridge } from "@/bridge"

import { fetchSurveyAttemptResponse } from "./api"
import arrowDownIcon from "./assets/arrow-down.svg"
import { MLA_SURVEY_API_BASE_URL, X_AUT_T } from "./config"
import {
  ArrowIcon,
  BackIcon,
  ClockIcon,
  CloseIcon,
  PlayIcon,
  PopupCloseIcon,
  SearchIcon,
  TapHandIcon,
  TallyArrowIcon,
  WhatsappIcon,
} from "./icons"
import styles from "./mla-report-card.module.css"
import {
  getSelectedSeat,
  getTransformedMlaListForCards,
  renderTemplateContent,
  shareCommon,
  shareMla,
  triggerContentConsumedEvent,
  triggerContentItemClickedEvent,
  triggerContentOpenedEvent,
} from "./utils"
import type {
  ContentBlock,
  District,
  DynamicMediaData,
  ItemDetailData,
  MediaItem,
  MlaCampaignData,
  MlaTranslations,
  ProgressDetails,
  UserResponse,
} from "./types"

type Props = {
  campaignId: string
  campaignData: MlaCampaignData
  translations: MlaTranslations
}

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

function formatDuration(seconds?: number) {
  if (!seconds) {
    return null
  }

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function ProgressReport({
  items,
  title,
  description,
  shareButtonText,
  onShareItem,
  highlightTerms,
}: {
  items: ProgressDetails[]
  title?: string
  description?: string
  shareButtonText?: string
  onShareItem?: (item: ProgressDetails) => void
  highlightTerms?: string[]
}) {
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
              {[...section.progressBars]
                .sort((left, right) => {
                  const leftPercent = Number(left.percent.replace("%", ""))
                  const rightPercent = Number(right.percent.replace("%", ""))
                  return rightPercent - leftPercent
                })
                .map((bar, index) => (
                  <div key={bar.title} className={styles.progressBarRow}>
                    <div className={styles.progressBarTrack}>
                      <span className={styles.progressBarTitleText}>
                        {bar.title}
                      </span>
                      <div
                        className={styles.progressBarFill}
                        style={{
                          width: bar.percent,
                          backgroundColor: index === 0 ? "#8BC66F" : "#BEBEBE",
                          opacity: 0.3,
                        }}
                      />
                      <span className={styles.progressBarValueText}>
                        {bar.percent}
                      </span>
                    </div>
                  </div>
                ))}
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

function MlaCard({
  item,
  layout,
  scoreLabel,
  onClick,
}: {
  item: ItemDetailData["cardDetails"]
  layout: "horizontal" | "vertical"
  scoreLabel: string
  onClick: (id: string) => void
}) {
  if (layout === "horizontal") {
    return (
      <button
        type="button"
        className={styles.horizontalCard}
        onClick={() => onClick(item.id)}
      >
        <div className={styles.horizontalLabelContainer}>
          {item.tag?.label ? (
            <p className={styles.horizontalItemTag}>{item.tag.label}</p>
          ) : null}
        </div>
        <div className={styles.horizontalItemImage}>
          <img
            src={item.imageUrl}
            alt={item.title}
            className={styles.cardImage}
          />
        </div>
        <div className={styles.horizontalItemContent}>
          <h4 className={styles.horizontalCardTitle}>{item.title}</h4>
          <p className={styles.horizontalCardSubTitle}>{item.subTitle}</p>
          <div className={styles.horizontalDivider} />
          <div className={styles.horizontalItemPercentage}>
            <div>
              {item.percentage}
              <span className={styles.horizontalScoreTag}> {scoreLabel}</span>
            </div>
            <ArrowIcon
              className={styles.cardArrowIcon}
              style={
                {
                  "--foreground-color": "var(--secondary-color)",
                  transform: "rotate(180deg)",
                  width: "30px",
                  height: "30px",
                } as CSSProperties
              }
            />
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={styles.verticalCard}
      onClick={() => onClick(item.id)}
    >
      <div className={styles.verticalItemImage}>
        <img
          src={item.imageUrl}
          alt={item.title}
          className={styles.cardImage}
        />
        <img
          src={item.smallImageUrl}
          alt={item.partyName}
          className={styles.partyBadge}
        />
      </div>
      <div className={styles.verticalItemContent}>
        <h4 className={styles.verticalTitle}>{item.title}</h4>
        {item.tag?.label ? (
          <span className={styles.verticalItemTag}>{item.tag.label}</span>
        ) : null}
        <p className={styles.verticalSubTitle}>{item.subTitle}</p>
      </div>
      <div className={styles.verticalAside}>
        <div>
          {item.percentage}
          <p className={styles.verticalScoreTag}>{scoreLabel}</p>
        </div>
        <ArrowIcon
          className={styles.cardArrowIcon}
          style={
            {
              "--foreground-color": "var(--secondary-color)",
              transform: "rotate(180deg)",
              width: "30px",
              height: "30px",
              marginLeft: "12px",
            } as CSSProperties
          }
        />
      </div>
    </button>
  )
}

function MediaBlock({
  media,
  shareLabel,
  onShare,
}: {
  media: MediaItem
  shareLabel: string
  onShare: () => void
}) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section className={styles.mediaBlock}>
      {media.type === "video" && media.videoDetails?.videoUrl && isPlaying ? (
        <div className={styles.mediaFrame}>
          <video
            controls
            autoPlay
            poster={media.thumbUrl}
            className={styles.mediaVisual}
          >
            <source src={media.videoDetails.videoUrl} />
          </video>
          {formatDuration(media.videoDetails.duration) ? (
            <span className={styles.mediaDuration}>
              {formatDuration(media.videoDetails.duration)}
            </span>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className={styles.mediaFrameButton}
          onClick={() => {
            if (media.type === "video" && media.videoDetails?.videoUrl) {
              setIsPlaying(true)
            }
          }}
        >
          <div className={styles.mediaFrame}>
            <img
              src={media.thumbUrl}
              alt={media.sharing.title || "MLA Report Card"}
              className={styles.mediaVisual}
            />
            {media.type === "video" ? (
              <PlayIcon className={styles.playIcon} />
            ) : null}
            {media.type === "video" &&
            formatDuration(media.videoDetails?.duration) ? (
              <span className={styles.mediaDuration}>
                {formatDuration(media.videoDetails?.duration)}
              </span>
            ) : null}
          </div>
        </button>
      )}

      <button type="button" className={styles.shareButton} onClick={onShare}>
        <WhatsappIcon
          className={styles.shareIconSvg}
          style={
            { "--foreground-color": "var(--secondary-color)" } as CSSProperties
          }
        />
        {shareLabel}
      </button>

      {media.type === "video" && media.mediaDescription?.length ? (
        <div className={styles.richText}>
          {renderTemplateContent(media.mediaDescription)}
        </div>
      ) : null}
    </section>
  )
}

function DynamicMediaBlock({
  data,
  translations,
  onSelectionChange,
  onShare,
}: {
  data: DynamicMediaData
  translations: MlaTranslations
  onSelectionChange: (title: string) => void
  onShare: () => void
}) {
  const [selectedId, setSelectedId] = useState(data.items[0]?.id ?? "")

  const selectedItem =
    data.items.find((item) => item.id === selectedId) ?? data.items[0]

  if (!selectedItem) {
    return null
  }

  return (
    <section className={styles.dynamicBlock}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{data.title}</h3>
        <p className={styles.sectionDescription}>{data.description}</p>
      </div>

      {data.items.length > 1 ? (
        <div className={styles.selectWrap}>
          <div className={styles.selectContainer}>
            <select
              className={styles.select}
              value={selectedId}
              onChange={(event) => {
                const item = data.items.find(
                  (entry) => entry.id === event.target.value
                )
                if (item) {
                  onSelectionChange(item.title)
                }
                setSelectedId(event.target.value)
              }}
            >
              {data.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <img
              src={arrowDownIcon.src}
              alt=""
              className={styles.selectArrow}
            />
          </div>
        </div>
      ) : null}

      <MediaBlock
        media={selectedItem.media}
        shareLabel={translations.shareButtonText}
        onShare={onShare}
      />
    </section>
  )
}

function ItemDetail({
  item,
  translations,
  deeplink,
  contentTitle,
  source,
  closeLabel,
  onClose,
  mode = "overlay",
}: {
  item: ItemDetailData
  translations: MlaTranslations
  deeplink: string
  contentTitle: string
  source: string
  closeLabel: string
  onClose: () => void
  mode?: "overlay" | "inline"
}) {
  const noPercent = item.cardDetails.percentage.replace("%", "")
  return (
    <div
      className={
        mode === "overlay" ? styles.detailOverlay : styles.inlineDetail
      }
    >
      <div className={styles.detailCard}>
        {mode === "overlay" ? (
          <div className={styles.detailHeader}>
            <div className={styles.detailHeaderActions}>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={translations.shareButtonText}
                onClick={() =>
                  shareMla({
                    deeplink,
                    contentTitle,
                    source,
                    category: "MLA Page",
                    subSource: item.cardDetails.subTitle,
                    constituencyName:
                      item.cardDetails.subTitle.split(",")[0] ?? "",
                    candidateName: item.cardDetails.title,
                    translations,
                  })
                }
              >
                <WhatsappIcon
                  className={styles.detailHeaderIcon}
                  style={
                    {
                      "--foreground-color": "var(--primary-color)",
                    } as CSSProperties
                  }
                />
              </button>
              <div className={styles.detailHeaderTitle}>
                {translations.mlaReportCard}
              </div>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={closeLabel}
                onClick={onClose}
              >
                <CloseIcon
                  className={styles.detailHeaderIcon}
                  style={
                    {
                      "--foreground-color": "var(--primary-color)",
                    } as CSSProperties
                  }
                />
              </button>
            </div>
          </div>
        ) : null}

        <div className={styles.detailTop}>
          <img
            src={item.cardDetails.imageUrl}
            alt={item.cardDetails.title}
            className={styles.detailImage}
          />
          <h2 className={styles.detailName}>{item.cardDetails.title}</h2>
          {item.cardDetails.tag?.label ? (
            <span className={styles.rankTag}>{item.cardDetails.tag.label}</span>
          ) : null}
          <div className={styles.detailPartyRow}>
            <img
              src={item.cardDetails.smallImageUrl}
              alt={item.cardDetails.partyName}
              className={styles.detailPartyImage}
            />
            <span>{item.cardDetails.partyName}</span>
          </div>
          <p className={styles.detailSubtitle}>{item.cardDetails.subTitle}</p>
        </div>

        <div className={styles.scoreGrid}>
          <div>
            <div className={styles.scoreValue}>
              {item.cardDetails.percentage}
            </div>
            <div className={styles.scoreLegend}>👍 {translations.yes}</div>
          </div>
          <div className={styles.scoreCenter}>{translations.totalScore}</div>
          <div>
            <div
              className={styles.scoreValue}
            >{`${100 - Number(noPercent)}%`}</div>
            <div className={styles.scoreLegend}>{translations.no} 👎</div>
          </div>
        </div>

        {item.cardDetails.yourGivenScore ? (
          <div className={styles.scoreGrid}>
            <div>
              <div className={styles.scoreValue}>
                {item.cardDetails.yourGivenScore}
              </div>
              <div className={styles.scoreLegend}>👍 {translations.yes}</div>
            </div>
            <div className={styles.scoreCenter}>
              {translations.yourGivenScore}
            </div>
            <div>
              <div className={styles.scoreValue}>
                {`${100 - Number(item.cardDetails.yourGivenScore.replace("%", ""))}%`}
              </div>
              <div className={styles.scoreLegend}>{translations.no} 👎</div>
            </div>
          </div>
        ) : null}

        {mode === "inline" ? null : (
          <button
            type="button"
            className={styles.shareButton}
            onClick={() =>
              shareMla({
                deeplink,
                contentTitle,
                source,
                category: "MLA Page",
                subSource: item.cardDetails.subTitle,
                constituencyName: item.cardDetails.subTitle.split(",")[0] ?? "",
                candidateName: item.cardDetails.title,
                translations,
              })
            }
          >
            <WhatsappIcon
              className={styles.shareIconSvg}
              style={
                { "--foreground-color": "var(--white-color)" } as CSSProperties
              }
            />
            {translations.shareButtonText}
          </button>
        )}

        <div className={styles.detailDivider} />
        {item.listItems.map((listItem) => (
          <div key={listItem.id} className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>{listItem.text}</h3>
            <ProgressReport items={listItem.progressDetails} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Tab4Section({
  campaignId,
  campaignData,
  translations,
  source,
  openDropdownId,
  onToggleDropdown,
}: {
  campaignId: string
  campaignData: MlaCampaignData
  translations: MlaTranslations
  source: string
  openDropdownId: string | null
  onToggleDropdown: (id: string | null) => void
}) {
  const { getAppUserData } = bridge
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(
    null
  )
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null)
  const [userResponse, setUserResponse] = useState<UserResponse | null>(null)
  const [districtSearch, setDistrictSearch] = useState("")

  useEffect(() => {
    const storedDistrict = window.sessionStorage.getItem(
      `selectedFirstOption-campaign-${campaignId}`
    )
    const storedSeat = window.sessionStorage.getItem(
      `selectedSecondOption-campaign-${campaignId}`
    )

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDistrictId(storedDistrict ? Number(storedDistrict) : null)
    setSelectedSeatId(storedSeat ? Number(storedSeat) : null)
  }, [campaignId])

  useEffect(() => {
    let cancelled = false

    const loadUserResponse = async () => {
      try {
        const userData = await getAppUserData()
        const endpoint = new URL(
          `/api/1.0/web-backend/survey/vidhan/${campaignId}/response`,
          MLA_SURVEY_API_BASE_URL
        ).toString()

        console.log({
          event: "Survey User Response API Request",
          properties: {
            campaignId,
            endpoint,
            headers: {
              at: userData.auth_token,
              "x-aut-t": X_AUT_T,
              "a-ver-code": "600",
              deviceid: userData.user?.unique_id ?? "",
              msisdn: userData.user?.phone_number ?? "",
            },
          },
        })

        const json = (await fetchSurveyAttemptResponse(
          campaignId,
          userData,
          MLA_SURVEY_API_BASE_URL,
          X_AUT_T
        )) as UserResponse

        console.log({
          event: "Survey User Response API Response",
          properties: {
            campaignId,
            status: 200,
            data: json,
          },
        })

        if (cancelled) {
          return
        }

        setUserResponse(json)

        if (json.hasAttempted) {
          if (json.response?.district) {
            setSelectedDistrictId(json.response.district)
            window.sessionStorage.setItem(
              `selectedFirstOption-campaign-${campaignId}`,
              json.response.district.toString()
            )
          }

          if (json.response?.vidhanSeat) {
            setSelectedSeatId(json.response.vidhanSeat)
            window.sessionStorage.setItem(
              `selectedSecondOption-campaign-${campaignId}`,
              json.response.vidhanSeat.toString()
            )
          }
        }
      } catch {
        return
      }
    }

    void loadUserResponse()

    return () => {
      cancelled = true
    }
  }, [campaignId, getAppUserData])

  const districtOptions = useMemo(
    () =>
      [...campaignData.districts]
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
    [campaignData.districts]
  )

  const filteredDistrictOptions = districtOptions.filter((district) =>
    `${district.name} ${district.englishName}`
      .toLowerCase()
      .includes(districtSearch.toLowerCase())
  )

  const seatOptions =
    campaignData.districts
      .find((district) => district.id === selectedDistrictId)
      ?.seats.map((seat) => ({ id: seat.id, name: seat.seat_name }))
      .sort((left, right) => left.name.localeCompare(right.name)) ?? []

  const selectedItem = selectedSeatId
    ? getSelectedSeat(
        selectedSeatId.toString(),
        campaignData,
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
              selectedItem.cardDetails.subTitle.split(",")[0] ?? "",
              selectedItem.cardDetails.partyName,
            ]}
            onShareItem={(progressItem) =>
              shareMla({
                deeplink: campaignData.meta.day4Deeplink,
                contentTitle: campaignData.meta.title,
                source,
                category: "MLA Page",
                subSource:
                  progressItem.title ?? selectedItem.cardDetails.subTitle,
                constituencyName:
                  selectedItem.cardDetails.subTitle.split(",")[0] ?? "",
                candidateName: selectedItem.cardDetails.title,
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
              <>
                <div className={styles.searchWrap}>
                  <SearchIcon
                    className={styles.searchIcon}
                    style={
                      {
                        "--foreground-color": "var(--secondary-color)",
                      } as CSSProperties
                    }
                  />
                  <input
                    className={styles.searchInput}
                    value={districtSearch}
                    onChange={(event) => setDistrictSearch(event.target.value)}
                    placeholder={translations.districtSearchPlaceholder}
                  />
                  {districtSearch ? (
                    <button
                      type="button"
                      className={styles.searchClearButton}
                      onClick={() => setDistrictSearch("")}
                      aria-label="Clear search"
                    >
                      <span className={styles.searchClearIcon}>×</span>
                    </button>
                  ) : null}
                </div>
                <div className={styles.sheetList}>
                  {filteredDistrictOptions.map((district) => (
                    <button
                      key={district.id}
                      type="button"
                      className={styles.sheetOption}
                      onClick={() => {
                        setSelectedDistrictId(district.id)
                        setSelectedSeatId(null)
                        window.sessionStorage.setItem(
                          `selectedFirstOption-campaign-${campaignId}`,
                          district.id.toString()
                        )
                        window.sessionStorage.setItem(
                          `selectedSecondOption-campaign-${campaignId}`,
                          ""
                        )
                        onToggleDropdown(null)
                      }}
                    >
                      {district.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.sheetList}>
                {seatOptions.map((seat) => (
                  <button
                    key={seat.id}
                    type="button"
                    className={styles.sheetOption}
                    onClick={() => {
                      const payload = {
                        event: "Interactive Survey User Info Submitted",
                        properties: {
                          "Content Location": seat.name,
                          District:
                            districtOptions.find(
                              (district) => district.id === selectedDistrictId
                            )?.name ?? "",
                          "Content Title": campaignData.meta.title,
                          "Content Type": "Interactive Survey",
                        },
                      }

                      console.log(payload)
                      bridge.trackMixpanelEvent(payload)
                      setSelectedSeatId(seat.id)
                      window.sessionStorage.setItem(
                        `selectedSecondOption-campaign-${campaignId}`,
                        seat.id.toString()
                      )
                      onToggleDropdown(null)
                    }}
                  >
                    {seat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export function MlaReportCardClient({
  campaignId,
  campaignData,
  translations,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const activeTab = searchParams.get("activeTab") ?? "4"
  const selectedVidhanId = searchParams.get("vidhan")
  const openDropdownId = searchParams.get("dropdown")
  const resolvedSource = searchParams.get("source")
  const sourceForEvents = resolvedSource || activeTab

  useEffect(() => {
    triggerContentOpenedEvent(sourceForEvents, campaignData.meta.title)
    triggerContentConsumedEvent(sourceForEvents, campaignData.meta.title)
  }, [campaignData.meta.title, sourceForEvents])

  const selectedSeatDetails = selectedVidhanId
    ? getSelectedSeat(selectedVidhanId, campaignData, translations)
    : null

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

    startTransition(() => {
      if (mode === "push") {
        router.push(nextUrl, { scroll: false })
      } else {
        router.replace(nextUrl, { scroll: false })
      }
    })
  }

  const handleCloseHeader = () => {
    if (selectedVidhanId) {
      updateSearchParams({ vidhan: null }, "replace")
      return
    }

    try {
      bridge.closeScreen()
    } catch {
      router.back()
    }
  }

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case "media":
        return (
          <MediaBlock
            media={block.data}
            shareLabel={translations.shareButtonText}
            onShare={() =>
              shareCommon({
                deeplink: campaignData.meta.deeplink,
                contentTitle: campaignData.meta.title,
                source: sourceForEvents,
                category: "Header Video",
                subSource: "Inside Graphic",
                translations,
              })
            }
          />
        )
      case "lineSeparatorWithTitle":
        return (
          <div className={styles.dividerContainer}>
            <div className={styles.dividerLine} />
            <div className={styles.dividerText}>{block.data.title}</div>
            <div className={styles.dividerLine} />
          </div>
        )
      case "dynamicMedia":
        return (
          <DynamicMediaBlock
            data={block.data}
            translations={translations}
            onSelectionChange={(title) =>
              triggerContentItemClickedEvent({
                contentTitle: campaignData.meta.title,
                source: sourceForEvents,
                subSource: title,
                category: "Filters",
              })
            }
            onShare={() =>
              shareCommon({
                deeplink: campaignData.meta.deeplink,
                contentTitle: campaignData.meta.title,
                source: sourceForEvents,
                category: block.data.title,
                subSource: "Inside Graphic",
                translations,
              })
            }
          />
        )
      case "progress":
        return (
          <ProgressReport
            title={block.data.title}
            description={block.data.description}
            items={block.data.items}
          />
        )
      case "horizontalList": {
        const items = getTransformedMlaListForCards(
          block.data.tag,
          campaignData.districts,
          translations
        )
        return (
          <section>
            {block.data.canShowTopDivider ? (
              <div className={styles.separationLine} />
            ) : null}
            <div className={styles.listHeader}>
              <h3 className={styles.sectionTitle}>{block.data.title}</h3>
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
        )
      }
      case "verticalList": {
        const items = getTransformedMlaListForCards(
          block.data.tag,
          campaignData.districts,
          translations
        )
        return (
          <section>
            {block.data.canShowTopDivider ? (
              <div className={styles.separationLine} />
            ) : null}
            <div className={styles.verticalList}>
              <h3 className={styles.sectionTitle}>{block.data.title}</h3>
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
        )
      }
      case "comingSoon":
        return (
          <div className={styles.staticCard}>
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
          <div className={styles.richText}>
            {renderTemplateContent(block.data.templateContent)}
          </div>
        )
      case "tab4":
        return (
          <Tab4Section
            campaignId={campaignId}
            campaignData={campaignData}
            translations={translations}
            source={sourceForEvents}
            openDropdownId={openDropdownId}
            onToggleDropdown={(id) =>
              updateSearchParams({ dropdown: id }, id ? "push" : "replace")
            }
          />
        )
      default:
        return null
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
            onClick={handleCloseHeader}
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
        {visibleBlocks.map((block, index) => (
          <div key={`${activeTab}-${index}`}>{renderBlock(block)}</div>
        ))}
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
          onClose={() => updateSearchParams({ vidhan: null }, "replace")}
        />
      ) : null}
    </div>
  )
}
