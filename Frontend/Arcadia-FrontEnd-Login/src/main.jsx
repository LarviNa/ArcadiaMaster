import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig, isAuthConfigured } from './auth/msalConfig'
import App from './App.jsx'
import './index.css'

const root = createRoot(document.getElementById('root'))

async function bootstrap() {
  // Si no hay credenciales reales en .env (o son placeholders), no se instancia MSAL
  // para evitar excepciones de validación de GUID de Azure.
  if (!isAuthConfigured) {
    root.render(
      <StrictMode>
        <App isAuthConfigured={false} />
      </StrictMode>,
    )
    return
  }

  try {
    const msalInstance = new PublicClientApplication(msalConfig)
    await msalInstance.initialize()
    await msalInstance.handleRedirectPromise()

    root.render(
      <StrictMode>
        <MsalProvider instance={msalInstance}>
          <App isAuthConfigured={true} />
        </MsalProvider>
      </StrictMode>,
    )
  } catch (err) {
    console.error('Error al inicializar MSAL:', err)
    root.render(
      <StrictMode>
        <App isAuthConfigured={false} initError={err.message} />
      </StrictMode>,
    )
  }
}

void bootstrap()
