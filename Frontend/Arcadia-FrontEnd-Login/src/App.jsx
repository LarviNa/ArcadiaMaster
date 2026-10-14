import { useState, useEffect } from 'react'
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'
import { MicrosoftLoginButton } from './components/MicrosoftLoginButton'
import { MicrosoftProfile } from './components/MicrosoftProfile'
import Register from './Register'

export default function App({ isAuthConfigured = false, initError = null }) {
  const [showRegister, setShowRegister] = useState(false)
  const [activeTab, setActiveTab] = useState('cliente') // 'cliente' | 'admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errParam = params.get('error')
    const destParam = params.get('dest') || params.get('role')

    if (destParam === 'admin') {
      setActiveTab('admin')
    }

    if (errParam === 'no_admin_role' || errParam === 'unauthorized_role') {
      setActiveTab('admin')
      setError('Acceso denegado al Panel de Administración: Tu cuenta no tiene permisos de Administrador.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8083'
      const response = await fetch(`${gatewayUrl}/api/usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Credenciales inválidas. Verifica tu correo y contraseña.')
      }

      // Successful login
      const data = await response.json()

      // Si intenta ingresar en pestaña Admin, validar rol
      if (activeTab === 'admin' && data.rol?.toLowerCase() !== 'admin') {
        throw new Error(
          'Acceso denegado: Se requieren permisos de Administrador para ingresar a esta sección.'
        )
      }

      setSuccess(true)
      setSuccessMsg(
        activeTab === 'admin'
          ? `¡Bienvenido Administrador ${data.nombre || ''}! Conectando al panel...`
          : `¡Hola ${data.nombre || ''}! Redirigiendo a la tienda...`
      )

      // Guardar token y datos del usuario
      localStorage.setItem('token', data.token)
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: data.userId,
          nombre: data.nombre,
          email: data.email,
          rol: data.rol,
        })
      )

      // Redirigir según el rol
      setTimeout(() => {
        const adminUrl = import.meta.env.VITE_ADMIN_URL || './'
        const clientesUrl = import.meta.env.VITE_CLIENTES_URL || './'
        if (activeTab === 'admin') {
          window.location.href = `${adminUrl}`
        } else {
          window.location.href = `${clientesUrl}`
        }
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBypass = (asAdmin = false) => {
    setSuccess(true)
    const isAdminMode = asAdmin || activeTab === 'admin'
    const mockToken = isAdminMode ? 'mock-admin-token-bypass' : 'mock-cliente-token-bypass'
    const userPayload = {
      id: isAdminMode ? 'u-admin-demo' : 'u-cliente-demo',
      nombre: isAdminMode ? 'Administrador Demo (Bypass)' : 'Cliente Demo (Bypass)',
      email: isAdminMode ? 'admin@arcadiacomics.cl' : 'cliente@arcadiacomics.cl',
      rol: isAdminMode ? 'Admin' : 'Cliente',
    }
    const mockUser = encodeURIComponent(JSON.stringify(userPayload))

    localStorage.setItem('token', mockToken)
    localStorage.setItem('user', JSON.stringify(userPayload))

    setSuccessMsg(
      isAdminMode
        ? '¡Acceso Rápido Administrador activado! Conectando al panel...'
        : '¡Acceso Rápido Cliente activado! Redirigiendo a la tienda...'
    )

    setTimeout(() => {
      const adminUrl = import.meta.env.VITE_ADMIN_URL || './'
      const clientesUrl = import.meta.env.VITE_CLIENTES_URL || './'
      if (isAdminMode) {
        window.location.href = `${adminUrl}/?token=${mockToken}&user=${mockUser}`
      } else {
        window.location.href = `${clientesUrl}/?token=${mockToken}&user=${mockUser}`
      }
    }, 1100)
  }

  const fillDemoData = (type) => {
    if (type === 'cliente') {
      setEmail('cliente@arcadiacomics.cl')
      setPassword('Cliente123!')
    } else {
      setEmail('admin@arcadiacomics.cl')
      setPassword('Admin123!')
    }
  }

  if (showRegister) {
    return <Register onBack={() => setShowRegister(false)} />
  }

  if (success) {
    return (
      <div className="login-container">
        <div className="glass-card success-message">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
          <h2>Sesión Iniciada con Éxito</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
            {successMsg}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="back-button"
        title="Volver atrás"
      >
        ← Volver a la Tienda
      </button>

      {/* Si el usuario ya está autenticado con Microsoft */}
      <AuthenticatedTemplate>
        <div className="glass-card msal-card">
          <div className="login-header">
            <h1>Arcadia Portal</h1>
            <p>Autenticación con Microsoft Entra ID activa</p>
          </div>
          <MicrosoftProfile />
        </div>
      </AuthenticatedTemplate>

      {/* Si no hay sesión de Microsoft, se muestra el selector de rol */}
      <UnauthenticatedTemplate>
        <div className="glass-card">
          {/* Pestañas para separar claramente Clientes y Administradores */}
          <div className="role-tabs">
            <button
              type="button"
              className={`role-tab ${activeTab === 'cliente' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('cliente')
                setError(null)
              }}
            >
              <span>🛍️ Clientes</span>
            </button>
            <button
              type="button"
              className={`role-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('admin')
                setError(null)
              }}
            >
              <span>🛡️ Administrador</span>
            </button>
          </div>

          {/* ==================================================== */}
          {/* CASO A: ACCESO CLIENTES (Sistema Normal de Login)    */}
          {/* ==================================================== */}
          {activeTab === 'cliente' && (
            <>
              <div className="login-header">
                <h1>Iniciar Sesión</h1>
                <p>Ingresa con tu correo y contraseña para comprar y ver tus compras</p>
              </div>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="email">Correo Electrónico</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Contraseña</label>
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <span className="loader"></span> : 'Ingresar a la Tienda'}
                </button>
              </form>

              {/* Botón rápido demo cliente */}
              <button
                type="button"
                onClick={() => handleBypass(false)}
                className="quick-demo-btn"
                title="Ingresa instantáneamente a la tienda como cliente demo"
              >
                ⚡ Acceso Rápido Cliente (Bypass Demo)
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  ¿No tienes una cuenta de cliente?
                </span>
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818cf8',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginLeft: '0.5rem',
                    fontSize: '0.85rem'
                  }}
                >
                  Regístrate aquí
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin')
                    setError(null)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <span>🛡️ ¿Eres del equipo de gestión?</span>
                  <span style={{ color: '#818cf8', fontWeight: 'bold' }}>Acceso Administrador (Microsoft) →</span>
                </button>
              </div>
            </>
          )}

          {/* ==================================================== */}
          {/* CASO B: ACCESO ADMINISTRADOR (Exclusivo Microsoft)   */}
          {/* ==================================================== */}
          {activeTab === 'admin' && (
            <>
              <div className="login-header">
                <h1>Panel Administrador</h1>
                <p>Acceso exclusivo con Microsoft Entra ID para personal autorizado</p>
              </div>

              {error && <div className="error-message">{error}</div>}

              {/* Caja informativa de Microsoft */}
              <div className="admin-notice-box">
                <strong>🔒 Autenticación Corporativa / Institucional</strong>
                El panel de administración utiliza inicio de sesión de Microsoft Entra ID para salvaguardar el catálogo, stock y usuarios.
              </div>

              {/* Botón principal: Microsoft Entra ID */}
              <div className="msal-login-section" style={{ marginBottom: '1.25rem' }}>
                <MicrosoftLoginButton destination="admin" />
              </div>

              <div className="divider">
                <span>o credenciales de Administrador Local</span>
              </div>

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="admin-email">Correo Administrador</label>
                  <input
                    type="email"
                    id="admin-email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@arcadiacomics.cl"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="admin-password">Contraseña</label>
                  <input
                    type="password"
                    id="admin-password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <span className="loader"></span> : 'Ingresar como Administrador'}
                </button>
              </form>

              {/* Bypass Admin Demo */}
              <button
                type="button"
                onClick={() => handleBypass(true)}
                className="quick-demo-btn"
                title="Ingresa instantáneamente al panel de administración"
              >
                ⚡ Acceso Rápido Administrador (Bypass Demo)
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('cliente')
                    setError(null)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <span>← Volver a inicio de sesión para Clientes</span>
                </button>
              </div>
            </>
          )}
        </div>
      </UnauthenticatedTemplate>
    </div>
  )
}
