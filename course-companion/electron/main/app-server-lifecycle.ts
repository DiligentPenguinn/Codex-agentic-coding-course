export class AppServerLifecycle {
  private started: Promise<void> | null = null
  private releasing: Promise<void> | null = null
  private handingOff: Promise<void> | null = null

  constructor(
    private readonly startTransport: () => Promise<void>,
    private readonly stopTransport: () => Promise<void>
  ) {}

  async ensure(): Promise<void> {
    if (this.handingOff) await this.handingOff
    if (this.releasing) await this.releasing
    if (!this.started) {
      const starting: Promise<void> = this.startTransport().catch((error: unknown) => {
        if (this.started === starting) this.started = null
        throw error
      })
      this.started = starting
    }
    await this.started
  }

  async handoff(openTarget: () => Promise<void>): Promise<void> {
    const previous = this.handingOff
    const operation = (async () => {
      if (previous) await previous
      await this.release()
      await openTarget()
    })()
    const handoff: Promise<void> = operation.finally(() => {
      if (this.handingOff === handoff) this.handingOff = null
    })
    this.handingOff = handoff
    await handoff
  }

  async release(): Promise<void> {
    if (!this.releasing) {
      const operation = (async () => {
        const starting = this.started
        if (starting) await starting.catch(() => undefined)
        this.started = null
        await this.stopTransport()
      })()
      const release: Promise<void> = operation.finally(() => {
        if (this.releasing === release) this.releasing = null
      })
      this.releasing = release
    }
    await this.releasing
  }

  markDisconnected(): void {
    this.started = null
  }
}
