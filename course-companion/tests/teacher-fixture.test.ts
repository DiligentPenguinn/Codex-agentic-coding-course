import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  FixtureTeacherAdapter,
  TeacherChatRepository
} from '../electron/main/teacher-fixture'

const temporaryDirectories: string[] = []

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'course-companion-teacher-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

describe('FixtureTeacherAdapter', () => {
  it('persists a learner message and an honestly sourced fixture reply', async () => {
    const directory = await temporaryDirectory()
    const repository = new TeacherChatRepository(directory)
    const ids = ['learner-id', 'teacher-id']
    const adapter = new FixtureTeacherAdapter(
      repository,
      () => new Date('2026-08-06T12:00:00.000Z'),
      () => ids.shift() ?? 'fallback-id'
    )

    const result = await adapter.sendMessage({
      content: '  Tôi cần kiểm tra gì trước khi duyệt?  ',
      context: {
        lessonId: 'module-1',
        checkpointId: 'm1-plan-approval',
        sceneId: 'module-1-success'
      }
    })

    expect(result.learnerMessage).toMatchObject({
      id: 'learner-id',
      role: 'learner',
      source: 'learner',
      content: 'Tôi cần kiểm tra gì trước khi duyệt?'
    })
    expect(result.teacherMessage).toMatchObject({
      id: 'teacher-id',
      role: 'teacher',
      source: 'fixture',
      checkpointId: 'm1-plan-approval'
    })
    expect(result.teacherMessage.content).toContain('bốn điểm')
    await expect(adapter.loadConversation()).resolves.toEqual({
      messages: [result.learnerMessage, result.teacherMessage],
      recovered: false
    })
  })

  it('persists companion mode independently from the chat messages', async () => {
    const repository = new TeacherChatRepository(await temporaryDirectory())
    await expect(repository.loadMode()).resolves.toBe('compact')
    await repository.saveMode('expanded')
    await expect(repository.loadMode()).resolves.toBe('expanded')
  })

  it('keeps valid history while flagging a malformed JSONL line', async () => {
    const directory = await temporaryDirectory()
    const repository = new TeacherChatRepository(directory)
    const adapter = new FixtureTeacherAdapter(repository)
    const result = await adapter.sendMessage({ content: 'Một câu hỏi hợp lệ' })
    await writeFile(
      join(directory, 'teacher-chat.jsonl'),
      `${JSON.stringify(result.learnerMessage)}\n{damaged\n${JSON.stringify(result.teacherMessage)}\n`,
      'utf8'
    )

    await expect(repository.loadConversation()).resolves.toEqual({
      messages: [result.learnerMessage, result.teacherMessage],
      recovered: true
    })
  })

  it('clears chat and mode together on reset', async () => {
    const repository = new TeacherChatRepository(await temporaryDirectory())
    const adapter = new FixtureTeacherAdapter(repository)
    await adapter.sendMessage({ content: 'Tin nhắn sẽ bị xóa' })
    await repository.saveMode('expanded')
    await adapter.reset()

    await expect(repository.loadConversation()).resolves.toEqual({
      messages: [],
      recovered: false
    })
    await expect(repository.loadMode()).resolves.toBe('compact')
  })

  it('rejects empty messages before persistence', async () => {
    const adapter = new FixtureTeacherAdapter(
      new TeacherChatRepository(await temporaryDirectory())
    )
    await expect(adapter.sendMessage({ content: '   ' })).rejects.toThrow(
      'Invalid teacher message request'
    )
  })
})
