import { notFound } from "next/navigation"

import { MlaReportCardClient } from "@/src/features/mla-report-card/MlaReportCardClient"
import { getCampaignData } from "@/src/features/mla-report-card/data"
import { mlaTranslations } from "@/src/features/mla-report-card/translations"

export const dynamic = "force-dynamic"

export default async function MlaReportCardPage({
  params,
}: {
  params: Promise<{ campaignId: string }>
}) {
  const { campaignId } = await params
  const campaignData = await getCampaignData(campaignId)

  if (!campaignData) {
    notFound()
  }

  return (
    <MlaReportCardClient
      campaignId={campaignId}
      campaignData={campaignData}
      translations={mlaTranslations}
    />
  )
}
