import { describe, expect, it } from 'vitest'
import { AppServerLifecycle } from '../electron/main/app-server-lifecycle'

describe('AppServerLifecycle', () => {
  it('releases every restarted transport instead of retaining a resolved release', async () => {
    const events: string[] = []
    const lifecycle = new AppServerLifecycle(
      async () => { events.push('start') },
      async () => { events.push('stop') }
    )

    await lifecycle.ensure()
    await lifecycle.release()
    await lifecycle.ensure()
    await lifecycle.release()

    expect(events).toEqual(['start', 'stop', 'start', 'stop'])
  })

  it('serializes concurrent ensure calls behind an active release', async () => {
    const events: string[] = []
    let finishStop: (() => void) | undefined
    let markStopStarted: (() => void) | undefined
    const stopStarted = new Promise<void>((resolve) => { markStopStarted = resolve })
    const lifecycle = new AppServerLifecycle(
      async () => { events.push('start') },
      () => new Promise<void>((resolve) => {
        events.push('stop')
        finishStop = resolve
        markStopStarted?.()
      })
    )

    await lifecycle.ensure()
    const releasing = lifecycle.release()
    const ensuring = lifecycle.ensure()
    await stopStarted
    expect(events).toEqual(['start', 'stop'])
    finishStop?.()
    await Promise.all([releasing, ensuring])
    expect(events).toEqual(['start', 'stop', 'start'])
  })

  it('does not allow a reconnect between release and deep-link handoff', async () => {
    const events: string[] = []
    let finishOpen: (() => void) | undefined
    const lifecycle = new AppServerLifecycle(
      async () => { events.push('start') },
      async () => { events.push('stop') }
    )
    await lifecycle.ensure()
    const handoff = lifecycle.handoff(() => new Promise<void>((resolve) => {
      events.push('open')
      finishOpen = resolve
    }))
    while (!finishOpen) await Promise.resolve()
    const reconnect = lifecycle.ensure()
    await Promise.resolve()
    expect(events).toEqual(['start', 'stop', 'open'])
    finishOpen()
    await Promise.all([handoff, reconnect])
    expect(events).toEqual(['start', 'stop', 'open', 'start'])
  })
})
