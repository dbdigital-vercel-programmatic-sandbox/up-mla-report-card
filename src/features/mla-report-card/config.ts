const STAGING_API_BASE_URL = "https://staging.bhaskarapi.com"
const PROD_API_BASE_URL = "https://prod.bhaskarapi.com"

export const X_AUT_T = "a6oaq3edtz59"

export const MLA_SURVEY_API_BASE_URL =
  process.env.NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT === "POS"
    ? PROD_API_BASE_URL
    : PROD_API_BASE_URL