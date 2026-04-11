import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import type { MlaCampaignData } from "./types"

const dataDir = path.join(process.cwd(), "src/features/mla-report-card/data")

export async function getCampaignData(campaignId: string) {
  try {
    const filePath = path.join(dataDir, `campaign-${campaignId}.json`)
    const fileContent = await readFile(filePath, "utf8")
    const parsed = JSON.parse(fileContent) as MlaCampaignData

    if (campaignId === "22") {
      parsed.meta.headerText = "भास्कर सर्वे रिजल्ट"
    }

    return parsed
  } catch {
    return null
  }
}

export async function getAvailableCampaignIds() {
  const fileNames = await readdir(dataDir)

  return fileNames
    .map((fileName) => fileName.match(/^campaign-(.+)\.json$/)?.[1] ?? null)
    .filter((campaignId): campaignId is string => campaignId !== null)
    .sort((left, right) => Number(left) - Number(right))
}
