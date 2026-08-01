import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { reloadOnServiceWorkerUpdate } from './lib/swUpdate'

// Without this, a deployed update installs itself but sits unused until the
// user happens to load the app a second time. See lib/swUpdate.ts.
reloadOnServiceWorkerUpdate()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
