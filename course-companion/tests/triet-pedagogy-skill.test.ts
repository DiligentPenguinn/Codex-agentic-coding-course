import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const pilotRoot = resolve(process.cwd(), '..', 'pilot-workspace')

async function read(relativePath: string): Promise<string> {
  return readFile(resolve(pilotRoot, ...relativePath.split('/')), 'utf8')
}

describe('triet-pedagogy skill contract', () => {
  it('is discoverable and loaded by the course Teacher', async () => {
    const [skill, metadata, courseTeacher] = await Promise.all([
      read('.agents/skills/triet-pedagogy/SKILL.md'),
      read('.agents/skills/triet-pedagogy/agents/openai.yaml'),
      read('.agents/skills/course-teacher/SKILL.md')
    ])

    expect(skill).toContain('name: triet-pedagogy')
    expect(skill).toContain('open quiz')
    expect(skill).toContain('open mastery check')
    expect(skill).toContain('Do not jump to a later hint')
    expect(skill).toMatch(/Do not present, preview, ask, or answer a\s+later assessment item/)
    expect(skill).toContain('it does not change')
    expect(skill).toContain('authoritative state marks the assessment complete')
    expect(metadata).toContain('allow_implicit_invocation: true')
    expect(courseTeacher).toContain('`.agents/skills/triet-pedagogy/SKILL.md`')
    expect(courseTeacher).toContain('Follow `triet-pedagogy`')
  })

  it('protects answers while retaining safety, accessibility, and post-closure exceptions', async () => {
    const skill = await read('.agents/skills/triet-pedagogy/SKILL.md')

    expect(skill).toContain('do not reveal or confirm')
    expect(skill).toMatch(/safety-critical\s+misinformation/)
    expect(skill).toContain('genuine accessibility need')
    expect(skill).toContain('assessment complete')
    expect(skill).toMatch(/one focused\s+repair/)
    expect(skill).toMatch(/complete Vietnamese diacritics/)
  })
})
