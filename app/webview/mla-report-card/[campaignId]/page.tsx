import { notFound } from "next/navigation"

import { MlaReportCardClient } from "@/src/features/mla-report-card/MlaReportCardClient"
import { mlaTranslations } from "@/src/features/mla-report-card/translations"
import { MlaCampaignData } from "@/src/features/mla-report-card/types"

export const dynamic = "force-dynamic"

export default async function MlaReportCardPage({
  params,
}: {
  params: Promise<{ campaignId: string }>
}) {
  const { campaignId } = await params

  if (!campaignId) {
    notFound()
  }

  const response = await fetch(
    `https://www.bhaskar.com/__static__/2.0/mla-report-card/campaign-${campaignId}.json`,
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    notFound()
  }

  const data = (await response.json()) as MlaCampaignData

  return (
    <MlaReportCardClient
      campaignId={campaignId}
      campaignData={data}
      translations={mlaTranslations}
    />
  )
}
