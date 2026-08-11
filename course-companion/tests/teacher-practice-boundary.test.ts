import { describe, expect, it, vi } from 'vitest'
import type { TeacherConversation, TeacherMessage } from '../shared/contracts'
import { conversationForRun, TeacherService } from '../electron/main/teacher-service'

const timestamp = '2026-08-09T00:00:00.000Z'

function message(id: string, practiceRunId?: string): TeacherMessage {
  return {
    id,
    role: 'teacher',
    source: 'live',
    content: id,
    timestamp,
    ...(practiceRunId ? { practiceRunId } : {})
  }
}

describe('Teacher Practice boundaries', () => {
  it('shows only the active run while retaining the append-only archive', () => {
    const conversation: TeacherConversation = {
      messages: [message('course'), message('old', 'run-old'), message('current', 'run-current')],
      recovered: false
    }

    expect(conversationForRun(conversation, 'run-current').messages.map(({ id }) => id)).toEqual(['current'])
    expect(conversationForRun(conversation, null).messages.map(({ id }) => id)).toEqual(['course'])
    expect(conversation.messages.map(({ id }) => id)).toEqual(['course', 'old', 'current'])
  })

  it('resets only the response transport once per newly activated run', async () => {
    const responseReset = vi.fn(async () => undefined)
    const summaryReset = vi.fn(async () => undefined)
    const unused = {} as never
    const service = new TeacherService(
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      { resetTransport: summaryReset } as never,
      { resetTransport: responseReset } as never,
      true
    )

    await service.activatePracticeRun('run-one')
    await service.activatePracticeRun('run-one')
    await service.activatePracticeRun('run-two')

    expect(responseReset).toHaveBeenCalledTimes(2)
    expect(summaryReset).not.toHaveBeenCalled()
  })
})
