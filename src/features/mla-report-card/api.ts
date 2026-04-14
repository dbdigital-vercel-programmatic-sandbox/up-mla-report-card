export type UserCredentials = {
  auth_token: string
  user?: {
    unique_id?: string
    phone_number?: string
  }
}

export type UserPreferenceCity = {
  id: number
  engName: string
  listingUrl: string
}

export async function fetchSurveyAttemptResponse(
  campaignId: string,
  userCredentials: UserCredentials
) {
  const headers = new Headers()

  headers.set("at", userCredentials.auth_token)
  headers.set("x-aut-t", "a6oaq3edtz59")
  headers.set("a-ver-code", "600")
  headers.set("deviceid", userCredentials.user?.unique_id || "")
  headers.set("msisdn", userCredentials.user?.phone_number || "")
  headers.set("cid", "521")

  const response = await fetch(
    new URL(
      `/api/1.0/web-backend/survey/vidhan/${campaignId}/response`,
      "https://prod.bhaskarapi.com"
    ).toString(),
    {
      method: "GET",
      headers,
    }
  )

  if (response.status !== 200) {
    throw new Error(`Invalid response: ${response.status}`)
  }

  return response.json()
}

export async function fetchUserPreferenceCities(
  stateIds: number[],
  userCredentials: UserCredentials
) {
  const headers = new Headers()

  headers.set("at", userCredentials.auth_token)
  headers.set("x-aut-t", "a6oaq3edtz59")
  headers.set("a-ver-code", "600")
  headers.set("cid", "521")
  headers.set("dtyp", "web")
  headers.set("content-type", "application/json")

  const url = new URL("https://prod.bhaskarapi.com/api/3.0/user/prefs/cities")
  if (stateIds.length > 0) {
    url.searchParams.set("stateIds", stateIds.join(","))
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
    credentials: "include",
  })

  if (response.status !== 200) {
    throw new Error(`Invalid response: ${response.status}`)
  }

  return response.json() as Promise<{ cities?: UserPreferenceCity[] }>
}
