import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CompanionWindow } from './surfaces/CompanionWindow'
import { LearningWindow } from './surfaces/LearningWindow'
import './styles.css'

const isCompanion = window.location.hash === '#/companion'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isCompanion ? <CompanionWindow /> : <LearningWindow />}
  </StrictMode>
)
