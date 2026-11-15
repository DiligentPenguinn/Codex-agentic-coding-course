import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { portfolioPackageDocuments, portfolioPackageActivity, portfolioPackageTimestamp } from './portfolio-package-fixture'
import type { PracticeDefinition } from '../../shared/contracts'
import type { PracticeRunRecord } from '../../electron/main/practice-run-repository'

export const buildDocuments: Record<string, string> = {
  ...portfolioPackageDocuments,
  'planning/implementation-plan.md': '# Approved plan\n\n## First part\nREQ-WORK-02: build project stories first; learner inspects them before continuation.\n\n## Second part\nREQ-HERO: connect introduction and contact, then test mobile and keyboard behavior.',
  'src/main.tsx': 'export const website = "Portfolio with projects, introduction and contact"',
  'index.html': '<html><body><div id="root"></div></body></html>',
  'package.json': JSON.stringify({ scripts: { dev: 'vite', typecheck: 'tsc --noEmit', lint: 'eslint .', build: 'vite build', preview: 'vite preview', check: 'npm run typecheck && npm run lint && npm run build' }, dependencies: { react: '19' }, devDependencies: { vite: '7', typescript: '6' } }),
  'evidence/module-3/build-log.md': '# Build history\n\n## Project stories\nREQ-WORK-02 built first as planned. Check passed; learner inspected project links and accepted in their message before continuation.\n\n## Introduction and contact\nREQ-HERO built second. Learner inspected role, contact and mobile view, requested a heading improvement, then accepted. Browser and npm run check passed. These are disposable simulated records.',
  'evidence/module-3/learning-record.md': '# Learning record\n\n## Debugging during first part\nReal test scenario: project link opened the wrong project. Expected Alpha, actual Beta after clicking Alpha. Log showed wrong ID; corrected only the mapping. Original click and other project link rechecked. Learner explained how the mismatched ID established the cause.\n\n## Learner improvement during second part\nLearner noticed the role heading was hard to find, proposed larger text, compared before/after and accepted after keyboard and mobile rechecks. No extra feature was added.',
  'evidence/module-3/browser-validation.md': '# Final validation\n\n## Requirements and current source\nREQ-WORK-02: both projects and correct links. REQ-HERO: role and contact visible. All current application files checked with npm run check: typecheck, lint and build passed.\n\n## Browser observations\nDisposable simulated observations at http://localhost:5173: desktop 1280x800 and mobile 360x800 per agreed plan, no overflow; keyboard reaches both projects and contact, focus visible, no console errors. The learner inspected the website and accepted it. No deployment; real browser quality is not established by this fixture.'
}

export async function writeBuildPackage(root: string) {
  for (const [path, content] of Object.entries(buildDocuments)) {
    await mkdir(join(root, path, '..'), { recursive: true })
    await writeFile(join(root, path), content, 'utf8')
  }
}

export function buildRun(definition: PracticeDefinition, workspaceRoot: string): PracticeRunRecord {
  return {
    runId: 'run-build-v2', generation: 1, status: 'active', practiceId: definition.practiceId, practiceVersion: definition.version,
    workspaceKind: 'learner-portfolio', taskPolicy: 'safe-workspace-write', evidenceProfile: 'portfolio-build',
    binding: { runId: 'run-build-v2', threadId: 'thread-original-planning', name: 'Portfolio', workspaceRoot, createdAt: portfolioPackageTimestamp },
    startedAt: portfolioPackageTimestamp, updatedAt: portfolioPackageTimestamp,
    checklist: definition.checklist.map((step, index) => ({ id: step.id, title: step.title, status: index === 0 ? 'current' : 'pending' })),
    learnerDecisions: {}, learnerApprovals: {}, evidence: null, invalidations: [], stageReceipts: [], buildSliceReceipts: [],
    reviewStatus: 'not-reviewed', reviewHistory: []
  }
}

export const buildActivity = () => portfolioPackageActivity({
  runId: 'run-build-v2', threadId: 'thread-original-planning',
  learnerAuthoredPrompts: ['I inspected the first project stories and accept them; continue with the introduction.', 'The role heading is hard to find; make it larger. The link pointed to Beta, but I expected Alpha; the ID log explains why. I checked both links and accept the fix.', 'I checked desktop and mobile and accept the final website.'],
  executorResponses: ['Built project stories, waited for acceptance, then built introduction and contact. Improved the heading and fixed the project ID. All observations here are simulated test data.'],
  reportedVerificationEvidence: ['npm run check passed: typecheck, lint, build. Browser desktop/mobile and keyboard checks passed for the current source.']
})
