import { desc, eq, or } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { surveyResponses } from "@/lib/db/schema"
import {
  CM_CASTE_OPTIONS,
  CM_FACE_OTHER_VALUE,
  CM_QUALITY_OPTIONS,
  NITISH_STEP_DOWN_OPTIONS,
  NITISH_TENURE_OPTIONS,
  normalizePhoneNumber,
} from "@/lib/survey"

export const dynamic = "force-dynamic"

function databaseUnavailable() {
  return NextResponse.json(
    { error: "DATABASE_URL is not configured." },
    { status: 503 }
  )
}

function getRequiredString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function isDuplicateConstraintError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("duplicate key value")
  )
}

function isAllowedOption(options: readonly string[], value: string) {
  return options.includes(value)
}

async function findExistingSubmission(userId: string, phoneNumber: string) {
  const [submission] = await db
    .select()
    .from(surveyResponses)
    .where(
      or(
        eq(surveyResponses.userId, userId),
        eq(surveyResponses.phoneNumber, phoneNumber)
      )
    )
    .orderBy(desc(surveyResponses.createdAt), desc(surveyResponses.id))
    .limit(1)

  return submission ?? null
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return databaseUnavailable()
  }

  const url = new URL(request.url)
  const userId = getRequiredString(url.searchParams.get("userId"))
  const phoneNumber = normalizePhoneNumber(url.searchParams.get("phoneNumber"))

  if (!userId || !phoneNumber) {
    return NextResponse.json(
      { error: "userId and phoneNumber are required." },
      { status: 400 }
    )
  }

  const submission = await findExistingSubmission(userId, phoneNumber)

  return NextResponse.json({ submission })
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return databaseUnavailable()
  }

  const body = await request.json()
  const userId = getRequiredString(body.userId)
  const userName = getRequiredString(body.userName)
  const phoneNumber = normalizePhoneNumber(body.phoneNumber)
  const cmFace = getRequiredString(body.cmFace)
  const cmCaste = getRequiredString(body.cmCaste)
  const cmQuality = getRequiredString(body.cmQuality)
  const nitishShouldStepDown = getRequiredString(body.nitishShouldStepDown)
  const nitishTenurePreference = getRequiredString(body.nitishTenurePreference)

  if (
    !userId ||
    !phoneNumber ||
    !cmFace ||
    !cmCaste ||
    !cmQuality ||
    !nitishShouldStepDown ||
    !nitishTenurePreference
  ) {
    return NextResponse.json(
      { error: "All survey fields are required." },
      { status: 400 }
    )
  }

  if (cmFace === CM_FACE_OTHER_VALUE) {
    return NextResponse.json(
      { error: "A custom CM face answer is required." },
      { status: 400 }
    )
  }

  if (!isAllowedOption(CM_CASTE_OPTIONS, cmCaste)) {
    return NextResponse.json(
      { error: "Invalid caste option." },
      { status: 400 }
    )
  }

  if (!isAllowedOption(CM_QUALITY_OPTIONS, cmQuality)) {
    return NextResponse.json(
      { error: "Invalid quality option." },
      { status: 400 }
    )
  }

  if (!isAllowedOption(NITISH_STEP_DOWN_OPTIONS, nitishShouldStepDown)) {
    return NextResponse.json(
      { error: "Invalid step-down option." },
      { status: 400 }
    )
  }

  if (!isAllowedOption(NITISH_TENURE_OPTIONS, nitishTenurePreference)) {
    return NextResponse.json(
      { error: "Invalid tenure option." },
      { status: 400 }
    )
  }

  const existingSubmission = await findExistingSubmission(userId, phoneNumber)

  if (existingSubmission) {
    return NextResponse.json(
      {
        error: "आप यह सर्वे पहले ही भर चुके हैं।",
        submission: existingSubmission,
      },
      { status: 409 }
    )
  }

  try {
    const [submission] = await db
      .insert(surveyResponses)
      .values({
        userId,
        userName,
        phoneNumber,
        cmFace,
        cmCaste,
        cmQuality,
        nitishShouldStepDown,
        nitishTenurePreference,
      })
      .returning()

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    if (isDuplicateConstraintError(error)) {
      const submission = await findExistingSubmission(userId, phoneNumber)

      return NextResponse.json(
        {
          error: "आप यह सर्वे पहले ही भर चुके हैं।",
          submission,
        },
        { status: 409 }
      )
    }

    throw error
  }
}
