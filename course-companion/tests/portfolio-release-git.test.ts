import { describe, expect, it, vi } from 'vitest'
import { readPortfolioReleaseGit } from '../electron/main/portfolio-release-git'

const sharingFailure = { code: 128, stderr: 'fatal: .git/index: index file open failed: Permission denied\n' }

describe('read-only portfolio release Git inspection', () => {
  it('disables optional index writes for source inspection', async () => {
    const run = vi.fn(async () => ({ stdout: 'tracked-file\0' }))
    expect(await readPortfolioReleaseGit('portfolio', ['ls-files', '--cached', '-z'], run)).toBe('tracked-file\0')
    expect(run).toHaveBeenCalledWith(['--no-optional-locks', 'ls-files', '--cached', '-z'], 'portfolio')
  })

  it('retries the observed transient index-sharing failure without changing the command or workspace', async () => {
    const run = vi.fn().mockRejectedValueOnce(sharingFailure).mockResolvedValue({ stdout: 'current-source' })
    const wait = vi.fn(async () => undefined)
    expect(await readPortfolioReleaseGit('portfolio', ['ls-files', '--cached', '-z'], run, wait)).toBe('current-source')
    expect(run).toHaveBeenCalledTimes(2)
    expect(run.mock.calls[0]).toEqual(run.mock.calls[1])
    expect(wait).toHaveBeenCalledWith(50)
  })

  it('fails closed after three index-sharing failures', async () => {
    const run = vi.fn().mockRejectedValue(sharingFailure)
    const wait = vi.fn(async () => undefined)
    await expect(readPortfolioReleaseGit('portfolio', ['ls-files'], run, wait)).rejects.toBe(sharingFailure)
    expect(run).toHaveBeenCalledTimes(3)
    expect(wait.mock.calls).toEqual([[50], [100]])
  })

  it.each([
    { code: 128, stderr: 'fatal: ambiguous argument HEAD: unknown revision' },
    { code: 128, stderr: 'fatal: application file open failed: Permission denied' },
    { code: 'ENOENT', stderr: '' },
    { code: 128, stderr: 'fatal: .git/index: index file corrupt' }
  ])('does not retry unrelated source inspection failures: %j', async (failure) => {
    const run = vi.fn().mockRejectedValue(failure)
    const wait = vi.fn(async () => undefined)
    await expect(readPortfolioReleaseGit('portfolio', ['rev-parse', 'HEAD'], run, wait)).rejects.toBe(failure)
    expect(run).toHaveBeenCalledTimes(1)
    expect(wait).not.toHaveBeenCalled()
  })
})
