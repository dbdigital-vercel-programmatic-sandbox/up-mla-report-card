export interface MlaTranslations {
  shareButtonText: string
  reportCardProgressBarTitle: string
  optionChosen: string
  chooseDistrict: string
  checkSurveyResultDescription: string
  surveyResultHeading: string
  commonShareText: string
  districtSheetTitle: string
  districtSearchPlaceholder: string
  seatSheetTitle: string
  seatSearchPlaceholder: string
  seatPlaceholder: string
  selectDistrictFirst: string
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

export interface ProgressBar {
  icon?: string
  title: string
  percent: string
  color: string
  opacity?: number
  bifurcations?: Array<{
    id: number | string
    title: string
    percent: string
    color: string
    opacity?: number
  }>
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
  imageUrl?: string
  smallImageUrl?: string
  tag?: {
    label: string
    bgColor: string
  }
  title?: string
  partyName?: string
  subTitle: string
  percentage?: string
  yourGivenScore?: string
}

export interface SelectedSeatResultListItem {
  id: string
  text: string
  progressDetails: ProgressDetails[]
}

export interface SelectedSeatResult {
  cardDetails: CardDetails
  listItems: SelectedSeatResultListItem[]
}

export interface MlaReportCardData {
  meta: {
    deeplink: string
    title: string
    headerText: string
  }
  districts: District[]
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
  seat_english_name?: string
  tags?: string[]
  mla_info?: {
    name: string
    score: number
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
    score: number
    bifurcations?: Array<{
      id: number | string
      text: string
      score: number
    }>
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
