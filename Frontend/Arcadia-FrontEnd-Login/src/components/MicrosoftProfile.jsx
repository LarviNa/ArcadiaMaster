import { useEffect, useState } from 'react'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../auth/loginRequest'

export function MicrosoftProfile() {
  const { instance, accounts } = useMsal()
  const account = accounts[0]
  const [tokens, setTokens] = useState(null)
  const [error, setError] = useState(null)
  const [showTokens, setShowTokens] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'
  const clientesUrl = import.meta.env.VITE_CLIENTES_URL || 'http://localhost:3001'
  const redirectUri =
    import.meta.env.VITE_REDIRECT_URI ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')

  useEffect(() => {
    if (!account) return

    let cancelled = false

    async function loadTokens() {
      try {
        const result = await instance.acquireTokenSilent({
          ...loginRequest,
          account,
        })

        if (!cancelled) {
          setTokens({
            idToken: result.idToken,
            accessToken: result.accessToken,
          })
          setError(null)

          // Sincronizar automáticamente la sesión con localStorage para Arcadia
          const roles = account.idTokenClaims?.roles || []
          const hasAdminRole = roles.includes('Admin') || roles.includes('admin')
          const defaultRole = hasAdminRole ? 'Admin' : 'Cliente'

          const userObj = {
            id: account.localAccountId || account.homeAccountId || 'msal-user',
            nombre: account.name || account.username,
            email: account.username,
            rol: defaultRole,
            tid: account.idTokenClaims?.tid,
          }

          localStorage.setItem('token', result.idToken)
          localStorage.setItem('user', JSON.stringify(userObj))

          // Si el usuario eligió un destino antes de iniciar sesión, verificar auto-redirección
          const pendingTarget = sessionStorage.getItem('arcadia_msal_target')
          if (pendingTarget) {
            sessionStorage.removeItem('arcadia_msal_target')
            handleNavigate(pendingTarget, result.idToken, userObj)
          }
        }
      } catch (err) {
        if (cancelled) return

        if (err instanceof InteractionRequiredAuthError) {
          setError('Se requiere interacción adicional. Por favor cierra sesión e inicia nuevamente.')
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron obtener los tokens de Microsoft Entra ID.'
        )
      }
    }

    void loadTokens()

    return () => {
      cancelled = true
    }
  }, [account, instance])

  const handleNavigate = (target, customToken = null, customUser = null) => {
    setRedirecting(true)
    const activeToken = customToken || tokens?.idToken || localStorage.getItem('token') || 'msal-token'
    
    let activeUser = customUser
    if (!activeUser) {
      try {
        activeUser = JSON.parse(localStorage.getItem('user')) || {}
      } catch {
        activeUser = {}
      }
    }

    // Si entra al admin, asegurar que rol sea Admin
    const roleForDestination = target === 'admin' ? 'Admin' : (activeUser.rol || 'Cliente')
    const finalUser = {
      ...activeUser,
      id: activeUser.id || account?.localAccountId || 'msal-user',
      nombre: activeUser.nombre || account?.name || account?.username,
      email: activeUser.email || account?.username,
      rol: roleForDestination
    }

    localStorage.setItem('user', JSON.stringify(finalUser))
    const userParam = encodeURIComponent(JSON.stringify(finalUser))

    setTimeout(() => {
      if (target === 'admin') {
        window.location.href = `${adminUrl}/?token=${activeToken}&user=${userParam}`
      } else {
        window.location.href = `${clientesUrl}/?token=${activeToken}&user=${userParam}`
      }
    }, 600)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('arcadia_msal_target')
    instance.logoutRedirect({
      postLogoutRedirectUri: redirectUri,
    })
  }

  if (!account) return null

  const tid = account.idTokenClaims?.tid

  return (
    <div className="msal-profile-card">
      <div className="msal-profile-header">
        <div className="msal-avatar">
          {(account.name ? account.name.charAt(0) : account.username.charAt(0)).toUpperCase()}
        </div>
        <div className="msal-user-info">
          <h3>{account.name ?? 'Usuario Microsoft'}</h3>
          <p className="msal-email">{account.username}</p>
          <span className="msal-badge">Microsoft Entra ID</span>
        </div>
      </div>

      <div className="msal-tenant-info">
        <span className="info-label">Tenant ID (tid):</span>
        <code className="info-code">{typeof tid === 'string' ? tid : '—'}</code>
      </div>

      {error && <div className="error-message">{error}</div>}

      {redirecting ? (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <span className="loader"></span>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Redirigiendo...</p>
        </div>
      ) : (
        <div className="msal-actions">
          <p className="msal-actions-title">¿A dónde deseas ingresar?</p>
          <button
            type="button"
            className="btn-primary msal-nav-btn"
            onClick={() => handleNavigate('clientes')}
          >
            🛒 Ir a la Tienda de Comics
          </button>

          <button
            type="button"
            className="btn-primary msal-nav-btn admin-btn"
            onClick={() => handleNavigate('admin')}
          >
            ⚙️ Ir al Panel de Administración
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowTokens(!showTokens)}
              style={{ flex: 1 }}
            >
              {showTokens ? 'Ocultar Tokens' : 'Ver Tokens (JWT)'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleLogout}
              style={{ flex: 1, color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {showTokens && tokens && (
        <div className="msal-tokens-inspector">
          <h4>ID Token (Identidad · carnet):</h4>
          <pre className="token-box">{tokens.idToken}</pre>

          <h4>Access Token (Pase para API):</h4>
          <pre className="token-box">{tokens.accessToken}</pre>
        </div>
      )}
    </div>
  )
}
