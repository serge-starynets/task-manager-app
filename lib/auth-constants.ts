/** Session idle / cookie lifetime (1 hour). Shared by server auth and client idle timer. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60;

/** How often an active client may re-issue the session cookie. */
export const SESSION_REFRESH_INTERVAL_SECONDS = 5 * 60;

/** Mobile API access token lifetime (15 minutes). */
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;

/** Mobile API refresh token lifetime (7 days). */
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
