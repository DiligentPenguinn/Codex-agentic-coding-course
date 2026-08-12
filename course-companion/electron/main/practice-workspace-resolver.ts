import { realpath, stat } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import type { PracticeWorkspaceKind } from '../../shared/contracts'

function isContained(root: string, candidate: string): boolean {
  const pathFromRoot = relative(root, candidate)
  return pathFromRoot === '' ||
    (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== '..' && !isAbsolute(pathFromRoot))
}

export type PracticeWorkspaceResolverPort = {
  resolve: (kind: PracticeWorkspaceKind) => Promise<string>
}

export class PracticeWorkspaceResolver implements PracticeWorkspaceResolverPort {
  constructor(private readonly courseRoot: string) {}

  async resolve(kind: PracticeWorkspaceKind): Promise<string> {
    if (kind !== 'pilot-workspace') throw new Error('Unsupported Practice workspace kind')

    const configuredRoot = resolve(this.courseRoot)
    const canonicalRoot = await realpath(configuredRoot)
    if (!(await stat(canonicalRoot)).isDirectory()) {
      throw new Error('Course root is not a directory')
    }

    const candidate = join(canonicalRoot, 'pilot-workspace')
    const canonicalWorkspace = await realpath(candidate)
    if (!(await stat(canonicalWorkspace)).isDirectory() ||
      !isContained(canonicalRoot, canonicalWorkspace)) {
      throw new Error('Practice workspace escapes the validated course root')
    }

    return canonicalWorkspace
  }
}
