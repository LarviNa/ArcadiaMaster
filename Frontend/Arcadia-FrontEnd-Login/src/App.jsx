import { useState } from 'react'
import Register from './Register'

function App() {
  const [showRegister, setShowRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [redirectToAdmin, setRedirectToAdmin] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8083';
      const response = await fetch(`${gatewayUrl}/api/usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Credenciales inválidas')
      }

      // Successful login
      const data = await response.json()

      // Validar que si desea entrar al panel de administración, tenga el rol necesario
      if (redirectToAdmin && data.rol?.toLowerCase() !== 'admin') {
        throw new Error('Acceso denegado: Se requieren permisos de administrador para ingresar al panel.')
      }

      setSuccess(true)

      // Guardar token y datos del usuario
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({
        id: data.userId,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol
      }))

      // Redirigir según la selección
      setTimeout(() => {
        const userParam = encodeURIComponent(JSON.stringify({
          id: data.userId,
          nombre: data.nombre,
          email: data.email,
          rol: data.rol
        }));

        const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
        const clientesUrl = import.meta.env.VITE_CLIENTES_URL || 'http://localhost:3001';
        if (redirectToAdmin) {
          window.location.href = `${adminUrl}/?token=${data.token}&user=${userParam}`
        } else {
          window.location.href = `${clientesUrl}/?token=${data.token}&user=${userParam}`
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
    const mockToken = redirectToAdmin ? "mock-admin-token-bypass" : "mock-cliente-token-bypass";
    const mockUser = encodeURIComponent(JSON.stringify({
      id: "u-mock-bypass",
      nombre: redirectToAdmin ? "Administrador Demo (Bypass)" : "Cliente Demo (Bypass)",
      email: redirectToAdmin ? "admin-bypass@arcadia.com" : "cliente-bypass@arcadia.com",
      rol: redirectToAdmin ? "Admin" : "Cliente"
    }));

    setTimeout(() => {
      const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
      const clientesUrl = import.meta.env.VITE_CLIENTES_URL || 'http://localhost:3001';
      if (redirectToAdmin) {
        window.location.href = `${adminUrl}/?token=${mockToken}&user=${mockUser}`;
      } else {
        window.location.href = `${clientesUrl}/?token=${mockToken}&user=${mockUser}`;
      }
    }, 1500)
  }

  if (showRegister) {
    return <Register />
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

  return (
    <div className="login-container">
      <button
        onClick={() => window.history.back()}
        className="back-button"
        title="Volver atrás"
      >
        ← Volver
      </button>
      <div className="glass-card">
        <div className="login-header">
          <h1>Arcadia Admin</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@arcadia.com"
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

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
            <input
              type="checkbox"
              id="redirectToAdmin"
              checked={redirectToAdmin}
              onChange={(e) => setRedirectToAdmin(e.target.checked)}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="redirectToAdmin" style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Ingresar al Panel de Administración
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="loader"></span> : 'Iniciar Sesión'}
          </button>
        </form>

        <button
          onClick={handleBypass}
          className="btn-secondary"
          title="Usa este botón en tu presentación si no tienes usuarios en la DB"
        >
          Bypass Login (Modo Presentación)
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ¿No tienes cuenta?
          </span>
          <button
            onClick={() => setShowRegister(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#818cf8',
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
          >
            Regístrate
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
