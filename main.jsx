import React from 'react'
import ReactDOM from 'react-dom/client'
import CivilizationMetroMap from './CivMap.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <CivilizationMetroMap />
    </ErrorBoundary>
  </React.StrictMode>,
)

