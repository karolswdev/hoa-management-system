import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// Set app title from env, fallback to sensible default
const appName = import.meta.env.VITE_APP_NAME || 'HOA Community Hub';
if (typeof document !== 'undefined') {
  document.title = appName;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
