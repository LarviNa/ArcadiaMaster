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
  const [userRole, setUserRole] = useState('Cliente')
  const [syncingBackend, setSyncingBackend] = useState(true)
  const [apiTestResult, setApiTestResult] = useState(null)
  const [testingApi, setTestingApi] = useState(false)

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
        setSyncingBackend(true)
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

          // 1. Determinar rol inicial desde claims de Azure Entra ID (App Roles)
          const roles = account.idTokenClaims?.roles || []
          const hasAdminRole = roles.some(
            (r) => typeof r === 'string' && (r.toLowerCase() === 'admin' || r.toLowerCase() === 'administrador' || r.toLowerCase() === 'profesor')
          )
          let detectedRole = hasAdminRole ? 'Admin' : 'Cliente'

          let userObj = {
            id: account.localAccountId || account.homeAccountId || 'msal-user',
            nombre: account.name || account.username,
            email: account.username,
            rol: detectedRole,
            proveedor: 'MICROSOFT',
            esMicrosoft: true,
            tid: account.idTokenClaims?.tid,
          }

          let finalToken = result.idToken

          // 2. Sincronizar y verificar rol contra el backend de Arcadia (ms-usuarios)
          try {
            const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'https://yrs29frx6c.execute-api.us-east-1.amazonaws.com'
            const response = await fetch(`${gatewayUrl}/api/usuarios/azure-login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: result.idToken }),
            })
            if (response.ok) {
              const data = await response.json()
              if (data.token) {
                finalToken = data.token
              }
              if (data.userId) {
                userObj.id = data.userId
              }
              if (data.rol) {
                userObj.rol = data.rol
                detectedRole = data.rol
              }
              if (data.nombre) {
                userObj.nombre = data.nombre
              }
            }
          } catch (e) {
            console.warn('Backend no disponible para sync de Azure, usando datos directos de token:', e)
          }

          setUserRole(detectedRole)
          setSyncingBackend(false)
          localStorage.setItem('token', finalToken)
          localStorage.setItem('user', JSON.stringify(userObj))

          // 3. Si el usuario había seleccionado un destino antes de iniciar sesión:
          const pendingTarget = sessionStorage.getItem('arcadia_msal_target')
          if (pendingTarget) {
            sessionStorage.removeItem('arcadia_msal_target')
            if (pendingTarget === 'admin') {
              if (detectedRole?.toLowerCase() === 'admin') {
                handleNavigate('admin', finalToken, userObj)
              } else {
                setError(
                  `Acceso restringido: Tu cuenta Microsoft (${account.username}) tiene rol '${detectedRole}'. Solo usuarios con rol 'Admin' pueden ingresar al Panel de Administración.`
                )
              }
            } else {
              handleNavigate('clientes', finalToken, userObj)
            }
          }
        }
      } catch (err) {
        if (cancelled) return
        setSyncingBackend(false)

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

  const handleTestApis = async () => {
    setTestingApi(true)
    setApiTestResult(null)
    const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'https://yrs29frx6c.execute-api.us-east-1.amazonaws.com'
    try {
      // 1. Probar endpoint público /public/hola
      const resPub = await fetch(`${gatewayUrl}/public/hola`)
      const dataPub = await resPub.json().catch(() => ({ status: resPub.status }))

      // 2. Probar endpoint privado /api/me con Access Token
      const token = tokens?.accessToken || localStorage.getItem('token')
      const resPriv = await fetch(`${gatewayUrl}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const dataPriv = await resPriv.json().catch(() => ({ status: resPriv.status }))

      setApiTestResult({
        publicStatus: resPub.status,
        publicData: dataPub,
        privateStatus: resPriv.status,
        privateData: dataPriv,
      })
    } catch (e) {
      setApiTestResult({ error: e.message })
    } finally {
      setTestingApi(false)
    }
  }

  const handleNavigate = (target, customToken = null, customUser = null) => {
    setError(null)
    const activeToken = customToken || tokens?.idToken || localStorage.getItem('token') || 'msal-token'

    let activeUser = customUser
    if (!activeUser) {
      try {
        activeUser = JSON.parse(localStorage.getItem('user')) || {}
      } catch {
        activeUser = {}
      }
    }

    const effectiveRole = activeUser.rol || userRole || 'Cliente'

    // Verificación estricta por roles: solo Admin puede navegar al Panel de Administración
    if (target === 'admin' && effectiveRole.toLowerCase() !== 'admin') {
      setError(
        `Acceso no autorizado: Tu cuenta Microsoft (${account?.username || 'usuario'}) tiene rol '${effectiveRole}'. Se requiere rol de Administrador para acceder al panel.`
      )
      return
    }

    setRedirecting(true)
    const finalUser = {
      ...activeUser,
      id: activeUser.id || account?.localAccountId || 'msal-user',
      nombre: activeUser.nombre || account?.name || account?.username,
      email: activeUser.email || account?.username,
      rol: effectiveRole,
      proveedor: 'MICROSOFT',
      esMicrosoft: true,
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
  const isAdmin = userRole?.toLowerCase() === 'admin'

  return (
    <div className="msal-profile-card">
      <div className="msal-profile-header">
        <div className="msal-avatar">
          {(account.name ? account.name.charAt(0) : account.username.charAt(0)).toUpperCase()}
        </div>
        <div className="msal-user-info">
          <h3>{account.name ?? 'Usuario Microsoft'}</h3>
          <p className="msal-email">{account.username}</p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
            <span className="msal-badge">Microsoft Entra ID</span>
            {isAdmin ? (
              <span className="msal-badge msal-badge-admin">👑 Rol: Admin</span>
            ) : (
              <span className="msal-badge msal-badge-cliente">👤 Rol: Cliente</span>
            )}
          </div>
        </div>
      </div>

      <div className="msal-role-card">
        <span className="role-title">Verificación de Rol:</span>
        <span className="role-val">
          {syncingBackend ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sincronizando con Arcadia...</span>
          ) : isAdmin ? (
            <span style={{ color: '#c084fc' }}>👑 Administrador Autorizado</span>
          ) : (
            <span style={{ color: '#34d399' }}>👤 Cliente (Compras y Catálogo)</span>
          )}
        </span>
      </div>

      <div className="msal-tenant-info">
        <span className="info-label">Tenant ID (tid):</span>
        <code className="info-code">{typeof tid === 'string' ? tid : '—'}</code>
      </div>

      {error && <div className="error-message">{error}</div>}

      {redirecting ? (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <span className="loader"></span>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Redirigiendo de forma segura...</p>
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
            className={`btn-primary msal-nav-btn admin-btn ${!isAdmin ? 'btn-disabled' : ''}`}
            onClick={() => handleNavigate('admin')}
            title={!isAdmin ? 'Requiere rol Administrador en Microsoft Entra ID o base de datos' : 'Ingresar al panel de control'}
          >
            {isAdmin ? '⚙️ Ir al Panel de Administración' : '🔒 Panel de Administración (Solo Admin)'}
          </button>

          {!isAdmin && (
            <div className="msal-role-warning">
              ℹ️ <strong>Nota de Seguridad:</strong> Tu cuenta Microsoft está registrada como <strong>Cliente</strong>. Si necesitas acceso de Administrador, un administrador de Arcadia puede elevar tus permisos en el panel o asignarte el rol en Azure Portal.
            </div>
          )}

          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handleTestApis}
              disabled={testingApi}
              style={{ width: '100%', background: '#2563eb' }}
            >
              {testingApi ? 'Probando Backend...' : '🧪 Probar API pública (/public/hola) y privada (/api/me)'}
            </button>
          </div>

          {apiTestResult && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#1e293b', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#38bdf8' }}>Resultados de la prueba de API:</div>
              {apiTestResult.error ? (
                <div style={{ color: '#ef4444' }}>❌ Error al conectar con Backend: {apiTestResult.error}</div>
              ) : (
                <>
                  <div style={{ marginBottom: '0.4rem' }}>
                    <span style={{ color: apiTestResult.publicStatus === 200 ? '#4ade80' : '#f87171' }}>
                      {apiTestResult.publicStatus === 200 ? '✅' : '❌'} GET /public/hola ({apiTestResult.publicStatus}):
                    </span>
                    <pre style={{ margin: '4px 0', padding: '4px', background: '#0f172a', borderRadius: '4px' }}>
                      {JSON.stringify(apiTestResult.publicData, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span style={{ color: apiTestResult.privateStatus === 200 ? '#4ade80' : '#f87171' }}>
                      {apiTestResult.privateStatus === 200 ? '✅' : '❌'} GET /api/me con Bearer Access Token ({apiTestResult.privateStatus}):
                    </span>
                    <pre style={{ margin: '4px 0', padding: '4px', background: '#0f172a', borderRadius: '4px' }}>
                      {JSON.stringify(apiTestResult.privateData, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          )}

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
          <h4>ID Token (Microsoft Entra ID · Identidad):</h4>
          <pre className="token-box">{tokens.idToken}</pre>

          <h4>Access Token de tu API (scope access_as_user · Pase Bearer):</h4>
          <pre className="token-box">{tokens.accessToken}</pre>
        </div>
      )}
    </div>
  )
}
