import { AppPromotionScreen } from "@/src/features/mla-report-card/AppPromotionScreen"
import type { MlaReportCardData } from "@/src/features/mla-report-card/types"

import data from "./webview/data/uk-mla-report-card.json"

export const dynamic = "force-dynamic"

export default async function Page() {
  return <AppPromotionScreen data={data as MlaReportCardData} />
}
