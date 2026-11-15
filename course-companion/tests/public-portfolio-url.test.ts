import { EventEmitter } from 'node:events'
import { request as httpsRequest } from 'node:https'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PublicPortfolioUrlVerifier, type PublicPortfolioAddress, type PublicPortfolioResponse } from '../electron/main/public-portfolio-url'

vi.mock('node:https', () => ({ request: vi.fn() }))

const address = { address: '93.184.216.34', family: 4 as const }
const now = () => new Date('2026-10-22T02:00:00.000Z')
const html = (body = '<title>Mai &amp; portfolio</title><main>My work</main>'): PublicPortfolioResponse => ({
  status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, body: Buffer.from(body)
})
const redirect = (location: string): PublicPortfolioResponse => ({ status: 302, headers: { location }, body: Buffer.alloc(0) })
function harness(responses: PublicPortfolioResponse[] = [html()]) {
  const lookup = vi.fn(async () => [address])
  const request = vi.fn<(url: URL, address: PublicPortfolioAddress, limits: { timeoutMs: number; maxBytes: number }) => Promise<PublicPortfolioResponse>>(async () => responses.shift() ?? html())
  return { lookup, request, verifier: new PublicPortfolioUrlVerifier({ lookup, request, now }) }
}

afterEach(() => { vi.clearAllMocks(); vi.useRealTimers() })

describe('PublicPortfolioUrlVerifier', () => {
  it('reads bounded public text with scripts/styles removed and preserves the observed URL', async () => {
    const { verifier, request } = harness([html('<title>Mai &amp; portfolio</title><style>secret-style</style><script>secret-script</script><main>Work &#x1f44b;</main>')])
    expect(await verifier.verify('https://portfolio.vercel.app/')).toEqual({
      url: 'https://portfolio.vercel.app/', finalUrl: 'https://portfolio.vercel.app/', reachable: true,
      status: 200, checkedAt: now().toISOString(), title: 'Mai & portfolio', textExcerpt: 'Mai & portfolio Work 👋'
    })
    expect(request.mock.calls[0]?.[1]).toEqual(address)
    expect(request.mock.calls[0]?.[2]).toMatchObject({ maxBytes: 256 * 1024 })
  })

  it.each([
    'http://portfolio.vercel.app', 'https://user:secret@portfolio.vercel.app',
    'https://portfolio.vercel.app?token=secret', 'https://portfolio.vercel.app?',
    'https://portfolio.vercel.app:444', 'https://portfolio.vercel.app/#secret',
    'https://localhost', 'https://foo.localhost', 'https://intranet', 'https://foo.local',
    'https://foo.internal', 'https://foo.test', 'https://foo.invalid', 'not a url'
  ])('rejects unsafe URL before any network access: %s', async (url) => {
    const { verifier, lookup, request } = harness()
    const result = await verifier.verify(url)
    expect(result.reachable).toBe(false)
    expect(result.url).toBe('')
    expect(JSON.stringify(result)).not.toContain('secret')
    expect(lookup).not.toHaveBeenCalled()
    expect(request).not.toHaveBeenCalled()
  })

  it.each([
    '0.0.0.0', '10.0.0.1', '100.64.0.1', '127.0.0.1', '169.254.169.254', '172.16.1.1', '172.31.255.255',
    '192.0.0.1', '192.0.2.1', '192.88.99.1', '192.168.1.1', '198.18.0.1', '198.19.1.1', '198.51.100.1',
    '203.0.113.1', '224.0.0.1', '255.255.255.255', '::', '::1', '::ffff:127.0.0.1', '::ffff:7f00:1',
    'fc00::1', 'fd00::1', 'fe80::1', 'ff02::1', '64:ff9b::7f00:1', '2001::1', '2001:db8::1', '2002:7f00:1::', '3fff::1'
  ])('rejects non-public literal and resolved addresses: %s', async (ip) => {
    const family = ip.includes(':') ? 6 as const : 4 as const
    const request = vi.fn(async () => html())
    const lookup = vi.fn(async () => [{ address: ip, family }])
    const verifier = new PublicPortfolioUrlVerifier({ lookup, request, now })
    expect((await verifier.verify(`https://${family === 6 ? `[${ip}]` : ip}/`)).reachable).toBe(false)
    expect((await verifier.verify('https://portfolio.example.com')).error).toBe('non-public-destination')
    expect(request).not.toHaveBeenCalled()
  })

  it.each(['93.184.216.34', '8.8.8.8', '2001:4860:4860::8888', '2606:4700:4700::1111'])('permits public addresses: %s', async (ip) => {
    const { request } = harness()
    const verifier = new PublicPortfolioUrlVerifier({ lookup: async () => [{ address: ip, family: ip.includes(':') ? 6 : 4 }], request, now })
    expect((await verifier.verify('https://www.my-portfolio.com')).reachable).toBe(true)
  })

  it('rejects mixed public/private DNS answers rather than using whichever address wins', async () => {
    const { request } = harness()
    const verifier = new PublicPortfolioUrlVerifier({ lookup: async () => [address, { address: '127.0.0.1', family: 4 }], request, now })
    expect((await verifier.verify('https://portfolio.vercel.app')).error).toBe('non-public-destination')
    expect(request).not.toHaveBeenCalled()
  })

  it('rechecks redirect DNS and never contacts a private redirect destination', async () => {
    const { request } = harness([redirect('https://private.example.com')])
    const lookup = vi.fn(async (hostname: string) => hostname.startsWith('private') ? [{ address: '10.0.0.1', family: 4 as const }] : [address])
    const verifier = new PublicPortfolioUrlVerifier({ lookup, request, now })
    const result = await verifier.verify('https://portfolio.vercel.app')
    expect(result).toMatchObject({ reachable: false, error: 'non-public-destination', finalUrl: 'https://portfolio.vercel.app/' })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it.each(['http://example.com', 'https://127.0.0.1', 'https://foo:secret@example.com', '/?token=secret', '/login', 'https://vercel.com/sso-api'])('rejects an unsafe or protected redirect: %s', async (location) => {
    const { verifier, request } = harness([redirect(location)])
    expect((await verifier.verify('https://portfolio.vercel.app')).reachable).toBe(false)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('follows relative and public cross-domain redirects without cookies', async () => {
    const { verifier, lookup, request } = harness([redirect('/work'), redirect('https://mai.com'), html()])
    expect(await verifier.verify('https://portfolio.vercel.app')).toMatchObject({ reachable: true, finalUrl: 'https://mai.com/' })
    expect(lookup).toHaveBeenCalledTimes(3)
    expect(request).toHaveBeenCalledTimes(3)
  })

  it('bounds redirects and detects loops', async () => {
    const excessive = harness(Array.from({ length: 5 }, (_, i) => redirect(`/step-${i}`)))
    expect((await excessive.verifier.verify('https://mai.com')).error).toBe('too-many-redirects')
    expect(excessive.request).toHaveBeenCalledTimes(5)
    const loop = harness([redirect('/')])
    expect((await loop.verifier.verify('https://mai.com')).error).toBe('redirect-loop')
  })

  it.each([
    { ...html(), status: 401 }, { ...html(), status: 403 }, { ...html(), status: 404 },
    { ...html(), status: 500 }, { ...html(), status: 204, body: Buffer.alloc(0) },
    { ...html(), headers: { 'content-type': 'application/json' } },
    { ...html(), headers: { 'content-type': 'text/html', 'content-encoding': 'gzip' } },
    html('<title>Login</title><p>Please authenticate</p>'), html('<title>Work</title><input type="password">')
  ])('does not pass unsupported, empty, failed or protected content (%j)', async (response) => {
    expect((await harness([response]).verifier.verify('https://mai.com')).reachable).toBe(false)
  })

  it('accepts plain text and caps excerpts', async () => {
    const { verifier } = harness([{ status: 200, headers: { 'content-type': 'text/plain' }, body: Buffer.from('work '.repeat(2000)) }])
    const result = await verifier.verify('https://mai.com')
    expect(result.reachable).toBe(true)
    expect(result.textExcerpt).toHaveLength(4000)
  })

  it('drops unclosed script/comment bodies and handles repeated malformed markup within bounds', async () => {
    expect((await harness([html('<p>Work</p><script>private-script')]).verifier.verify('https://mai.com')).textExcerpt).toBe('Work')
    expect((await harness([html('<p>Work</p><!--private-comment')]).verifier.verify('https://mai.com')).textExcerpt).toBe('Work')
    const result = await harness([html(`<p>Work</p>${'<'.repeat(200_000)}`)]).verifier.verify('https://mai.com')
    expect(result.reachable).toBe(true)
    expect(result.textExcerpt?.length).toBeLessThanOrEqual(4000)
  })

  it('enforces a cumulative body limit across redirects', async () => {
    const { verifier } = harness([{ ...redirect('/work'), body: Buffer.alloc(200_000) }, { ...html(), body: Buffer.alloc(100_000) }])
    expect((await verifier.verify('https://mai.com')).error).toBe('response-too-large')
  })

  it('returns retryable sanitized DNS/network failure observations', async () => {
    const verifier = new PublicPortfolioUrlVerifier({ lookup: async () => { throw new Error('credentials=secret') }, now })
    const result = await verifier.verify('https://mai.com')
    expect(result).toMatchObject({ reachable: false, error: 'network-unavailable', status: null, finalUrl: null })
    expect(JSON.stringify(result)).not.toContain('secret')
  })

  it('bounds stalled DNS and request operations', async () => {
    vi.useFakeTimers()
    const stalledLookup = new PublicPortfolioUrlVerifier({ lookup: () => new Promise(() => {}), now })
    const dnsResult = stalledLookup.verify('https://mai.com')
    await vi.advanceTimersByTimeAsync(10_000)
    expect((await dnsResult).error).toBe('network-timeout')
    const stalledRequest = new PublicPortfolioUrlVerifier({ lookup: async () => [address], request: () => new Promise(() => {}), now })
    const requestResult = stalledRequest.verify('https://mai.com')
    await vi.advanceTimersByTimeAsync(10_000)
    expect((await requestResult).error).toBe('network-timeout')
  })

  it('pins the real HTTPS transport to validated DNS while retaining Host and TLS identity', async () => {
    const req = Object.assign(new EventEmitter(), { end: vi.fn(), destroy: vi.fn() })
    const response = Object.assign(new EventEmitter(), { statusCode: 200, headers: { 'content-type': 'text/html' } })
    vi.mocked(httpsRequest).mockImplementationOnce(((_url: URL, _options: unknown, callback: (response: unknown) => void) => {
      req.end.mockImplementation(() => {
        callback(response)
        response.emit('data', Buffer.from('<title>Work</title>Portfolio'))
        response.emit('end')
        req.emit('close')
      })
      return req
    }) as unknown as typeof httpsRequest)
    const verifier = new PublicPortfolioUrlVerifier({ lookup: async () => [address], now })
    expect((await verifier.verify('https://mai.com/work')).reachable).toBe(true)
    const [url, options] = vi.mocked(httpsRequest).mock.calls[0] as unknown as [URL, {
      servername: string; autoSelectFamily: boolean; agent: boolean; headers: Record<string, string>;
      lookup: (hostname: string, options: object, callback: (...args: unknown[]) => void) => void
    }]
    expect(url.hostname).toBe('mai.com')
    expect(options).toMatchObject({ servername: 'mai.com', autoSelectFamily: false, agent: false })
    expect(Object.keys(options.headers).map((key) => key.toLowerCase())).not.toContain('cookie')
    const callback = vi.fn()
    options.lookup('mai.com', {}, callback)
    expect(callback).toHaveBeenCalledWith(null, '93.184.216.34', 4)
  })

  it('aborts the real HTTPS transport when streaming exceeds the body limit', async () => {
    const req = Object.assign(new EventEmitter(), { end: vi.fn(), destroy: vi.fn() })
    const response = Object.assign(new EventEmitter(), { statusCode: 200, headers: { 'content-type': 'text/html' }, destroy: vi.fn() })
    req.destroy.mockImplementation((error) => { req.emit('error', error); req.emit('close') })
    response.destroy.mockImplementation((error) => { response.emit('error', error) })
    vi.mocked(httpsRequest).mockImplementationOnce(((_url: URL, _options: unknown, callback: (response: unknown) => void) => {
      req.end.mockImplementation(() => { callback(response); response.emit('data', Buffer.alloc(256 * 1024 + 1)) })
      return req
    }) as unknown as typeof httpsRequest)
    const verifier = new PublicPortfolioUrlVerifier({ lookup: async () => [address], now })
    expect((await verifier.verify('https://mai.com')).error).toBe('response-too-large')
    expect(req.destroy).toHaveBeenCalled()
  })

  it('aborts the real HTTPS transport after the overall deadline', async () => {
    vi.useFakeTimers()
    const req = Object.assign(new EventEmitter(), { end: vi.fn(), destroy: vi.fn() })
    req.destroy.mockImplementation((error) => { req.emit('error', error); req.emit('close') })
    vi.mocked(httpsRequest).mockReturnValueOnce(req as unknown as ReturnType<typeof httpsRequest>)
    const verifier = new PublicPortfolioUrlVerifier({ lookup: async () => [address], now })
    const result = verifier.verify('https://mai.com')
    await vi.advanceTimersByTimeAsync(10_000)
    expect((await result).error).toBe('network-timeout')
    expect(req.destroy).toHaveBeenCalled()
  })
})
