import type { CourseCompanionApi } from '../shared/contracts'

declare global {
  interface Window {
    courseCompanion?: CourseCompanionApi
  }
}

export {}
