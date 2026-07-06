import type {
  District,
  MlaReportCardData,
  MlaTranslations,
  ProgressDetails,
  Question,
  SelectedSeatResult,
  UserResponse,
} from "./types"

const PARTY_ICON_BASE =
  "https://images.bhaskarassets.com/web2images/web-frontend/mla-report-card/party"
const MLA_IMAGE_BASE = "/mla-report-card/mla"
export const CONTENT_TYPE = "Interactive Survey"

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

function getScorePercent(score: number) {
  return `${score}%`
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
  shareText: string
  shareImage: string
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
    args.shareText,
    args.shareImage,
    CONTENT_TYPE,
    `${args.shareText}\n${args.deeplink}`
  )
}

function getPartyIcon(party: string, translations: MlaTranslations) {
  return translations.partyNames[party] ?? "Others"
}

function buildCardDetails(
  district: District,
  seat: District["seats"][number],
  translations: MlaTranslations
) {
  const partyIcon = seat.mla_info
    ? getPartyIcon(seat.mla_info.party, translations)
    : undefined

  return {
    id: seat.id.toString(),
    subTitle: `${seat.seat_name}, ${district.district_name}`,
    title: seat.mla_info?.name,
    imageUrl: seat.mla_info?.image
      ? `${MLA_IMAGE_BASE}/${seat.mla_info.image}`
      : undefined,
    tag: seat.mla_info?.position
      ? {
          label: seat.mla_info.position,
          bgColor:
            "color-mix(in srgb, var(--secondary-common-color) 12%, var(--background-color-main))",
        }
      : undefined,
    smallImageUrl: partyIcon
      ? `${PARTY_ICON_BASE}/${partyIcon}.jpg`
      : undefined,
    percentage:
      seat.mla_info?.score !== undefined
        ? getScorePercent(seat.mla_info.score)
        : undefined,
    partyName: seat.mla_info?.party,
  }
}

function buildQuestionProgress(
  question: Question,
  translations: MlaTranslations,
  userResponse?: UserResponse,
  isFirstQuestion = false,
  hasMlaInfo = false
): ProgressDetails {
  const selectedAnswer = userResponse?.response?.answers.find(
    (answer) => answer.question === question.id
  )
  const selectedOption = question.options.find(
    (option) => option.id === selectedAnswer?.options[0]
  )
  const topOption = question.options.reduce<
    Question["options"][number] | undefined
  >((bestOption, option) => {
    if (!bestOption || option.score > bestOption.score) {
      return option
    }

    return bestOption
  }, undefined)
  const shouldHighlightTopOption = isFirstQuestion && hasMlaInfo

  const progressBars = question.options.map((option, index) => {
    const bifurcations = option.dependentQuestion?.options ?? option.bifurcations

    return {
    title: option.text,
    percent: getScorePercent(option.score),
    color:
      shouldHighlightTopOption && option.id === topOption?.id
        ? "#8BC66F"
        : !shouldHighlightTopOption && index === 0
          ? "#8BC66F"
          : "#BEBEBE",
    opacity: 0.3,
    icon: "",
    bifurcationTitle: option.dependentQuestion?.text,
    bifurcations: bifurcations?.map((bifurcation, bifurcationIndex) => ({
      id: bifurcation.id,
      title: bifurcation.text,
      percent: getScorePercent(bifurcation.score),
      color: bifurcationIndex === 0 ? "#8BC66F" : "#BEBEBE",
      opacity: 0.3,
    })),
    }
  })

  const detail: ProgressDetails = {
    title: question.text,
    progressSections: [
      {
        progressBars,
      },
    ],
  }

  if (selectedOption) {
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
  data: MlaReportCardData,
  translations: MlaTranslations,
  userResponse?: UserResponse
): SelectedSeatResult | null {
  for (const district of data.districts) {
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
            progressDetails: seat.questions.map((question, index) =>
              buildQuestionProgress(
                question,
                translations,
                userResponse,
                index === 0,
                Boolean(seat.mla_info)
              )
            ),
          },
        ],
      }
    }
  }

  return null
}
