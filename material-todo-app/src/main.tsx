import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Choose between regular and enhanced app versions
// Enhanced version includes virtual scrolling, error boundaries, and performance monitoring
const USE_ENHANCED_APP = import.meta.env.VITE_USE_ENHANCED_APP === 'true' ||
                         localStorage.getItem('use-enhanced-app') === 'true' ||
                         window.location.search.includes('enhanced=true');

// Lazy load the appropriate app version
const App = lazy(() => 
  USE_ENHANCED_APP 
    ? import('./AppEnhanced.tsx')
    : import('./App.tsx')
);

// Loading component
const AppLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground">
        {USE_ENHANCED_APP ? 'Loading enhanced app...' : 'Loading app...'}
      </p>
    </div>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<AppLoader />}>
      <App />
    </Suspense>
  </StrictMode>,
)
