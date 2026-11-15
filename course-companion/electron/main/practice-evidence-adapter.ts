import type {
  PracticeAdapterEvidenceState,
  PracticeDefinition,
  PracticeEvidenceProfile
} from '../../shared/contracts'

export type PracticeEvidenceTaskIdentity = {
  threadId: string
  workspaceRoot: string
}

export type PracticeEvidenceAdapterContext = {
  definition: PracticeDefinition
  runId: string
  generation: number
  workspaceRoot: string
  task: PracticeEvidenceTaskIdentity | null
  allowedLegacyArtifactPaths?: readonly string[]
}

export interface PracticeEvidenceAdapter {
  readonly evidenceProfile: PracticeEvidenceProfile
  collect(context: Readonly<PracticeEvidenceAdapterContext>): Promise<PracticeAdapterEvidenceState>
}
