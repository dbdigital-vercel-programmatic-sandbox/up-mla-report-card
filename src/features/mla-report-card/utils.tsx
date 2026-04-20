import type { ReactNode } from "react"

import type {
  District,
  ItemDetailData,
  MlaCampaignData,
  MlaTranslations,
  ProgressDetails,
  Question,
  TemplateContentItem,
  UserResponse,
} from "./types"

const PARTY_ICON_BASE =
  "https://images.bhaskarassets.com/web2images/web-frontend/mla-report-card/party"
const MLA_IMAGE_BASE =
  "https://images.bhaskarassets.com/web2images/web-frontend/mla-report-card/mla"
export const CONTENT_TYPE = "Interactive Survey"
export const CONTENT_TITLE = "Interactive Survey Result"

export type WebviewBridgeActions = {
  isWebview: boolean
  methodExists: (
    methods: Array<"trackMixpanelEvent" | "trackInteractivePage">
  ) => {
    or: boolean
    and: boolean
    rawData: unknown[]
  }
  trackMixpanelEvent: (payload: Record<string, unknown>) => void
  trackInteractivePage: (payload: Record<string, unknown>) => void
  shareArticle: (
    storyUrl: string,
    title: string,
    imageUrl: string,
    categoryName: string,
    overrideTemplate?: string,
    hasWatermark?: boolean
  ) => void
}
type MlaListTag =
  | "overallTop"
  | "congressTop"
  | "BJPTop"
  | "overallBottom"
  | "congressBottom"
  | "BJPBottom"

function getScorePercent(score: number) {
  return `${score}%`
}

function renderMarkupText(item: TemplateContentItem) {
  if (!item.markups?.length) {
    return item.text
  }

  const boldRanges = item.markups
    .filter((markup) => markup.mType === "bold")
    .sort((left, right) => left.start - right.start)

  if (boldRanges.length === 0) {
    return item.text
  }

  const nodes: ReactNode[] = []
  let cursor = 0

  boldRanges.forEach((range, index) => {
    if (range.start > cursor) {
      nodes.push(item.text.slice(cursor, range.start))
    }

    nodes.push(
      <strong key={`${item.hash}-bold-${index}`}>
        {item.text.slice(range.start, range.end)}
      </strong>
    )
    cursor = range.end
  })

  if (cursor < item.text.length) {
    nodes.push(item.text.slice(cursor))
  }

  return nodes
}

export function renderTemplateContent(items: TemplateContentItem[]) {
  return items.map((item) => {
    if (item.type === "ul") {
      return (
        <ul key={item.hash}>
          {item.items.map((listItem, index) => (
            <li key={`${item.hash}-${index}`}>{listItem.text}</li>
          ))}
        </ul>
      )
    }

    return <p key={item.hash}>{renderMarkupText(item)}</p>
  })
}

export function triggerContentOpenedEvent(
  bridgeActions: WebviewBridgeActions,
  source: string,
  contentTitle: string
) {
  if (
    !bridgeActions.isWebview ||
    !bridgeActions.methodExists(["trackMixpanelEvent"]).or
  ) {
    return
  }

  const payload = {
    event: "Interactive Content Opened",
    properties: {
      Source: source,
      "Content Type": CONTENT_TYPE,
      "Content Title": contentTitle,
    },
  }

  console.log(payload)
  bridgeActions.trackMixpanelEvent(payload)
}

export function triggerContentConsumedEvent(
  bridgeActions: WebviewBridgeActions,
  source: string,
  contentTitle: string
) {
  if (
    !bridgeActions.isWebview ||
    !bridgeActions.methodExists(["trackInteractivePage"]).or
  ) {
    return
  }

  if (typeof window === "undefined") {
    return
  }

  const sessionKey = `interactive-consumed-${contentTitle}`
  const triggeredOnce = window.sessionStorage.getItem(sessionKey)
  if (triggeredOnce) {
    return
  }

  window.sessionStorage.setItem(sessionKey, "true")
  const payload = {
    event: "Interactive Content Consumed",
    properties: {
      Source: source,
      "Content Type": CONTENT_TYPE,
      "Content Title": contentTitle,
    },
  }

  console.log(payload)
  bridgeActions.trackInteractivePage(payload)
}

export function triggerContentItemClickedEvent(clickedEvent: {
  bridgeActions: WebviewBridgeActions
  source: string
  subSource: string
  contentTitle: string
  category: "Top Buttons" | "Filters"
}) {
  if (
    !clickedEvent.bridgeActions.isWebview ||
    !clickedEvent.bridgeActions.methodExists(["trackMixpanelEvent"]).or
  ) {
    return
  }

  const payload = {
    event: "Interactive Content Item Clicked",
    properties: {
      Source: clickedEvent.source,
      "Sub Source": clickedEvent.subSource,
      Category: clickedEvent.category,
      "Content Type": CONTENT_TYPE,
      "Content Title": clickedEvent.contentTitle,
    },
  }

  console.log(payload)
  clickedEvent.bridgeActions.trackMixpanelEvent(payload)
}

export function triggerContentFilterAddedEvent(filterEvent: {
  bridgeActions: WebviewBridgeActions
  source: string
  district: string
  contentTitle: string
}) {
  if (
    !filterEvent.bridgeActions.isWebview ||
    !filterEvent.bridgeActions.methodExists(["trackMixpanelEvent"]).or
  ) {
    return
  }

  const payload = {
    event: "Interactive Content Filter Added",
    properties: {
      Source: filterEvent.source,
      "Content Type": CONTENT_TYPE,
      "Content Title": filterEvent.contentTitle,
      District: filterEvent.district,
    },
  }

  console.log(payload)
  filterEvent.bridgeActions.trackMixpanelEvent(payload)
}

export function shareCommon(args: {
  bridgeActions: WebviewBridgeActions
  deeplink: string
  contentTitle: string
  source: string
  category: string
  subSource: string
  translations: MlaTranslations
}) {
  if (!args.bridgeActions.isWebview) {
    return
  }

  const payload = {
    event: "Content Shared",
    properties: {
      Source: args.source,
      "Content Title": args.contentTitle,
      "Content Type": CONTENT_TYPE,
      Category: args.category,
      "Sub Source": args.subSource,
    },
  }

  console.log(payload)
  args.bridgeActions.trackMixpanelEvent(payload)

  args.bridgeActions.shareArticle(
    args.deeplink,
    args.translations.commonShareText,
    "",
    CONTENT_TYPE,
    `${args.translations.commonShareText}${args.deeplink}`
  )
}

export function shareMla(args: {
  bridgeActions: WebviewBridgeActions
  deeplink: string
  contentTitle: string
  source: string
  category: string
  subSource: string
  constituencyName: string
  candidateName: string
  translations: MlaTranslations
}) {
  if (!args.bridgeActions.isWebview) {
    return
  }

  const payload = {
    event: "Content Shared",
    properties: {
      Source: args.source,
      "Content Title": args.contentTitle,
      "Content Type": CONTENT_TYPE,
      Category: args.category,
      "Sub Source": args.subSource,
    },
  }

  console.log(payload)
  args.bridgeActions.trackMixpanelEvent(payload)

  const stateCode = args.contentTitle.split(
    " "
  )[0] as keyof typeof args.translations.stateMapping
  const sharingText = args.translations.mlaShareText
    .replace("$$ConstituencyName$$", args.constituencyName)
    .replace("$$CandidateName$$", args.candidateName)
    .replace(
      "$$StateName$$",
      args.translations.stateMapping[stateCode] ||
        args.translations.stateMapping.MP
    )

  args.bridgeActions.shareArticle(
    args.deeplink,
    sharingText,
    "",
    CONTENT_TYPE,
    `${sharingText}${args.deeplink}`
  )
}

export function getPartyIcon(party: string, translations: MlaTranslations) {
  return translations.partyNames[party] ?? "Others"
}

export function getMarkingFormula(
  translations: MlaTranslations
): TemplateContentItem[] {
  return [
    {
      hash: "1",
      type: "paragraph",
      text: translations.markingFormula,
      url: "",
      items: [],
      markups: [
        { mType: "bold", start: 0, end: translations.markingFormula.length },
      ],
    },
    {
      hash: "2",
      type: "ul",
      text: "",
      url: "",
      items: [
        { type: "li", text: translations.scoreOfEveryQuestion },
        { type: "li", text: translations.countingScoreOfMla },
      ],
    },
  ]
}

export function buildCardDetails(
  district: District,
  seat: District["seats"][number],
  translations: MlaTranslations
) {
  const partyIcon = getPartyIcon(seat.mla_info.party, translations)

  return {
    id: seat.id.toString(),
    subTitle: `${seat.seat_name}, ${district.district_name}`,
    title: seat.mla_info.name,
    imageUrl: `${MLA_IMAGE_BASE}/${seat.mla_info.image}`,
    tag: seat.mla_info.position
      ? {
          label: seat.mla_info.position,
          bgColor:
            "color-mix(in srgb, var(--secondary-common-color) 12%, var(--background-color-main))",
        }
      : undefined,
    smallImageUrl: `${PARTY_ICON_BASE}/${partyIcon}.jpg`,
    percentage: getScorePercent(seat.mla_info.score),
    partyName: seat.mla_info.party,
  }
}

function buildQuestionProgress(
  question: Question,
  translations: MlaTranslations,
  userResponse?: UserResponse
): ProgressDetails {
  const selectedAnswer = userResponse?.response?.answers.find(
    (answer) => answer.question === question.id
  )
  const selectedOption = question.options.find(
    (option) => option.id === selectedAnswer?.options[0]
  )

  const progressBars = question.options.map((option, index) => ({
    title: option.text,
    percent: getScorePercent(option.score),
    color: index === 0 ? "#8BC66F" : "#BEBEBE",
    opacity: 0.3,
    icon: "",
  }))

  const detail: ProgressDetails = {
    title: question.text,
    progressSections: [
      {
        progressBars,
      },
    ],
  }

  if (selectedOption) {
    const topOption = question.options.reduce<
      Question["options"][number] | undefined
    >((bestOption, option) => {
      if (!bestOption || option.score > bestOption.score) {
        return option
      }

      return bestOption
    }, undefined)

    detail.footerDescription = {
      color: selectedOption.id === topOption?.id ? "#5EB30D" : "#BEBEBE",
      text: translations.optionChosen.replace(
        "$$optionText$$",
        selectedOption.text
      ),
      thumbIcon: selectedOption.id === topOption?.id ? "👍" : "👎",
    }
  }

  return detail
}

export function getSelectedSeat(
  vidhanId: string,
  campaignData: MlaCampaignData,
  translations: MlaTranslations,
  userResponse?: UserResponse
): ItemDetailData | null {
  for (const district of campaignData.districts) {
    for (const seat of district.seats) {
      if (seat.id.toString() !== vidhanId) {
        continue
      }

      return {
        cardDetails: buildCardDetails(district, seat, translations),
        listItems: [
          {
            id: seat.id.toString(),
            text: translations.reportCardProgressBarTitle,
            progressDetails: seat.questions.map((question) =>
              buildQuestionProgress(question, translations, userResponse)
            ),
          },
        ],
        templateContent: getMarkingFormula(translations),
      }
    }
  }

  return null
}

export function getTransformedMlaListForCards(
  tag: MlaListTag,
  districts: District[],
  translations: MlaTranslations
) {
  const cards = districts.flatMap((district) =>
    district.seats
      .filter((seat) => seat.tags?.includes(tag))
      .map((seat) => buildCardDetails(district, seat, translations))
  )

  return cards.sort((left, right) => {
    const leftScore = Number(left.percentage.replace("%", ""))
    const rightScore = Number(right.percentage.replace("%", ""))
    return tag.endsWith("Top") ? rightScore - leftScore : leftScore - rightScore
  })
}

export async function shareContent({
  title,
  text,
  url,
}: {
  title: string
  text: string
  url: string
}) {
  if (typeof window === "undefined") {
    return
  }

  if (navigator.share) {
    await navigator.share({ title, text, url })
    return
  }

  const shareText = `${text}${url}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  window.open(whatsappUrl, "_blank", "noopener,noreferrer")
}
