import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/be-vietnam-pro/800.css'
import { CompanionWindow } from './surfaces/CompanionWindow'
import { LearningWindow } from './surfaces/LearningWindow'
import './styles.css'

const isCompanion = window.location.hash === '#/companion'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isCompanion ? <CompanionWindow /> : <LearningWindow />}
  </StrictMode>
)
