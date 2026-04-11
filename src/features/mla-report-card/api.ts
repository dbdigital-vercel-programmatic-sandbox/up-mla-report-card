export type UserCredentials = {
  auth_token: string
  user?: {
    unique_id?: string
    phone_number?: string
  }
}

export async function fetchSurveyAttemptResponse(
  campaignId: string,
  userCredentials: UserCredentials,
  apiBaseUrl: string,
  xAutT: string
) {
  const headers = new Headers()

  headers.set("at", userCredentials.auth_token)
  headers.set("x-aut-t", xAutT)
  headers.set("a-ver-code", "600")
  headers.set("deviceid", userCredentials.user?.unique_id || "")
  headers.set("msisdn", userCredentials.user?.phone_number || "")

  const response = await fetch(
    new URL(
      `/api/1.0/web-backend/survey/vidhan/${campaignId}/response`,
      apiBaseUrl
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
