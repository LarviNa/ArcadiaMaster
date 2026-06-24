import { useState } from 'react'

function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8083';
      const response = await fetch(`${gatewayUrl}/api/usuarios/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          rol: 'Cliente'
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Error al registrar usuario')
      }

      setSuccess(true)
      const loginUrl = import.meta.env.VITE_LOGIN_URL || 'http://localhost:5173';
      setTimeout(() => {
        window.location.href = loginUrl
      }, 2000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    window.location.href = import.meta.env.VITE_LOGIN_URL || 'http://localhost:5173'
  }

  if (success) {
    return (
      <div className="login-container">
        <div className="glass-card success-message">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2>¡Registro Exitoso!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
            Redirigiendo al login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <button 
        onClick={handleBackToLogin}
        className="back-button"
        title="Volver al login"
      >
        ← Volver al Login
      </button>
      <div className="glass-card">
        <div className="login-header">
          <h1>Registrarse</h1>
          <p>Crea tu cuenta en Arcadia</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              className="form-input"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="loader"></span> : 'Registrarse'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ¿Ya tienes cuenta? 
          </span>
          <button 
            onClick={handleBackToLogin}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#818cf8', 
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
          >
            Inicia sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export default Register
