export type TabKey = "1" | "2" | "3" | "4"

export interface MlaTranslations {
  score: string
  totalScore: string
  yourGivenScore: string
  shareButtonText: string
  reportCardProgressBarTitle: string
  optionChosen: string
  chooseDistrict: string
  chooseMlaSeat: string
  markingFormula: string
  scoreOfEveryQuestion: string
  countingScoreOfMla: string
  checkSurveyResultDescription: string
  surveyResultHeading: string
  yes: string
  no: string
  mlaReportCard: string
  commonShareText: string
  mlaShareText: string
  districtSheetTitle: string
  districtSearchPlaceholder: string
  seatSheetTitle: string
  seatPlaceholder: string
  close: string
  searchDistrict: string
  selectDistrictFirst: string
  stateMapping: Record<string, string>
  partyNames: Record<string, string>
}

export interface TemplateMarkup {
  mType: string
  start: number
  end: number
  value?: string
}

export interface TemplateListItem {
  type: "li"
  text: string
}

export interface TemplateContentItem {
  hash: string
  type: "paragraph" | "ul"
  text: string
  url: string
  items: TemplateListItem[]
  markups?: TemplateMarkup[]
}

export interface TabItem {
  id: string
  displayName: string
  engName: string
  shortUrl: string
}

export interface VideoDetails {
  storyId: number
  videoUrl: string
  duration: number
  category: {
    id: number | string
    nameEn: string
    displayName: string
    img: string
  }
}

export interface MediaItem {
  id: string
  type: "image" | "video"
  thumbUrl: string
  sharing: {
    title: string
    url: string
  }
  videoDetails?: VideoDetails
  mediaDescription?: TemplateContentItem[]
}

export interface DynamicMediaOption {
  id: string
  title: string
  media: MediaItem
}

export interface DynamicMediaData {
  id: string
  title: string
  description: string
  items: DynamicMediaOption[]
}

export interface ProgressBar {
  icon?: string
  title: string
  percent: string
  color: string
  opacity?: number
}

export interface ProgressSection {
  imageUrl?: string
  description?: string
  progressBars: ProgressBar[]
}

export interface ProgressDetails {
  title?: string
  progressSections: ProgressSection[]
  footerDescription?: { text: string; color: string; thumbIcon?: string }
}

export interface CardDetails {
  id: string
  imageUrl: string
  smallImageUrl: string
  tag?: {
    label: string
    bgColor: string
  }
  title: string
  partyName: string
  subTitle: string
  percentage: string
  yourGivenScore?: string
}

export interface ItemDetailListItem {
  id: string
  text: string
  progressDetails: ProgressDetails[]
}

export interface ItemDetailData {
  cardDetails: CardDetails
  listItems: ItemDetailListItem[]
  templateContent?: TemplateContentItem[]
}

export interface HeaderMediaBlock {
  type: "media"
  data: MediaItem
}

export interface DividerBlock {
  type: "lineSeparatorWithTitle"
  data: {
    id: string
    title: string
  }
}

export interface DynamicMediaBlock {
  type: "dynamicMedia"
  data: DynamicMediaData
}

export interface ProgressBlock {
  type: "progress"
  data: {
    id: string
    title: string
    description: string
    items: ProgressDetails[]
  }
}

export interface MlaListBlock {
  type: "horizontalList" | "verticalList"
  data: {
    id: string
    tag:
      | "overallTop"
      | "congressTop"
      | "BJPTop"
      | "overallBottom"
      | "congressBottom"
      | "BJPBottom"
    title: string
    partyIcon?: string
    canShowTopDivider?: boolean
    description: string
  }
}

export interface ComingSoonBlock {
  type: "comingSoon"
  data: {
    id: string
    templateContent: TemplateContentItem[]
  }
}

export interface RichTextBlock {
  type: "richText"
  data: {
    id: string
    templateContent: TemplateContentItem[]
  }
}

export interface Tab4Block {
  type: "tab4"
  data: {
    id: string
    title: string
    description: TemplateContentItem[]
  }
}

export type ContentBlock =
  | HeaderMediaBlock
  | DividerBlock
  | DynamicMediaBlock
  | ProgressBlock
  | MlaListBlock
  | ComingSoonBlock
  | RichTextBlock
  | Tab4Block

export interface MlaCampaignData {
  tabs: TabItem[]
  meta: {
    deeplink: string
    title: string
    headerText: string
    day3Deeplink: string
    day4Deeplink: string
  }
  districts: District[]
  1: ContentBlock[]
  2?: ContentBlock[]
  3?: ContentBlock[]
  4?: ContentBlock[]
}

export interface District {
  id: number
  district_name: string
  district_english_name?: string
  position: number | string
  state_name: string
  seats: Seat[]
}

export interface Seat {
  id: number
  seat_name: string
  tags?: string[]
  mla_info: {
    name: string
    score: string | number
    position: string
    image: string
    party: string
  }
  questions: Question[]
}

export interface Question {
  id: number
  text: string
  options: Array<{
    id: number
    text: string
    score: string | number
  }>
}

export interface UserResponse {
  hasAttempted: boolean
  response?: {
    id: number
    msisdn: string
    vidhanSeat: number
    state: number
    district: number
    answers: Array<{
      question: number
      options: number[]
      customValue: string
    }>
    createdAt: string
  }
}
