import { useState, useEffect } from 'react'
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'
import { MicrosoftLoginButton } from './components/MicrosoftLoginButton'
import { MicrosoftProfile } from './components/MicrosoftProfile'
import Register from './Register'

export default function App({ isAuthConfigured = false, initError = null }) {
  const [showRegister, setShowRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [redirectToAdmin, setRedirectToAdmin] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errParam = params.get('error')
    if (errParam === 'no_admin_role' || errParam === 'unauthorized_role') {
      setError('Acceso denegado al Panel de Administración: Tu cuenta no tiene asignado el rol de Administrador.')
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
        throw new Error(errData.error || 'Credenciales inválidas')
      }

      // Successful login
      const data = await response.json()

      // Validar que si desea entrar al panel de administración, tenga el rol necesario
      if (redirectToAdmin && data.rol?.toLowerCase() !== 'admin') {
        throw new Error(
          'Acceso denegado: Se requieren permisos de administrador para ingresar al panel.'
        )
      }

      setSuccess(true)

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

      // Redirigir según la selección
      setTimeout(() => {
        const userParam = encodeURIComponent(
          JSON.stringify({
            id: data.userId,
            nombre: data.nombre,
            email: data.email,
            rol: data.rol,
          })
        )

        const adminUrl = import.meta.env.VITE_ADMIN_URL || './'
        const clientesUrl = import.meta.env.VITE_CLIENTES_URL || './'
        if (redirectToAdmin) {
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

  const handleBypass = () => {
    setSuccess(true)
    const mockToken = redirectToAdmin ? 'mock-admin-token-bypass' : 'mock-cliente-token-bypass'
    const mockUser = encodeURIComponent(
      JSON.stringify({
        id: 'u-mock-bypass',
        nombre: redirectToAdmin ? 'Administrador Demo (Bypass)' : 'Cliente Demo (Bypass)',
        email: redirectToAdmin ? 'admin-bypass@arcadia.com' : 'cliente-bypass@arcadia.com',
        rol: redirectToAdmin ? 'Admin' : 'Cliente',
      })
    )

    setTimeout(() => {
      const adminUrl = import.meta.env.VITE_ADMIN_URL || './'
      const clientesUrl = import.meta.env.VITE_CLIENTES_URL || './'
      if (redirectToAdmin) {
        window.location.href = `${adminUrl}`
      } else {
        window.location.href = `${clientesUrl}`
      }
    }, 1200)
  }

  if (showRegister) {
    return <Register onBack={() => setShowRegister(false)} />
  }

  if (success) {
    return (
      <div className="login-container">
        <div className="glass-card success-message">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2>{redirectToAdmin ? 'Bienvenido al Panel Admin' : 'Inicio de sesión exitoso'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
            {redirectToAdmin ? 'Conectando al dashboard...' : 'Redirigiendo a la tienda...'}
          </p>
        </div>
      </div>
    )
  }

  // Contenido común del formulario de credenciales y opciones secundarias
  const renderCommonForm = () => (
    <>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
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
          {loading ? <span className="loader"></span> : 'Iniciar Sesión'}
        </button>
      </form>

      <button
        type="button"
        onClick={handleBypass}
        className="btn-secondary"
        title="Usa este botón en tu presentación si no tienes backend activo"
      >
        Bypass Login (Modo Presentación)
      </button>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ¿No tienes cuenta?
        </span>
        <button
          type="button"
          onClick={() => setShowRegister(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#818cf8',
            cursor: 'pointer',
            marginLeft: '0.5rem',
          }}
        >
          Regístrate
        </button>
      </div>
    </>
  )

  const renderDestinationSelector = () => (
    <div className="destination-selector">
      <label className="checkbox-container">
        <input
          type="checkbox"
          id="redirectToAdmin"
          checked={redirectToAdmin}
          onChange={(e) => setRedirectToAdmin(e.target.checked)}
        />
        <span className="checkbox-label">
          Ingresar al <strong>Panel de Administración</strong> (Admin)
        </span>
      </label>
      <span className="destination-hint">
        {redirectToAdmin
          ? 'Destino: Panel de Administración'
          : 'Destino: Tienda de Comics Clientes'}
      </span>
    </div>
  )

  // Caso 1: MSAL está configurado con Client ID y Tenant ID reales
  if (isAuthConfigured) {
    return (
      <div className="login-container">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="back-button"
          title="Volver atrás"
        >
          ← Volver
        </button>

        {/* Plantilla cuando el usuario ya se autenticó en Microsoft */}
        <AuthenticatedTemplate>
          <div className="glass-card msal-card">
            <div className="login-header">
              <h1>Arcadia Portal</h1>
              <p>Autenticación con Microsoft Entra ID exitosa</p>
            </div>
            <MicrosoftProfile />
          </div>
        </AuthenticatedTemplate>

        {/* Plantilla cuando no hay sesión iniciada en Microsoft */}
        <UnauthenticatedTemplate>
          <div className="glass-card">
            <div className="login-header">
              <h1>Arcadia Login</h1>
              <p>Accede mediante Microsoft Entra ID o tu cuenta local</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {renderDestinationSelector()}

            {/* Botón principal: Microsoft Entra ID */}
            <div className="msal-login-section">
              <MicrosoftLoginButton destination={redirectToAdmin ? 'admin' : 'clientes'} />
            </div>

            <div className="divider">
              <span>o con credenciales locales</span>
            </div>

            {renderCommonForm()}
          </div>
        </UnauthenticatedTemplate>
      </div>
    )
  }

  // Caso 2: MSAL aún no configurado (falta editar .env)
  return (
    <div className="login-container">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="back-button"
        title="Volver atrás"
      >
        ← Volver
      </button>

      <div className="glass-card">
        <div className="login-header">
          <h1>Arcadia Login</h1>
          <p>Portal de Acceso Arcadia</p>
        </div>

        {/* Banner informativo similar al repo msal-front */}
        <div className="entra-notice-banner">
          <div className="entra-notice-header">
            <svg viewBox="0 0 21 21" width="18" height="18" style={{ flexShrink: 0 }}>
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <strong>Microsoft Entra ID</strong>
          </div>
          <p>
            Para activar el login con Microsoft, completa <code>VITE_CLIENT_ID</code> y{' '}
            <code>VITE_TENANT_ID</code> en tu archivo <code>.env</code> y reinicia el servidor.
          </p>
          {initError && <p className="entra-init-error">Detalle: {initError}</p>}
        </div>

        {error && <div className="error-message">{error}</div>}

        {renderDestinationSelector()}

        {renderCommonForm()}
      </div>
    </div>
  )
}
