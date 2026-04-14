"use client"

import { useEffect, useRef, useState } from "react"

import { useWebviewContext } from "@/bridge"

import { fetchSurveyAttemptResponse, fetchUserPreferenceCities } from "./api"
import type { District, UserResponse } from "./types"

type UsePrefillDistrictsAndSeatArgs = {
  campaignId: string
  districts: District[]
  setDistrict: (districtId: number | null) => void
  setVidhanSeat: (seatId: number | null) => void
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

  useEffect(() => {
    const storedDistrict = window.localStorage.getItem(districtStorageKey)
    const storedSeat = window.localStorage.getItem(seatStorageKey)
    const parsedDistrict = storedDistrict ? Number(storedDistrict) : null
    const parsedSeat = storedSeat ? Number(storedSeat) : null

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
  }, [districtStorageKey, seatStorageKey, setDistrict, setVidhanSeat])

  useEffect(() => {
    let cancelled = false

    const loadUserResponse = async () => {
      const hasLocalDistrict = Boolean(
        window.localStorage.getItem(districtStorageKey)
      )
      const hasLocalSeat = Boolean(window.localStorage.getItem(seatStorageKey))
      const canReadAppUserData = methodExists(["getAppUserData"]).or

      if (hasLocalDistrict && hasLocalSeat) {
        setCanRunPreferencesFallback(true)
        return
      }

      if (!canReadAppUserData) {
        setCanRunPreferencesFallback(true)
        return
      }

      try {
        const userData = await getAppUserData()
        const endpoint = new URL(
          `/api/1.0/web-backend/survey/vidhan/${campaignId}/response`,
          "https://prod.bhaskarapi.com"
        ).toString()

        console.log({
          event: "Survey User Response API Request",
          properties: {
            campaignId,
            endpoint,
            headers: {
              at: userData.auth_token,
              "x-aut-t": "a6oaq3edtz59",
              "a-ver-code": "600",
              deviceid: userData.user?.unique_id ?? "",
              msisdn: userData.user?.phone_number ?? "",
              cid: "521",
              "x-aut-web-t": "420x66695ztde3qao6a69",
              dtyp: "web",
            },
          },
        })

        const json = (await fetchSurveyAttemptResponse(
          campaignId,
          userData
        )) as UserResponse

        console.log({
          event: "Survey User Response API Response",
          properties: {
            campaignId,
            status: 200,
            data: json,
          },
        })

        if (cancelled) {
          return
        }

        setUserResponse(json)

        if (json.hasAttempted) {
          if (!hasLocalDistrict && json.response?.district) {
            setDistrict(json.response.district)
            window.localStorage.setItem(
              districtStorageKey,
              json.response.district.toString()
            )
          }

          if (!hasLocalSeat && json.response?.vidhanSeat) {
            setVidhanSeat(json.response.vidhanSeat)
            window.localStorage.setItem(
              seatStorageKey,
              json.response.vidhanSeat.toString()
            )
          }
        }
      } catch {
        return
      } finally {
        setCanRunPreferencesFallback(true)
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
  ])

  useEffect(() => {
    let isCancelled = false

    const autoSelectDistrictFromUserPreferences = async () => {
      if (
        !canRunPreferencesFallback ||
        hasAutoSelectedDistrictRef.current ||
        window.localStorage.getItem(districtStorageKey)
      ) {
        return
      }

      const canReadPreferences = methodExists(["getUserSelectedPreferences"]).or
      const canReadAppUserData = methodExists(["getAppUserData"]).or

      if (!canReadPreferences || !canReadAppUserData) {
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

        if (preferredStates.length === 0 || preferredCities.length === 0) {
          return
        }

        const appUserData = await getAppUserData()
        const prefsCitiesJson = await fetchUserPreferenceCities(
          preferredStates,
          appUserData
        )
        const apiCities = Array.isArray(prefsCitiesJson?.cities)
          ? prefsCitiesJson.cities
          : []

        if (apiCities.length === 0) {
          return
        }

        const matchedPreferredCity = apiCities.find((city) =>
          preferredCities.includes(Number(city.id))
        )

        if (!matchedPreferredCity?.listingUrl) {
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
          return
        }

        hasAutoSelectedDistrictRef.current = true
        setDistrict(matchedDistrict.id)
        window.localStorage.setItem(
          districtStorageKey,
          matchedDistrict.id.toString()
        )
      } catch (error) {
        console.error(error)
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
  ])

  return { userResponse, districtStorageKey, seatStorageKey }
}
