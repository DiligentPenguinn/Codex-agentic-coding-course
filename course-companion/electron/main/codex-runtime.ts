import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, posix } from 'node:path'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const options = { encoding: 'utf8' as const, windowsHide: true, timeout: 5000, maxBuffer: 16 * 1024 }

type RuntimeDependencies = {
  platform: NodeJS.Platform
  env: NodeJS.ProcessEnv
  home: string
  exists: (path: string) => Promise<boolean>
  run: (command: string, args: string[]) => Promise<string>
}

const defaults: RuntimeDependencies = {
  platform: process.platform,
  env: process.env,
  home: homedir(),
  exists: (path) => access(path).then(() => true, () => false),
  run: async (command, args) => (await execute(command, args, options)).stdout
}

export class CodexRuntimeError extends Error {
  readonly code = 'CODEX_RUNTIME_INCOMPATIBLE'
}

// Resolve afresh on each connection: the desktop updater can replace its runtime
// while Course Companion remains open. Never assume PATH tracks desktop updates.
export async function resolveCodexRuntimeCommand(deps: RuntimeDependencies = defaults): Promise<string> {
  let desktop: string | undefined
  if (deps.platform === 'win32') {
    try {
      const location = (await deps.run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
        "Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1 -ExpandProperty InstallLocation"
      ])).trim()
      const candidate = location ? join(location, 'app', 'resources', 'codex.exe') : ''
      if (candidate && await deps.exists(candidate)) desktop = candidate
    } catch { /* A standalone CLI installation may be the only available runtime. */ }
  }
  if (!desktop && deps.platform === 'darwin') {
    for (const root of ['/Applications', posix.join(deps.home, 'Applications')]) {
      for (const name of ['Codex.app', 'ChatGPT.app']) {
        const candidate = posix.join(root, name, 'Contents', 'Resources', 'codex')
        if (await deps.exists(candidate)) { desktop = candidate; break }
      }
      if (desktop) break
    }
  }
  // An inherited path can still exist after the desktop app has updated. Prefer
  // the current installation above; use the inherited runtime only as a fallback.
  if (!desktop && deps.env.CODEX_APP_RUNTIME_CLI_PATH
    && await deps.exists(deps.env.CODEX_APP_RUNTIME_CLI_PATH)) {
    desktop = deps.env.CODEX_APP_RUNTIME_CLI_PATH
  }
  const command = desktop ?? 'codex'
  let output: string
  try { output = await deps.run(command, ['--version']) } catch {
    throw new CodexRuntimeError('Cannot verify the installed Codex CLI. Update Codex and reopen Course Companion.')
  }
  const match = /^codex-cli (\d+)\.(\d+)\.(\d+)(?:[-+][\w.-]+)?\s*$/m.exec(output)
  if (!match || (Number(match[1]) === 0 && Number(match[2]) < 164)) {
    throw new CodexRuntimeError('Codex CLI 0.164 or newer is required. Update Codex and reopen Course Companion.')
  }
  return command
}
