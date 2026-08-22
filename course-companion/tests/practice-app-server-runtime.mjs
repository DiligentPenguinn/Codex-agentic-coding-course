import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, relative, resolve, sep } from 'node:path'
import { CodexAppServerClient } from '../electron/main/codex-app-server-client.ts'
import { CodexTaskMetadataReader } from '../electron/main/codex-task-metadata-reader.ts'
import { normalizeCodexTaskConfiguration } from '../electron/main/codex-configuration-normalizer.ts'

const PREFIX = 'course-companion-practice-runtime-'

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : null
}

function samePath(left, right) {
  return typeof left === 'string'
    && resolve(left).toLocaleLowerCase('en-US') === resolve(right).toLocaleLowerCase('en-US')
}

function effective(value, threadId, workspace) {
  const result = record(value)
  const thread = record(result?.thread)
  if (!result || !thread || thread.id !== threadId || !samePath(result.cwd, workspace)) {
    throw new Error('Runtime diagnostic received a mismatched task binding')
  }
  const fields = {
    model: result.model,
    reasoningEffort: result.reasoningEffort,
    serviceTier: result.serviceTier,
    approvalPolicy: result.approvalPolicy,
    sandbox: result.sandbox
  }
  if (typeof fields.model !== 'string'
    || typeof fields.reasoningEffort !== 'string'
    || (fields.serviceTier !== null && typeof fields.serviceTier !== 'string')
    || typeof fields.approvalPolicy !== 'string'
    || !record(fields.sandbox)) {
    throw new Error(`Runtime diagnostic did not receive all five effective settings: ${JSON.stringify({
      model: fields.model,
      reasoningEffort: fields.reasoningEffort,
      serviceTier: fields.serviceTier,
      approvalPolicy: fields.approvalPolicy,
      sandboxType: record(fields.sandbox)?.type ?? null
    })}`)
  }
  return fields
}

async function removeTemporaryRoot(root) {
  let failure = null
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await rm(root, { recursive: true, force: true })
      return
    } catch (error) {
      failure = error
      await new Promise((resolveWait) => setTimeout(resolveWait, 100))
    }
  }
  throw failure
}

async function rolloutSummary(codexHome, threadId) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const paths = (await readdir(codexHome, { recursive: true }))
      .filter((entry) => typeof entry === 'string'
        && basename(entry).startsWith('rollout-')
        && entry.endsWith('.jsonl'))
      .map((entry) => join(codexHome, entry))
    for (const path of paths) {
      const content = await readFile(path, 'utf8')
      if (!content.includes(threadId)) continue
      const items = content.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
      return {
        available: true,
        relativePath: relative(codexHome, path),
        itemCount: items.length,
        itemTypes: items.map((item) => item.type === 'event_msg'
          ? `${item.type}/${item.payload?.type ?? 'unknown'}`
          : item.type === undefined ? `keys:${Object.keys(item).sort().join('+')}` : String(item.type)),
        hasSessionMeta: items.some((item) => item.type === 'session_meta'),
        hasSettingsEvent: items.some((item) => item.type === 'event_msg'
          && item.payload?.type === 'thread_settings_applied')
      }
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100))
  }
  return {
    available: false,
    relativePath: null,
    itemCount: 0,
    itemTypes: [],
    hasSessionMeta: false,
    hasSettingsEvent: false
  }
}

async function main() {
  const root = await mkdtemp(join(tmpdir(), PREFIX))
  const temporaryRoot = resolve(tmpdir()) + sep
  const resolvedRoot = resolve(root)
  if (!resolvedRoot.startsWith(temporaryRoot) || !basename(resolvedRoot).startsWith(PREFIX)) {
    throw new Error('Refusing to use an unexpected runtime diagnostic directory')
  }
  const codexHome = join(root, 'codex-home')
  const workspace = join(root, 'workspace')
  await Promise.all([mkdir(codexHome), mkdir(workspace)])
  const launch = {
    env: { ...process.env, CODEX_HOME: codexHome },
    clientName: 'content_builder_academy_practice_runtime_diagnostic'
  }
  let first = null
  let second = null
  try {
    first = new CodexAppServerClient(launch)
    await first.start()
    const started = record(await first.request('thread/start', {
      cwd: workspace,
      ephemeral: false,
      serviceName: 'content_builder_academy_practice_runtime_diagnostic',
      model: 'gpt-5.6-sol',
      serviceTier: 'standard',
      approvalPolicy: 'on-request',
      sandbox: 'workspace-write',
      config: { model_reasoning_effort: 'high' }
    }))
    const threadId = record(started?.thread)?.id
    if (typeof threadId !== 'string' || !threadId) {
      throw new Error('Runtime diagnostic could not create an empty task')
    }
    const startedSettings = effective(started, threadId, workspace)
    const observedAt = new Date().toISOString()
    const baseline = normalizeCodexTaskConfiguration({
      runId: 'runtime-diagnostic-run',
      threadId,
      source: 'thread-start',
      payload: started,
      observedAt,
      eventTimestampMs: Date.parse(observedAt)
    })
    await first.request('thread/name/set', {
      threadId,
      name: 'Course Companion Practice runtime diagnostic'
    })
    const firstRead = record(await first.request('thread/read', { threadId, includeTurns: true }))
    if (!record(firstRead?.thread) || record(firstRead?.thread)?.id !== threadId) {
      throw new Error('Runtime diagnostic could not read the newly created task')
    }
    await first.request('thread/unsubscribe', { threadId })
    await first.stop()
    first = null

    const rollout = await rolloutSummary(codexHome, threadId)
    if (rollout.available && !rollout.hasSessionMeta) {
      throw new Error(`Runtime diagnostic candidate ${rollout.relativePath} has no session metadata: ${rollout.itemTypes.join(', ')}`)
    }

    const metadata = new CodexTaskMetadataReader(
      join(codexHome, 'state_5.sqlite'),
      join(codexHome, 'sessions')
    )
    const observedSettings = await metadata.read({
      runId: 'runtime-diagnostic-run',
      threadId,
      name: 'Course Companion Practice runtime diagnostic',
      workspaceRoot: workspace,
      createdAt: observedAt,
      configuration: baseline
    })

    second = new CodexAppServerClient(launch)
    await second.start()
    const read = record(await second.request('thread/read', { threadId, includeTurns: true }))
    const thread = record(read?.thread)
    if (!thread || thread.id !== threadId || !samePath(thread.cwd, workspace)
      || !Array.isArray(thread.turns) || thread.turns.length !== 0) {
      throw new Error('Runtime diagnostic could not reread the exact empty task')
    }
    await second.stop()
    second = null

    process.stdout.write(`${JSON.stringify({
      status: 'passed',
      emptyTask: true,
      nonOwningRead: true,
      rollout,
      startSettings: startedSettings,
      observedSource: observedSettings.source,
      observedSettings: {
        model: observedSettings.model.protocolValue,
        reasoningEffort: observedSettings.reasoningEffort.protocolValue,
        serviceTier: observedSettings.serviceTier.protocolValue,
        approvalPolicy: observedSettings.approvalPolicy.protocolValue,
        fullAccess: observedSettings.fullAccess.protocolValue
      }
    }, null, 2)}\n`)
  } finally {
    await first?.stop().catch(() => undefined)
    await second?.stop().catch(() => undefined)
    await removeTemporaryRoot(resolvedRoot)
  }
}

main().catch((error) => {
  process.stderr.write(`Practice App Server runtime diagnostic failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
