import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ConvexClientProvider } from './providers/convex-provider.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexClientProvider >
      <App />
    </ConvexClientProvider>
  </React.StrictMode>,
)