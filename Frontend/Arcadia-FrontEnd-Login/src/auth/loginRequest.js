const clientId = import.meta.env.VITE_CLIENT_ID || '55611909-8d64-41ee-90b6-2a89b026fd4e'
const apiScope = `api://${clientId}/access_as_user`

/** OIDC + scope delegado hacia la API de Arcadia. */
export const loginRequest = {
  scopes: ['openid', 'profile', apiScope],
}
