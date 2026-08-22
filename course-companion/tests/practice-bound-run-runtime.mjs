import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { CodexTaskMetadataReader } from '../electron/main/codex-task-metadata-reader.ts'

const [practiceStorePath, codexHomePath] = process.argv.slice(2)

if (!practiceStorePath || !codexHomePath) {
  throw new Error('Usage: npm run test:practice-bound-runtime -- <practice-runs.json> <codex-home>')
}

const store = JSON.parse(await readFile(resolve(practiceStorePath), 'utf8'))
const run = store?.activeRun
const binding = run?.binding
if (!run || run.status !== 'active' || !binding || binding.runId !== run.runId) {
  throw new Error('The supplied Practice store has no valid active task binding')
}

const codexHome = resolve(codexHomePath)
const snapshot = await new CodexTaskMetadataReader(
  join(codexHome, 'state_5.sqlite'),
  join(codexHome, 'sessions')
).read(binding)

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  runId: snapshot.runId,
  threadId: snapshot.threadId,
  source: snapshot.source,
  settings: {
    model: snapshot.model.protocolValue,
    reasoningEffort: snapshot.reasoningEffort.protocolValue,
    serviceTier: snapshot.serviceTier.protocolValue,
    approvalPolicy: snapshot.approvalPolicy.protocolValue,
    fullAccess: snapshot.fullAccess.protocolValue
  }
}, null, 2)}\n`)
