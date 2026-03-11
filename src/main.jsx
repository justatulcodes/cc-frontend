import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

import { getTenantConfig } from './api.js'

async function bootstrap() {
  try {
    const cfg = await getTenantConfig()
    window.__TENANT_CONFIG__ = cfg
  } catch (err) {
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

bootstrap()
