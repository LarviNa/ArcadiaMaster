import { BrowserCacheLocation, LogLevel } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_CLIENT_ID ?? ''
const tenantId = import.meta.env.VITE_TENANT_ID ?? ''
const redirectUri =
  typeof window !== 'undefined'
    ? (window.location.port === '5173'
        ? window.location.origin
        : (import.meta.env.VITE_REDIRECT_URI || `${window.location.origin}/login/`))
    : (import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173')

/** true si hay IDs reales (no vacíos ni placeholders REEMPLAZAR_). */
export const isAuthConfigured =
  Boolean(clientId) &&
  Boolean(tenantId) &&
  !clientId.startsWith('REEMPLAZAR') &&
  !tenantId.startsWith('REEMPLAZAR')

/** Authority Entra ID (workforce): login.microsoftonline.com/{tenantId}. */
export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
    },
  },
}
