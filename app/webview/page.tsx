import { MlaReportCardClient } from "@/src/features/mla-report-card/MlaReportCardClient"
import { mlaTranslations } from "@/src/features/mla-report-card/translations"
import type { MlaReportCardData } from "@/src/features/mla-report-card/types"

import data from "./data/uk-mla-report-card.json"

export const dynamic = "force-dynamic"

export default async function WebviewPage() {
  return (
    <MlaReportCardClient
      data={data as MlaReportCardData}
      translations={mlaTranslations}
    />
  )
}
