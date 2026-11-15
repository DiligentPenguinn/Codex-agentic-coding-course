import { execFile } from 'node:child_process'
import { setTimeout } from 'node:timers/promises'
import { promisify } from 'node:util'

const execute = promisify(execFile)
type GitRead = (args: string[], root: string) => Promise<{ stdout: string }>
const read: GitRead = (args, cwd) => execute('git', args, {
  cwd, encoding: 'utf8', timeout: 5000, maxBuffer: 1024 * 1024, windowsHide: true
})

function indexSharingFailure(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const failure = error as { code?: unknown; stderr?: unknown }
  return failure.code === 128 && typeof failure.stderr === 'string'
    && /\.git[\\/]index\b[^\r\n]*permission denied/i.test(failure.stderr)
}

/** Inspect without refreshing Git's index. Windows sharing failures may briefly
 * prevent an index read; retry that read only, without changing permissions.
 */
export async function readPortfolioReleaseGit(
  root: string,
  args: string[],
  run: GitRead = read,
  wait: (milliseconds: number) => Promise<unknown> = setTimeout
): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      return (await run(['--no-optional-locks', ...args], root)).stdout
    } catch (error) {
      if (attempt >= 2 || !indexSharingFailure(error)) throw error
      await wait(50 * (attempt + 1))
    }
  }
}
