import { describe, expect, it, vi } from 'vitest'
import { CodexAppServerClient } from '../electron/main/codex-app-server-client'

type ClientInternals = {
  pending: Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>
  handleLine: (line: string) => void
}

describe('CodexAppServerClient JSON-RPC routing', () => {
  it('never mistakes a server callback ID for a client response ID', () => {
    const client = new CodexAppServerClient()
    const internals = client as unknown as ClientInternals
    const resolve = vi.fn()
    const reject = vi.fn()
    const notifications: string[] = []
    internals.pending.set(7, { resolve, reject })
    client.onNotification((notification) => notifications.push(notification.method))

    internals.handleLine(JSON.stringify({
      id: 7,
      method: 'item/tool/call',
      params: { threadId: 'teacher-thread', turnId: 'teacher-turn' }
    }))

    expect(resolve).not.toHaveBeenCalled()
    expect(reject).not.toHaveBeenCalled()
    expect(internals.pending.has(7)).toBe(true)
    expect(notifications).toEqual(['item/tool/call'])

    internals.handleLine(JSON.stringify({ id: 7, result: { ok: true } }))
    expect(resolve).toHaveBeenCalledWith({ ok: true })
    expect(internals.pending.has(7)).toBe(false)
  })
})
