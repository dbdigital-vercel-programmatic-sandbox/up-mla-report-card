"use client"

import { useEffect, useRef, useState } from "react"

import { useWebviewContext } from "@/bridge"

import type { District, UserResponse } from "./types"

type UsePrefillDistrictsAndSeatArgs = {
  campaignId: string
  districts: District[]
  setDistrict: (districtId: number | null) => void
  setVidhanSeat: (seatId: number | null) => void
}

type AppUserData = {
  auth_token: string
  user?: {
    unique_id?: string
    phone_number?: string
  }
}

type UserPreferenceCity = {
  id: number
  engName: string
  listingUrl: string
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function getCityLevelListingUrl(value: string) {
  return value.trim().toLowerCase().replace(/\/+$/, "")
}

export function usePrefillDistrictsAndSeat({
  campaignId,
  districts,
  setDistrict,
  setVidhanSeat,
}: UsePrefillDistrictsAndSeatArgs) {
  const { getAppUserData, getUserSelectedPreferences, methodExists } =
    useWebviewContext()
  const districtStorageKey = `selectedFirstOption-campaign-${campaignId}`
  const seatStorageKey = `selectedSecondOption-campaign-${campaignId}`
  const hasAutoSelectedDistrictRef = useRef(false)
  const [userResponse, setUserResponse] = useState<UserResponse | null>(null)
  const [canRunPreferencesFallback, setCanRunPreferencesFallback] =
    useState(false)
  const surveyResponseUrl = `https://prod.bhaskarapi.com/api/1.0/web-backend/survey/vidhan/${campaignId}/response`
  const userPreferenceCitiesUrl =
    "https://prod.bhaskarapi.com/api/3.0/user/prefs/cities"

  useEffect(() => {
    const storedDistrict = window.localStorage.getItem(districtStorageKey)
    const storedSeat = window.localStorage.getItem(seatStorageKey)
    const parsedDistrict = storedDistrict ? Number(storedDistrict) : null
    const parsedSeat = storedSeat ? Number(storedSeat) : null
    console.log({ storedDistrict, storedSeat, parsedDistrict, parsedSeat })

    setDistrict(
      parsedDistrict !== null && !Number.isNaN(parsedDistrict)
        ? parsedDistrict
        : null
    )
    setVidhanSeat(
      parsedSeat !== null && !Number.isNaN(parsedSeat) ? parsedSeat : null
    )
    hasAutoSelectedDistrictRef.current = false
    setCanRunPreferencesFallback(false)

    console.log("[usePrefillDistrictsAndSeat] restored local storage", {
      campaignId,
      districtStorageKey,
      seatStorageKey,
      storedDistrict,
      storedSeat,
      parsedDistrict,
      parsedSeat,
    })
  }, [
    campaignId,
    districtStorageKey,
    seatStorageKey,
    setDistrict,
    setVidhanSeat,
  ])

  useEffect(() => {
    let cancelled = false

    const loadUserResponse = async () => {
      const hasLocalDistrict = Boolean(
        window.localStorage.getItem(districtStorageKey)
      )
      const hasLocalSeat = Boolean(window.localStorage.getItem(seatStorageKey))
      const canReadAppUserData = methodExists([
        "getAppUserData",
        "getAppUserDataV2",
      ]).or

      console.log(
        "[usePrefillDistrictsAndSeat] checking survey response prefill",
        {
          campaignId,
          hasLocalDistrict,
          hasLocalSeat,
          canReadAppUserData,
          surveyResponseUrl,
        }
      )

      if (hasLocalDistrict && hasLocalSeat) {
        console.log(
          "[usePrefillDistrictsAndSeat] skipping survey response api: district and seat already in local storage"
        )
        setCanRunPreferencesFallback(true)
        return
      }

      if (!canReadAppUserData) {
        console.log(
          "[usePrefillDistrictsAndSeat] skipping survey response api: getAppUserData bridge method unavailable"
        )
        setCanRunPreferencesFallback(true)
        return
      }

      try {
        const userData = (await getAppUserData()) as AppUserData
        const headers = new Headers()

        headers.append("x-aut-t", "a6oaq3edtz59")
        headers.append("cid", "521")
        headers.append("at", userData.auth_token)
        headers.append("msisdn", userData.user?.phone_number ?? "")

        console.log(
          "[usePrefillDistrictsAndSeat] survey response api request",
          {
            campaignId,
            url: surveyResponseUrl,
            headers: {
              "x-aut-t": "a6oaq3edtz59",
              cid: "521",
              at: userData.auth_token,
              msisdn: userData.user?.phone_number ?? "",
            },
          }
        )
        console.log(
          `[usePrefillDistrictsAndSeat] API CALL STARTED: ${surveyResponseUrl}`
        )

        const response = await fetch(surveyResponseUrl, {
          method: "GET",
          headers,
        })

        console.log(
          `[usePrefillDistrictsAndSeat] API CALL COMPLETED: ${surveyResponseUrl}`
        )
        console.log("[usePrefillDistrictsAndSeat] survey response api status", {
          campaignId,
          url: surveyResponseUrl,
          status: response.status,
          ok: response.ok,
        })

        if (!response.ok) {
          throw new Error(`Invalid survey response: ${response.status}`)
        }

        const json = (await response.json()) as UserResponse
        const responseData = json.response

        console.log("[usePrefillDistrictsAndSeat] survey response api body", {
          campaignId,
          data: json,
        })

        if (cancelled) {
          console.log(
            "[usePrefillDistrictsAndSeat] ignoring survey response api result because effect was cancelled"
          )
          return
        }

        setUserResponse(json)

        if (json.hasAttempted && responseData) {
          console.log(
            "[usePrefillDistrictsAndSeat] applying survey response prefill",
            {
              district: responseData.district,
              vidhanSeat: responseData.vidhanSeat,
              hasLocalDistrict,
              hasLocalSeat,
            }
          )

          if (!hasLocalDistrict && responseData.district) {
            setDistrict(responseData.district)
            window.localStorage.setItem(
              districtStorageKey,
              responseData.district.toString()
            )
          }

          if (!hasLocalSeat && responseData.vidhanSeat) {
            setVidhanSeat(responseData.vidhanSeat)
            window.localStorage.setItem(
              seatStorageKey,
              responseData.vidhanSeat.toString()
            )
          }
        }
      } catch (error) {
        console.error(
          "[usePrefillDistrictsAndSeat] survey response api failed",
          {
            campaignId,
            url: surveyResponseUrl,
            error,
          }
        )
        return
      } finally {
        setCanRunPreferencesFallback(true)
        console.log(
          "[usePrefillDistrictsAndSeat] preferences fallback is now allowed"
        )
      }
    }

    void loadUserResponse()

    return () => {
      cancelled = true
    }
  }, [
    campaignId,
    districtStorageKey,
    getAppUserData,
    methodExists,
    seatStorageKey,
    setDistrict,
    setVidhanSeat,
    surveyResponseUrl,
  ])

  useEffect(() => {
    let isCancelled = false

    const autoSelectDistrictFromUserPreferences = async () => {
      if (
        !canRunPreferencesFallback ||
        hasAutoSelectedDistrictRef.current ||
        window.localStorage.getItem(districtStorageKey)
      ) {
        console.log(
          "[usePrefillDistrictsAndSeat] skipping preferences fallback",
          {
            canRunPreferencesFallback,
            hasAutoSelectedDistrict: hasAutoSelectedDistrictRef.current,
            hasStoredDistrict: Boolean(
              window.localStorage.getItem(districtStorageKey)
            ),
          }
        )
        return
      }

      const canReadPreferences = methodExists(["getUserSelectedPreferences"]).or
      const canReadAppUserData = methodExists([
        "getAppUserData",
        "getAppUserDataV2",
      ]).or

      if (!canReadPreferences || !canReadAppUserData) {
        console.log(
          "[usePrefillDistrictsAndSeat] skipping preferences cities api: required bridge methods unavailable",
          {
            canReadPreferences,
            canReadAppUserData,
          }
        )
        return
      }

      try {
        const preferences = await getUserSelectedPreferences()
        const preferredStates = Array.isArray(preferences?.states)
          ? preferences.states
          : []
        const preferredCities = Array.isArray(preferences?.cities)
          ? preferences.cities
          : []

        console.log(
          "[usePrefillDistrictsAndSeat] bridge preferences received",
          {
            preferredStates,
            preferredCities,
          }
        )

        if (preferredStates.length === 0 || preferredCities.length === 0) {
          console.log(
            "[usePrefillDistrictsAndSeat] skipping preferences cities api: no preferred states or cities"
          )
          return
        }

        const appUserData = (await getAppUserData()) as AppUserData
        const url = new URL(userPreferenceCitiesUrl)

        url.searchParams.set("stateIds", preferredStates.join(","))

        const headers = {
          at: appUserData.auth_token,
          "x-aut-t": "a6oaq3edtz59",
          "a-ver-code": "600",
          cid: "521",
          dtyp: "web",
          "content-type": "application/json",
        }

        console.log(
          "[usePrefillDistrictsAndSeat] preferences cities api request",
          {
            url: url.toString(),
            headers,
            preferredStates,
          }
        )
        console.log(
          `[usePrefillDistrictsAndSeat] API CALL STARTED: ${url.toString()}`
        )

        const response = await fetch(url.toString(), {
          method: "GET",
          headers,
          credentials: "include",
        })

        console.log(
          `[usePrefillDistrictsAndSeat] API CALL COMPLETED: ${url.toString()}`
        )
        console.log(
          "[usePrefillDistrictsAndSeat] preferences cities api status",
          {
            url: url.toString(),
            status: response.status,
            ok: response.ok,
          }
        )

        if (!response.ok) {
          throw new Error(
            `Invalid preferences cities response: ${response.status}`
          )
        }

        const prefsCitiesJson = (await response.json()) as {
          cities?: UserPreferenceCity[]
        }
        const apiCities = Array.isArray(prefsCitiesJson?.cities)
          ? prefsCitiesJson.cities
          : []

        console.log(
          "[usePrefillDistrictsAndSeat] preferences cities api body",
          {
            apiCities,
          }
        )

        if (apiCities.length === 0) {
          console.log(
            "[usePrefillDistrictsAndSeat] no cities returned from preferences cities api"
          )
          return
        }

        const matchedPreferredCity = apiCities.find((city) =>
          preferredCities.includes(Number(city.id))
        )

        if (!matchedPreferredCity?.listingUrl) {
          console.log(
            "[usePrefillDistrictsAndSeat] could not match preferred city from api cities response",
            {
              preferredCities,
              apiCities,
              matchedPreferredCity,
            }
          )
          return
        }

        const cityLevelListingUrl = getCityLevelListingUrl(
          matchedPreferredCity.listingUrl
        )
        const cityLevelObject = apiCities.find(
          (city) =>
            getCityLevelListingUrl(city.listingUrl) === cityLevelListingUrl
        )
        const cityEngName = cityLevelObject?.engName

        if (!cityEngName) {
          console.log(
            "[usePrefillDistrictsAndSeat] could not resolve city english name from preferences cities api response",
            {
              matchedPreferredCity,
              cityLevelObject,
            }
          )
          return
        }

        const normalizedCityName = normalizeText(cityEngName)
        const matchedDistrict = districts.find((district) => {
          const districtName =
            district.district_english_name || district.district_name || ""
          const normalizedDistrictName = normalizeText(districtName)

          return (
            normalizedDistrictName === normalizedCityName ||
            normalizedDistrictName.includes(normalizedCityName) ||
            normalizedCityName.includes(normalizedDistrictName)
          )
        })

        if (!matchedDistrict || isCancelled) {
          console.log(
            "[usePrefillDistrictsAndSeat] could not auto-select district from preferences",
            {
              cityEngName,
              matchedDistrict,
              isCancelled,
            }
          )
          return
        }

        hasAutoSelectedDistrictRef.current = true
        setDistrict(matchedDistrict.id)
        window.localStorage.setItem(
          districtStorageKey,
          matchedDistrict.id.toString()
        )

        console.log("[usePrefillDistrictsAndSeat] auto-selected district", {
          cityEngName,
          matchedDistrictId: matchedDistrict.id,
          matchedDistrictName: matchedDistrict.district_name,
        })
      } catch (error) {
        console.error(
          "[usePrefillDistrictsAndSeat] preferences fallback failed",
          error
        )
      }
    }

    void autoSelectDistrictFromUserPreferences()

    return () => {
      isCancelled = true
    }
  }, [
    canRunPreferencesFallback,
    districtStorageKey,
    districts,
    getAppUserData,
    getUserSelectedPreferences,
    methodExists,
    setDistrict,
    userPreferenceCitiesUrl,
  ])

  return { userResponse, districtStorageKey, seatStorageKey }
}
