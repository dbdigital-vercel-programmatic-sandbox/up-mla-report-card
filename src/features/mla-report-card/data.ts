import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import type { MlaCampaignData } from "./types"

const dataDir = path.join(process.cwd(), "src/features/mla-report-card/data")

export async function getCampaignData(campaignId: string) {
  try {
    const filePath = path.join(dataDir, `campaign-${campaignId}.json`)
    const fileContent = await readFile(filePath, "utf8")
    const parsed = JSON.parse(fileContent) as MlaCampaignData

    return parsed
  } catch {
    return null
  }
}


