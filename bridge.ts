"use client"

/*
Previous implementation kept for easy reversal.

type NativeBridgePayload = Record<string, unknown>

type LegacyAppUserData = {
  db_id?: string
  app_version?: string
  app_version_code?: string
  app_platform?: string
  auth_token: string
  user?: {
    unique_id?: string
    is_signed_in?: boolean
    phone_number?: string
    user_name?: string
    photo_url?: string
  }
}

type UserSelectedPreferences = {
  categories: number[]
  states: number[]
  cities: number[]
}

type LegacyMethodCheck = {
  or: boolean
  and: boolean
}

function getNativeClients() {
  if (typeof window === "undefined") {
    return {
      android: undefined,
      ios: undefined,
    }
  }

  return {
    android: (
      window as typeof window & { AndroidInterface?: Record<string, unknown> }
    ).AndroidInterface,
    ios: (
      window as typeof window & {
        webkit?: {
          messageHandlers?: Record<
            string,
            { postMessage?: (value: unknown) => void }
          >
        }
      }
    ).webkit?.messageHandlers,
  }
}

function getUniqueCallbackMethod(callback: (res: unknown) => void) {
  if (typeof window === "undefined") {
    return ""
  }

  const functionName = `fn${Math.floor(Math.random() * 10000000000)}`
  ;(window as typeof window & Record<string, unknown>)[functionName] = callback
  return functionName
}

function callNativeMethod(method: string, payload?: unknown) {
  const { android, ios } = getNativeClients()
  const androidMethod = android?.[method]
  const iosMethod = ios?.[method]

  if (typeof androidMethod === "function") {
    return payload === undefined
      ? (androidMethod as () => unknown)()
      : (androidMethod as (value: unknown) => unknown)(
          typeof payload === "string" ? payload : JSON.stringify(payload)
        )
  }

  if (iosMethod?.postMessage) {
    iosMethod.postMessage(payload ?? "")
  }

  return undefined
}

export const bridge = {
  get isWebview() {
    const { android, ios } = getNativeClients()
    return Boolean(android || ios?.openFullWeb)
  },

  methodExists(methods: string[]): LegacyMethodCheck {
    const { android, ios } = getNativeClients()
    const checks = methods.map(
      (method) =>
        typeof android?.[method] === "function" ||
        Boolean(ios?.[method]?.postMessage)
    )

    return {
      or: checks.some(Boolean),
      and: checks.every(Boolean),
    }
  },

  closeScreen() {
    const { android, ios } = getNativeClients()

    if (typeof android?.closeScreenV2 === "function") {
      android.closeScreenV2()
      return
    }

    if (typeof android?.closeScreen === "function") {
      android.closeScreen()
      return
    }

    if (ios?.closeScreenV2?.postMessage) {
      ios.closeScreenV2.postMessage("")
      return
    }

    ios?.closeScreen?.postMessage?.("")
  },

  getAppUserData() {
    const { android, ios } = getNativeClients()

    return new Promise<LegacyAppUserData>((resolve, reject) => {
      try {
        if (typeof android?.getAppUserDataV2 === "function") {
          resolve(
            JSON.parse(
              android.getAppUserDataV2() as string
            ) as LegacyAppUserData
          )
          return
        }

        if (typeof android?.getAppUserData === "function") {
          resolve(android.getAppUserData() as LegacyAppUserData)
          return
        }

        const callback = getUniqueCallbackMethod((res) => {
          resolve((res ?? { auth_token: "" }) as LegacyAppUserData)
        })

        if (ios?.getAppUserDataV2?.postMessage) {
          ios.getAppUserDataV2.postMessage({ callback })
          return
        }

        if (ios?.getAppUserData?.postMessage) {
          ios.getAppUserData.postMessage({ callback })
          return
        }

        resolve({ auth_token: "" })
      } catch (error) {
        reject(error)
      }
    })
  },

  getUserSelectedPreferences() {
    const { android, ios } = getNativeClients()

    return new Promise<UserSelectedPreferences>((resolve, reject) => {
      try {
        if (typeof android?.getUserSelectedPreferences === "function") {
          const response = android.getUserSelectedPreferences()
          if (typeof response === "string") {
            resolve(JSON.parse(response) as UserSelectedPreferences)
            return
          }

          resolve(
            (response ?? {
              categories: [],
              states: [],
              cities: [],
            }) as UserSelectedPreferences
          )
          return
        }

        const callback = getUniqueCallbackMethod((res) => {
          resolve(
            (res ?? {
              categories: [],
              states: [],
              cities: [],
            }) as UserSelectedPreferences
          )
        })

        if (ios?.getUserSelectedPreferences?.postMessage) {
          ios.getUserSelectedPreferences.postMessage({ callback })
          return
        }

        resolve({
          categories: [],
          states: [],
          cities: [],
        })
      } catch (error) {
        reject(error)
      }
    })
  },

  trackMixpanelEvent(payload: NativeBridgePayload) {
    callNativeMethod("trackMixpanelEvent", payload)
  },

  trackInteractivePage(payload: NativeBridgePayload) {
    callNativeMethod("trackInteractivePage", payload)
  },

  shareArticle(
    deeplink: string,
    shareText: string,
    imageUrl: string,
    contentType: string,
    shareTextAndLink?: string
  ) {
    const combinedShareText = shareTextAndLink ?? `${shareText}${deeplink}`
    const { android, ios } = getNativeClients()

    if (typeof android?.shareArticle === "function") {
      android.shareArticle(
        deeplink,
        shareText,
        imageUrl,
        contentType,
        combinedShareText
      )
      return
    }

    if (typeof android?.shareArticleV2 === "function") {
      android.shareArticleV2(
        JSON.stringify({
          imageUrl: imageUrl || undefined,
          overrideTemplate: combinedShareText,
        })
      )
      return
    }

    if (ios?.shareArticle?.postMessage) {
      ios.shareArticle.postMessage({
        deeplink,
        shareText,
        imageUrl,
        contentType,
        shareTextAndLink: combinedShareText,
      })
      return
    }

    if (ios?.shareArticleV2?.postMessage) {
      ios.shareArticleV2.postMessage({
        imageUrl: imageUrl || undefined,
        overrideTemplate: combinedShareText,
      })
      return
    }

    navigator.share?.({ text: combinedShareText })
  },
}
*/

type NativeBridgePayload = Record<string, unknown>

type AppUserData = {
  db_id?: string
  app_version?: string
  app_version_code?: string
  app_platform?: string
  auth_token: string
  user?: {
    unique_id?: string
    is_signed_in?: boolean
    phone_number?: string
    user_name?: string
    photo_url?: string
  }
}

type UserSelectedPreferences = {
  categories: number[]
  states: number[]
  cities: number[]
}

type MethodCheck = {
  rawData: unknown[]
  or: boolean
  and: boolean
}

type AvailableMethods =
  | "closeScreenV2"
  | "closeScreen"
  | "shareArticleV2"
  | "shareArticle"
  | "getAppUserData"
  | "getAppUserDataV2"
  | "getUserSelectedPreferences"
  | "trackMixpanelEvent"
  | "trackInteractivePage"
  | "openFullWeb"

type AndroidBridge = Partial<Record<AvailableMethods, unknown>>
type IOSBridge = Partial<
  Record<AvailableMethods, { postMessage?: (value: unknown) => void }>
>

const android =
  typeof window === "undefined"
    ? undefined
    : ((window as typeof window & { AndroidInterface?: AndroidBridge })
        .AndroidInterface ?? undefined)

const ios =
  typeof window === "undefined"
    ? undefined
    : ((
        window as typeof window & {
          webkit?: { messageHandlers?: IOSBridge }
        }
      ).webkit?.messageHandlers ?? undefined)

const isWebview = Boolean(android || ios?.openFullWeb)
const isAndroidClient = Boolean(android)
const isIOSClient = Boolean(ios?.openFullWeb)

function getUniqueCallbackMethod(callback: (res: unknown) => void): string {
  if (typeof window === "undefined") {
    return ""
  }

  const functionName = `fn${Math.floor(Math.random() * 10000000000)}`
  ;(window as typeof window & Record<string, unknown>)[functionName] = callback

  return functionName
}

function methodExists(methods: AvailableMethods[]): MethodCheck {
  if (!android && !ios) {
    return {
      rawData: [],
      and: false,
      or: false,
    }
  }

  const rawData = methods.map((method) => {
    if (typeof android?.[method] === "function") {
      return android[method]
    }

    if (ios?.[method]?.postMessage) {
      return ios[method]
    }

    return undefined
  })

  return {
    rawData,
    and: rawData.every(Boolean),
    or: rawData.some(Boolean),
  }
}

function closeScreen() {
  if (isAndroidClient) {
    if (typeof android?.closeScreenV2 === "function") {
      android.closeScreenV2()
      return
    }

    if (typeof android?.closeScreen === "function") {
      android.closeScreen()
    }

    return
  }

  if (ios?.closeScreenV2?.postMessage) {
    ios.closeScreenV2.postMessage("")
    return
  }

  ios?.closeScreen?.postMessage?.("")
}

function getAppUserData(): Promise<AppUserData> {
  return new Promise((resolve) => {
    if (isAndroidClient) {
      if (typeof android?.getAppUserDataV2 === "function") {
        resolve(JSON.parse(android.getAppUserDataV2() as string) as AppUserData)
        return
      }

      if (typeof android?.getAppUserData === "function") {
        resolve(android.getAppUserData() as AppUserData)
        return
      }

      resolve({ auth_token: "" })
      return
    }

    const callback = getUniqueCallbackMethod((res) => {
      resolve((res ?? { auth_token: "" }) as AppUserData)
    })

    if (ios?.getAppUserDataV2?.postMessage) {
      ios.getAppUserDataV2.postMessage({ callback })
      return
    }

    if (ios?.getAppUserData?.postMessage) {
      ios.getAppUserData.postMessage({ callback })
      return
    }

    resolve({ auth_token: "" })
  })
}

function getUserSelectedPreferences(): Promise<UserSelectedPreferences> {
  return new Promise((resolve) => {
    if (isAndroidClient) {
      if (typeof android?.getUserSelectedPreferences === "function") {
        const response = android.getUserSelectedPreferences()
        resolve(
          typeof response === "string"
            ? (JSON.parse(response) as UserSelectedPreferences)
            : ((response ?? {
                categories: [],
                states: [],
                cities: [],
              }) as UserSelectedPreferences)
        )
        return
      }

      resolve({ categories: [], states: [], cities: [] })
      return
    }

    const callback = getUniqueCallbackMethod((res) => {
      resolve(
        (res ?? {
          categories: [],
          states: [],
          cities: [],
        }) as UserSelectedPreferences
      )
    })

    if (ios?.getUserSelectedPreferences?.postMessage) {
      ios.getUserSelectedPreferences.postMessage({ callback })
      return
    }

    resolve({ categories: [], states: [], cities: [] })
  })
}

function trackMixpanelEvent(payload: NativeBridgePayload) {
  const event = {
    ...payload,
    properties: {
      Platform: "Web",
      ...((payload.properties as Record<string, unknown> | undefined) ?? {}),
    },
  }

  try {
    if (isAndroidClient) {
      if (typeof android?.trackMixpanelEvent === "function") {
        android.trackMixpanelEvent(JSON.stringify(event))
      }
      return
    }

    if (ios?.trackMixpanelEvent?.postMessage) {
      ios.trackMixpanelEvent.postMessage(event)
    }
  } catch (error) {
    console.error(error)
  }
}

function trackInteractivePage(payload: NativeBridgePayload) {
  try {
    if (isAndroidClient) {
      if (typeof android?.trackInteractivePage === "function") {
        android.trackInteractivePage(JSON.stringify(payload))
      }
      return
    }

    if (ios?.trackInteractivePage?.postMessage) {
      ios.trackInteractivePage.postMessage(payload)
    }
  } catch (error) {
    console.error(error)
  }
}

function shareArticle(
  storyUrl: string,
  title: string,
  imageUrl: string,
  categoryName: string,
  overrideTemplate?: string
) {
  if (isAndroidClient) {
    if (typeof android?.shareArticleV2 === "function") {
      android.shareArticleV2(
        JSON.stringify({
          storyUrl,
          title,
          imageUrl,
          categoryName,
          overrideTemplate,
        })
      )
      return
    }

    if (typeof android?.shareArticle === "function") {
      android.shareArticle(storyUrl, title, imageUrl)
    }

    return
  }

  if (ios?.shareArticleV2?.postMessage) {
    ios.shareArticleV2.postMessage({
      storyUrl,
      title,
      imageUrl,
      categoryName,
      overrideTemplate,
    })
    return
  }

  if (ios?.shareArticle?.postMessage) {
    ios.shareArticle.postMessage({ storyUrl, title, imageUrl })
    return
  }

  navigator.share?.({ text: overrideTemplate ?? `${title}${storyUrl}` })
}

export {
  WebviewProvider,
  useIsUserSignedIn,
  useIsWebview,
  usePullToRefreshDisabler,
  useWebviewContext,
} from "@/lib/internal/bridge"

export const bridge = {
  closeScreen,
  getAppUserData,
  getUserSelectedPreferences,
  trackMixpanelEvent,
  trackInteractivePage,
  shareArticle,
  isWebview,
  isAndroidClient,
  isIOSClient,
  methodExists,
}
