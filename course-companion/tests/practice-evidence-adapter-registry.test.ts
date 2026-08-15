import { describe, expect, it } from 'vitest'
import type {
  PracticeAdapterEvidenceState,
  PracticeEvidenceProfile
} from '../shared/contracts'
import type {
  PracticeEvidenceAdapter,
  PracticeEvidenceAdapterContext
} from '../electron/main/practice-evidence-adapter'
import { PracticeEvidenceAdapterRegistry } from '../electron/main/practice-evidence-adapter-registry'

function adapter(evidenceProfile: PracticeEvidenceProfile): PracticeEvidenceAdapter {
  return {
    evidenceProfile,
    async collect(context: Readonly<PracticeEvidenceAdapterContext>): Promise<PracticeAdapterEvidenceState> {
      return {
        schemaVersion: 1,
        practiceId: context.definition.practiceId,
        practiceVersion: context.definition.version,
        runId: context.runId,
        evidenceProfile,
        observedAt: '2026-08-11T00:00:00.000Z',
        freshness: 'unverifiable',
        sourceDigest: null,
        evidence: [],
        steps: [],
        invalidations: []
      }
    }
  }
}

describe('PracticeEvidenceAdapterRegistry', () => {
  const configuration = adapter('codex-task-configuration')
  const planning = adapter('planning-package')
  const portfolioPlanning = adapter('portfolio-planning')

  it('resolves every live evidence profile without falling back to Executor claims', () => {
    const registry = new PracticeEvidenceAdapterRegistry([configuration, planning, portfolioPlanning])
    expect(registry.resolve('codex-task-configuration')).toBe(configuration)
    expect(registry.resolve('planning-package')).toBe(planning)
    expect(registry.resolve('portfolio-planning')).toBe(portfolioPlanning)
    expect(() => registry.resolve('unknown-profile')).toThrow('Unsupported Practice evidence profile')
  })

  it('requires exactly one adapter for every adapter-backed profile', () => {
    expect(() => new PracticeEvidenceAdapterRegistry([configuration, portfolioPlanning]))
      .toThrow('Missing Practice evidence adapter: planning-package')
    expect(() => new PracticeEvidenceAdapterRegistry([configuration, configuration, planning, portfolioPlanning]))
      .toThrow('Duplicate Practice evidence adapter: codex-task-configuration')
  })
})
