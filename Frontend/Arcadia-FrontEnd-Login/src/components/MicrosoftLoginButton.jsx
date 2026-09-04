import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../auth/loginRequest'

export function MicrosoftLoginButton({ disabled = false, destination = 'clientes' }) {
  const { instance } = useMsal()

  const handleLogin = () => {
    // Guardar preferencia de destino antes del redirect para saber a dónde redirigir al volver
    sessionStorage.setItem('arcadia_msal_target', destination)
    instance.loginRedirect(loginRequest)
  }

  return (
    <button
      type="button"
      className="btn-microsoft"
      onClick={handleLogin}
      disabled={disabled}
      title="Iniciar sesión a través de Microsoft Entra ID"
    >
      <svg
        className="ms-logo"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 21 21"
        width="21"
        height="21"
      >
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
      <span>Iniciar sesión con Microsoft</span>
    </button>
  )
}
