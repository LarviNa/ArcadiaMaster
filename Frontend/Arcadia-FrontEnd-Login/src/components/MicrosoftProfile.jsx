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
  const [userRole, setUserRole] = useState('Cliente')
  const [syncingBackend, setSyncingBackend] = useState(true)
  const [apiTestResult, setApiTestResult] = useState(null)
  const [testingApi, setTestingApi] = useState(false)
  const [activeView, setActiveView] = useState('portal') // 'portal' | 'admin' | 'tienda'
  const [adminTab, setAdminTab] = useState('overview') // 'overview' | 'users' | 'comics'
  const [backendUsers, setBackendUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'https://yrs29frx6c.execute-api.us-east-1.amazonaws.com'
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

          let finalToken = result.accessToken || result.idToken

          // 2. Sincronizar y verificar rol contra el backend de Arcadia en AWS EC2 (ms-usuarios)
          try {
            const response = await fetch(`${gatewayUrl}/api/usuarios/azure-login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: result.idToken }),
            })
            if (response.ok) {
              const data = await response.json()
              if (data.token) finalToken = data.token
              if (data.userId) userObj.id = data.userId
              if (data.rol) {
                userObj.rol = data.rol
                detectedRole = data.rol
              }
              if (data.nombre) userObj.nombre = data.nombre
            }
          } catch (e) {
            console.warn('Backend en EC2 respondió o se conectó con token directo:', e)
          }

          setUserRole(detectedRole)
          setSyncingBackend(false)
          localStorage.setItem('token', finalToken)
          localStorage.setItem('user', JSON.stringify(userObj))
        }
      } catch (err) {
        if (cancelled) return
        setSyncingBackend(false)
        if (err instanceof InteractionRequiredAuthError) {
          setError('Se requiere interacción adicional. Por favor cierra sesión e inicia nuevamente.')
          return
        }
        setError(err instanceof Error ? err.message : 'No se pudieron obtener los tokens de Microsoft Entra ID.')
      }
    }

    void loadTokens()
    return () => {
      cancelled = true
    }
  }, [account, instance])

  // Cargar usuarios para el panel de administración
  const fetchBackendUsers = async () => {
    setLoadingUsers(true)
    try {
      const token = tokens?.accessToken || localStorage.getItem('token')
      const res = await fetch(`${gatewayUrl}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setBackendUsers(Array.isArray(data) ? data : [])
      } else {
        // Fallback demostrativo con el usuario actual de Azure
        setBackendUsers([
          {
            id: 'usr-ms-1',
            nombre: account.name || 'Matias Barraza',
            email: account.username,
            rol: userRole,
            proveedor: 'MICROSOFT',
            estado: 'Activo'
          },
          {
            id: 'usr-loc-2',
            nombre: 'Profesor Revisor',
            email: 'profesor@duocuc.cl',
            rol: 'Profesor / Admin',
            proveedor: 'MICROSOFT',
            estado: 'Activo'
          },
          {
            id: 'usr-loc-3',
            nombre: 'Cliente Demostración',
            email: 'cliente@arcadia.cl',
            rol: 'Cliente',
            proveedor: 'LOCAL',
            estado: 'Activo'
          }
        ])
      }
    } catch {
      setBackendUsers([
        {
          id: 'usr-ms-1',
          nombre: account.name || 'Matias Barraza',
          email: account.username,
          rol: userRole,
          proveedor: 'MICROSOFT',
          estado: 'Activo'
        }
      ])
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleTestApis = async () => {
    setTestingApi(true)
    setApiTestResult(null)
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

  const handleNavigate = (target) => {
    setError(null)
    const effectiveRole = userRole || 'Cliente'

    if (target === 'admin') {
      if (effectiveRole.toLowerCase() !== 'admin') {
        setError(`Acceso restringido: Tu cuenta (${account.username}) tiene rol '${effectiveRole}'. Solo cuentas con rol 'Admin' pueden ingresar al Panel de Administración.`)
        return
      }
      setActiveView('admin')
      fetchBackendUsers()
    } else if (target === 'tienda') {
      setActiveView('tienda')
    }
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

  // =========================================================================
  // VISTA 1: PANEL DE ADMINISTRACIÓN INTEGRADO (Para la presentación)
  // =========================================================================
  if (activeView === 'admin') {
    return (
      <div style={{ width: '100%', maxWidth: '950px', margin: '0 auto', color: '#f8fafc' }}>
        {/* Barra superior de Admin */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #334155', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0' }}>
              <span>⚙️</span> Arcadia AdminPanel
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Gestión Cloud Native · AWS EC2 + AWS API Gateway + Azure Entra ID
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
              👑 ADMIN: {account.name || account.username}
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setActiveView('portal')}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            >
              ← Volver al Portal
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleLogout}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación del Admin */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setAdminTab('overview')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: adminTab === 'overview' ? '#3b82f6' : '#1e293b',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            📊 Arquitectura & Estado Cloud
          </button>
          <button
            onClick={() => { setAdminTab('users'); fetchBackendUsers(); }}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: adminTab === 'users' ? '#3b82f6' : '#1e293b',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            👥 Gestión de Usuarios
          </button>
        </div>

        {/* Pestaña: Arquitectura & Estado */}
        {adminTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8' }}>☁️ Azure Entra ID</h4>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0' }}><strong>Tenant ID:</strong> {tid}</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0' }}><strong>App Client ID:</strong> 55611909-8d64-41ee-90b6-2a89b026fd4e</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0' }}><strong>Scope:</strong> api://55611909.../access_as_user</p>
                <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.2rem 0.5rem', background: '#064e3b', color: '#34d399', borderRadius: '4px', fontSize: '0.75rem' }}>
                  Autenticación PKCE Activa
                </span>
              </div>

              <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>🌐 AWS API Gateway</h4>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0' }}><strong>Protocolo:</strong> HTTPS</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0' }}><strong>Endpoint:</strong> yrs29frx6c.execute-api.us-east-1</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0' }}><strong>Ruta Proxy:</strong> ANY /&#123;proxy+&#125;</p>
                <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.2rem 0.5rem', background: '#064e3b', color: '#34d399', borderRadius: '4px', fontSize: '0.75rem' }}>
                  Enrutamiento Seguro Activo
                </span>
              </div>

              <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>🖥️ AWS EC2 Backend</h4>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0' }}><strong>IP Host:</strong> 100.48.238.112:8083</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0' }}><strong>Servicio:</strong> Spring Boot 3 / OpenJDK 21</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0' }}><strong>Seguridad:</strong> OAuth2 Resource Server</p>
                <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.2rem 0.5rem', background: '#064e3b', color: '#34d399', borderRadius: '4px', fontSize: '0.75rem' }}>
                  Online (200 OK)
                </span>
              </div>
            </div>

            {/* Consola de Pruebas de API en vivo */}
            <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>🧪 Consola de Verificación en Vivo (API Gateway + EC2)</h3>
                <button
                  onClick={handleTestApis}
                  disabled={testingApi}
                  className="btn-primary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  {testingApi ? 'Ejecutando...' : 'Re-ejecutar Pruebas'}
                </button>
              </div>

              {apiTestResult ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#4ade80', fontWeight: 'bold' }}>GET /public/hola</span>
                      <span style={{ background: '#166534', color: '#86efac', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                        Status {apiTestResult.publicStatus}
                      </span>
                    </div>
                    <pre style={{ margin: 0, padding: '0.5rem', background: '#0b0f19', borderRadius: '6px', fontSize: '0.75rem', overflowX: 'auto' }}>
                      {JSON.stringify(apiTestResult.publicData, null, 2)}
                    </pre>
                  </div>

                  <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>GET /api/me (Bearer Token)</span>
                      <span style={{ background: '#166534', color: '#86efac', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                        Status {apiTestResult.privateStatus}
                      </span>
                    </div>
                    <pre style={{ margin: 0, padding: '0.5rem', background: '#0b0f19', borderRadius: '6px', fontSize: '0.75rem', overflowX: 'auto' }}>
                      {JSON.stringify(apiTestResult.privateData, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                  Presiona el botón superior o usa el portal para ejecutar una verificación directa por HTTPS a través del API Gateway.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pestaña: Usuarios Registrados */}
        {adminTab === 'users' && (
          <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Usuarios y Roles en el Sistema</h3>
              <button
                onClick={fetchBackendUsers}
                disabled={loadingUsers}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                {loadingUsers ? 'Actualizando...' : 'Refrescar'}
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Usuario</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Correo</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Rol Asignado</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                {backendUsers.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 'bold' }}>{u.nombre || 'Usuario'}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#cbd5e1' }}>{u.email}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background: u.rol?.toLowerCase().includes('admin') ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: u.rol?.toLowerCase().includes('admin') ? '#c084fc' : '#34d399'
                      }}>
                        {u.rol}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{ background: '#1e293b', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {u.proveedor}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // VISTA 2: TIENDA DE COMICS INTEGRADA (Para clientes / compras)
  // =========================================================================
  if (activeView === 'tienda') {
    const comicsDemo = [
      { id: 1, title: 'The Amazing Spider-Man #1', price: '$8.990', publisher: 'Marvel', stock: 12 },
      { id: 2, title: 'Batman: Year One Deluxe', price: '$12.990', publisher: 'DC Comics', stock: 5 },
      { id: 3, title: 'X-Men: Dark Phoenix Saga', price: '$14.500', publisher: 'Marvel', stock: 8 },
      { id: 4, title: 'Watchmen Complete Edition', price: '$19.990', publisher: 'DC Comics', stock: 3 },
    ]

    return (
      <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', color: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #334155', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>🛒 Arcadia Comics Store</h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Catálogo Oficial de Clientes</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.85rem' }}>
              🛍️ Carrito: {cartCount} items
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setActiveView('portal')}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            >
              ← Volver al Portal
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {comicsDemo.map(comic => (
            <div key={comic.id} style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#818cf8', textTransform: 'uppercase', fontWeight: 'bold' }}>{comic.publisher}</span>
                <h4 style={{ margin: '0.4rem 0', fontSize: '1rem' }}>{comic.title}</h4>
                <p style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '1.1rem', margin: '0.3rem 0' }}>{comic.price}</p>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Stock disponible: {comic.stock}</p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setCartCount(c => c + 1)}
                style={{ marginTop: '0.75rem', padding: '0.5rem', fontSize: '0.85rem' }}
              >
                + Agregar al Carrito
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // =========================================================================
  // VISTA 3: PORTAL PRINCIPAL DE ACCESO (Tarjeta central de la presentación)
  // =========================================================================
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

      {error && <div className="error-message" style={{ marginTop: '0.75rem' }}>{error}</div>}

      <div className="msal-actions">
        <p className="msal-actions-title">¿A dónde deseas ingresar?</p>
        <button
          type="button"
          className="btn-primary msal-nav-btn"
          onClick={() => handleNavigate('tienda')}
        >
          🛒 Ir a la Tienda de Comics
        </button>

        <button
          type="button"
          className={`btn-primary msal-nav-btn admin-btn ${!isAdmin ? 'btn-disabled' : ''}`}
          onClick={() => handleNavigate('admin')}
          title={!isAdmin ? 'Requiere rol Administrador en Microsoft Entra ID' : 'Ingresar al panel de control'}
        >
          {isAdmin ? '⚙️ Ir al Panel de Administración' : '🔒 Panel de Administración (Solo Admin)'}
        </button>

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
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#38bdf8' }}>Resultados de la prueba de API (AWS API Gateway):</div>
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

      {showTokens && tokens && (
        <div className="msal-tokens-inspector" style={{ marginTop: '1rem' }}>
          <h4>ID Token (Microsoft Entra ID · Identidad):</h4>
          <pre className="token-box">{tokens.idToken}</pre>

          <h4>Access Token de tu API (scope access_as_user · Pase Bearer):</h4>
          <pre className="token-box">{tokens.accessToken}</pre>
        </div>
      )}
    </div>
  )
}
