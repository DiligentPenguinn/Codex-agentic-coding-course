import { describe, expect, it, vi } from 'vitest'
import { resolveCodexRuntimeCommand } from '../electron/main/codex-runtime'

function fixture(overrides: Partial<Parameters<typeof resolveCodexRuntimeCommand>[0]> = {}) {
  return {
    platform: 'win32' as NodeJS.Platform, env: {}, home: '/user',
    exists: vi.fn(async () => false),
    run: vi.fn(async (_command: string, args: string[]) => args[0] === '--version'
      ? 'codex-cli 0.164.0-alpha.11.1\n' : ''),
    ...overrides
  }
}

describe('Codex desktop runtime compatibility', () => {
  it('uses the active desktop runtime instead of an outdated CLI on PATH', async () => {
    const deps = fixture({ env: { CODEX_APP_RUNTIME_CLI_PATH: '/desktop/codex.exe' }, exists: async () => true })
    expect(await resolveCodexRuntimeCommand(deps)).toBe('/desktop/codex.exe')
    expect(deps.run).toHaveBeenCalledWith('/desktop/codex.exe', ['--version'])
  })

  it('discovers the Windows desktop runtime when launched outside Codex', async () => {
    const deps = fixture({ exists: async () => true,
      run: vi.fn(async (_command, args) => args[0] === '--version' ? 'codex-cli 0.164.0\n' : 'C:/Desktop\n') })
    expect(await resolveCodexRuntimeCommand(deps)).toMatch(/Desktop[\\/]app[\\/]resources[\\/]codex\.exe$/)
  })

  it('rechecks the installed desktop after an update even when the inherited path still exists', async () => {
    const env = { CODEX_APP_RUNTIME_CLI_PATH: '/desktop/old/codex.exe' }
    let location = 'C:/Desktop/first'
    const deps = fixture({ env, exists: async () => true,
      run: vi.fn(async (_command, args) => args[0] === '--version' ? 'codex-cli 0.164.0' : location) })
    expect(await resolveCodexRuntimeCommand(deps)).toContain('first')
    location = 'C:/Desktop/updated'
    expect(await resolveCodexRuntimeCommand(deps)).toContain('updated')
    expect(deps.run).not.toHaveBeenCalledWith(env.CODEX_APP_RUNTIME_CLI_PATH, ['--version'])
  })

  it('falls back from a removed runtime to Windows desktop discovery', async () => {
    const deps = fixture({ env: { CODEX_APP_RUNTIME_CLI_PATH: '/removed/codex.exe' },
      exists: async (path) => path !== '/removed/codex.exe',
      run: vi.fn(async (_command, args) => args[0] === '--version' ? 'codex-cli 0.164.0' : 'C:/Desktop') })
    expect(await resolveCodexRuntimeCommand(deps)).not.toBe('/removed/codex.exe')
  })

  it('uses a verified standalone CLI when desktop discovery is unavailable', async () => {
    const deps = fixture({ run: vi.fn(async (command) => {
      if (command === 'powershell.exe') throw new Error('Desktop not installed')
      return 'codex-cli 0.164.0-alpha.11.1'
    }) })
    expect(await resolveCodexRuntimeCommand(deps)).toBe('codex')
  })

  it.each(['codex-cli 0.147.0', 'unknown', 'codex-cli nope'])(
    'rejects an outdated or unverified standalone runtime: %s', async (version) => {
      const deps = fixture({ platform: 'linux', run: async () => version })
      await expect(resolveCodexRuntimeCommand(deps)).rejects.toMatchObject({ code: 'CODEX_RUNTIME_INCOMPATIBLE' })
    }
  )

  it('does not silently fall back when the selected desktop runtime cannot be checked', async () => {
    const deps = fixture({ env: { CODEX_APP_RUNTIME_CLI_PATH: '/desktop/codex.exe' }, exists: async () => true,
      run: async () => { throw new Error('Execution failed') } })
    await expect(resolveCodexRuntimeCommand(deps)).rejects.toMatchObject({ code: 'CODEX_RUNTIME_INCOMPATIBLE' })
  })

  it('finds a macOS desktop runtime', async () => {
    const deps = fixture({ platform: 'darwin', exists: async (path) => path === '/Applications/Codex.app/Contents/Resources/codex' })
    expect(await resolveCodexRuntimeCommand(deps)).toBe('/Applications/Codex.app/Contents/Resources/codex')
  })
})
