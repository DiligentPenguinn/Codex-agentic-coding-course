import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parsePracticeGuideDefinition, PracticeGuideDefinitionRepository } from '../electron/main/practice-guide-definition-repository'

const directories: string[] = []
const valid = {
  schemaVersion: 1, guideId: 'm1-practice-mode-first-run', version: '1.0.0',
  eligiblePractice: { practiceId: 'm1-codex-safe-setup', minimumVersion: '2.0.0', maximumVersion: '2.0.0' },
  replayPolicy: 'once-per-course-run',
  stages: [{ id: 'intro', presentation: 'intro-dialog', advancement: 'continue', title: 'Làm quen với Practice Mode', body: 'Nội dung ngắn.', primaryLabel: 'Bắt đầu', secondaryLabel: 'Bỏ qua' }]
}

afterEach(async () => Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))))

describe('PracticeGuideDefinitionRepository', () => {
  it('parses and loads a strict guide definition', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'practice-guides-'))
    directories.push(directory)
    await writeFile(join(directory, 'm1-practice-mode-first-run.json'), JSON.stringify(valid), 'utf8')
    const result = await new PracticeGuideDefinitionRepository(directory).load('m1-practice-mode-first-run')
    expect(result.stages[0]?.title).toBe('Làm quen với Practice Mode')
  })

  it.each([
    [{ ...valid, unexpected: true }, 'shape'],
    [{ ...valid, replayPolicy: 'always' }, 'replay'],
    [{ ...valid, stages: [] }, 'stages'],
    [{ ...valid, stages: [valid.stages[0], valid.stages[0]] }, 'Duplicate'],
    [{ ...valid, stages: [{ ...valid.stages[0], presentation: 'coach-mark' }] }, 'anchor'],
    [{ ...valid, stages: [{ ...valid.stages[0], anchor: 'teacher-tab' }] }, 'anchor'],
    [{ ...valid, stages: [{ ...valid.stages[0], title: '   ' }] }, 'copy'],
    [{ ...valid, stages: [{ ...valid.stages[0], advancement: 'unknown' }] }, 'advancement']
  ])('rejects invalid content', (input, message) => {
    expect(() => parsePracticeGuideDefinition(input)).toThrow(message)
  })
})
