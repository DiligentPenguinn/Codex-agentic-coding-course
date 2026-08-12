import {
  practiceEvidenceProfiles,
  type PracticeEvidenceProfile
} from '../../shared/contracts'
import type { PracticeEvidenceAdapter } from './practice-evidence-adapter'

export class PracticeEvidenceAdapterRegistry {
  private readonly adapters: ReadonlyMap<PracticeEvidenceProfile, PracticeEvidenceAdapter>

  constructor(adapters: readonly PracticeEvidenceAdapter[]) {
    const byProfile = new Map<PracticeEvidenceProfile, PracticeEvidenceAdapter>()
    for (const adapter of adapters) {
      if (byProfile.has(adapter.evidenceProfile)) {
        throw new Error(`Duplicate Practice evidence adapter: ${adapter.evidenceProfile}`)
      }
      byProfile.set(adapter.evidenceProfile, adapter)
    }
    for (const profile of practiceEvidenceProfiles) {
      if (!byProfile.has(profile)) {
        throw new Error(`Missing Practice evidence adapter: ${profile}`)
      }
    }
    this.adapters = byProfile
  }

  resolve(profile: string): PracticeEvidenceAdapter {
    const adapter = this.adapters.get(profile as PracticeEvidenceProfile)
    if (!adapter) throw new Error(`Unsupported Practice evidence profile: ${profile}`)
    return adapter
  }
}
