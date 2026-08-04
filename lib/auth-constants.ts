/** Session idle / cookie lifetime (1 hour). Shared by server auth and client idle timer. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60;

/** How often an active client may re-issue the session cookie. */
export const SESSION_REFRESH_INTERVAL_SECONDS = 5 * 60;
