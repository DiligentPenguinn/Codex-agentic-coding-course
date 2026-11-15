import { lookup } from 'node:dns/promises'
import { request, type RequestOptions } from 'node:https'
import { isIP } from 'node:net'

export interface PublicPortfolioObservation {
  url: string
  finalUrl: string | null
  reachable: boolean
  status: number | null
  checkedAt: string
  title?: string
  textExcerpt?: string
  error?: string
}

export interface PublicPortfolioAddress { address: string; family: 4 | 6 }
export interface PublicPortfolioResponse {
  status: number
  headers: Record<string, string | undefined>
  body: Buffer
}
interface RequestLimits { timeoutMs: number; maxBytes: number }
interface Dependencies {
  lookup?: (hostname: string) => Promise<PublicPortfolioAddress[]>
  request?: (url: URL, address: PublicPortfolioAddress, limits: RequestLimits) => Promise<PublicPortfolioResponse>
  now?: () => Date
}

const MAX_BYTES = 256 * 1024
const TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 4
const REDIRECTS = new Set([301, 302, 303, 307, 308])

class VerificationFailure extends Error {}

function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a = 0, b = 0, c = 0] = address.split('.').map(Number)
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && ((b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99) || b === 168)) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113))
  }
  if (isIP(address) !== 6) return false
  // Only global unicast is eligible. This also rejects mapped IPv4, NAT64,
  // unspecified, loopback, unique-local, link-local and multicast forms.
  const [first = 0, second = 0] = address.split(':').slice(0, 2).map((part) => parseInt(part || '0', 16))
  return first >= 0x2000 && first <= 0x3fff &&
    !(first === 0x2001 && (second < 0x200 || second === 0xdb8)) &&
    first !== 0x2002 && !(first === 0x3fff && second <= 0xfff)
}

function safeUrl(input: string): URL {
  if (input.length > 2048) throw new VerificationFailure('invalid-public-url')
  let url: URL
  try { url = new URL(input) } catch { throw new VerificationFailure('invalid-public-url') }
  if (url.protocol !== 'https:' || url.username || url.password || url.href.includes('?') || url.hash ||
    (url.port && url.port !== '443')) throw new VerificationFailure('invalid-public-url')
  const hostname = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase()
  if (!hostname || (!isIP(hostname) && (!hostname.includes('.') ||
    /(?:^|\.)(?:localhost|local|internal|home|lan|test|invalid|example)$/.test(hostname)))) {
    throw new VerificationFailure('non-public-destination')
  }
  if (isIP(hostname) && !isPublicAddress(hostname)) throw new VerificationFailure('non-public-destination')
  if (/(?:^|\/)(?:login|log-in|signin|sign-in|auth|oauth|sso|sso-api)(?:\/|$)/i.test(url.pathname)) {
    throw new VerificationFailure('authentication-required')
  }
  return url
}

function bounded<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new VerificationFailure('network-timeout')), timeoutMs)
    operation.then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

// Keep the original hostname for Host and certificate validation, while the
// socket can connect only to the exact address already checked above.
function pinnedRequest(url: URL, address: PublicPortfolioAddress, limits: RequestLimits): Promise<PublicPortfolioResponse> {
  return new Promise((resolve, reject) => {
    const options: RequestOptions & { autoSelectFamily: boolean } = {
      method: 'GET',
      agent: false,
      family: address.family,
      autoSelectFamily: false,
      servername: isIP(url.hostname.replace(/^\[|\]$/g, '')) ? undefined : url.hostname,
      headers: { Accept: 'text/html, text/plain;q=0.9', 'Accept-Encoding': 'identity', 'User-Agent': 'CourseCompanion-PublicPortfolioCheck/1' },
      lookup: (_hostname, _options, callback) => callback(null, address.address, address.family)
    }
    const req = request(url, options, (response) => {
      const chunks: Buffer[] = []
      let size = 0
      response.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > limits.maxBytes) {
          response.destroy(new VerificationFailure('response-too-large'))
          req.destroy(new VerificationFailure('response-too-large'))
        } else chunks.push(chunk)
      })
      response.on('error', reject)
      response.on('end', () => resolve({
        status: response.statusCode ?? 0,
        headers: {
          'content-type': response.headers['content-type'],
          'content-encoding': response.headers['content-encoding'],
          location: response.headers.location
        },
        body: Buffer.concat(chunks)
      }))
    })
    const timer = setTimeout(() => req.destroy(new VerificationFailure('network-timeout')), limits.timeoutMs)
    req.on('close', () => clearTimeout(timer))
    req.on('error', reject)
    req.end()
  })
}

function plainText(html: string): string {
  return html.replace(/<!--[\s\S]*?(?:-->|$)/g, ' ')
    .replace(/<(script|style|noscript|template)\b[^<>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, ' ')
    .replace(/<[^<>]*>/g, ' ')
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[\da-f]+|\d+);/gi, (entity) => {
      const named: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' }
      if (named[entity.toLowerCase()]) return named[entity.toLowerCase()]!
      const code = entity.slice(2, -1)
      const point = code[0]?.toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : parseInt(code, 10)
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : ' '
    }).replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim()
}

export class PublicPortfolioUrlVerifier {
  private readonly dependencies: Required<Dependencies>

  constructor(dependencies: Dependencies = {}) {
    this.dependencies = {
      lookup: dependencies.lookup ?? (async (hostname) => (await lookup(hostname, { all: true, verbatim: true }))
        .map(({ address, family }) => ({ address, family: family as 4 | 6 }))),
      request: dependencies.request ?? pinnedRequest,
      now: dependencies.now ?? (() => new Date())
    }
  }

  async verify(input: string): Promise<PublicPortfolioObservation> {
    const observation: PublicPortfolioObservation = {
      // Invalid inputs may contain credentials: never echo them into evidence.
      url: '', finalUrl: null, reachable: false, status: null, checkedAt: this.dependencies.now().toISOString()
    }
    const started = Date.now()
    let bytesRemaining = MAX_BYTES
    try {
      let url = safeUrl(input)
      observation.url = url.href
      const visited = new Set<string>()
      for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
        const remaining = () => {
          const time = TIMEOUT_MS - (Date.now() - started)
          if (time <= 0) throw new VerificationFailure('network-timeout')
          return time
        }
        if (visited.has(url.href)) throw new VerificationFailure('redirect-loop')
        visited.add(url.href)
        const hostname = url.hostname.replace(/^\[|\]$/g, '')
        const literalFamily = isIP(hostname)
        const addresses = literalFamily ? [{ address: hostname, family: literalFamily as 4 | 6 }] :
          await bounded(this.dependencies.lookup(hostname), remaining())
        if (!addresses.length || addresses.length > 16 || addresses.some(({ address, family }) =>
          isIP(address) !== family || !isPublicAddress(address))) throw new VerificationFailure('non-public-destination')
        const response = await bounded(this.dependencies.request(url, addresses[0]!, {
          timeoutMs: remaining(), maxBytes: bytesRemaining
        }), remaining())
        bytesRemaining -= response.body.byteLength
        if (bytesRemaining < 0) throw new VerificationFailure('response-too-large')
        observation.status = response.status
        observation.finalUrl = url.href
        if (REDIRECTS.has(response.status)) {
          if (redirects === MAX_REDIRECTS) throw new VerificationFailure('too-many-redirects')
          if (!response.headers.location) throw new VerificationFailure('invalid-redirect')
          let next: string
          try { next = new URL(response.headers.location, url).href } catch { throw new VerificationFailure('invalid-redirect') }
          url = safeUrl(next)
          continue
        }
        if (response.status === 401 || response.status === 403) throw new VerificationFailure('authentication-required')
        if (response.status < 200 || response.status >= 300) throw new VerificationFailure('http-unavailable')
        if (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity') {
          throw new VerificationFailure('unsupported-content-encoding')
        }
        const contentType = response.headers['content-type']?.split(';')[0]?.trim().toLowerCase()
        if (contentType !== 'text/html' && contentType !== 'text/plain') throw new VerificationFailure('unsupported-content-type')
        const content = response.body.toString('utf8')
        const title = contentType === 'text/html' ? plainText(content.match(/<title\b[^<>]*>([^<]*)<\/title\s*>/i)?.[1] ?? '').slice(0, 200) : ''
        if (/\b(?:log\s*in|sign\s*in|authentication required|vercel authentication|access denied)\b/i.test(title) ||
          (contentType === 'text/html' && /<input\b[^<>]*\btype\s*=\s*["']?password\b/i.test(content))) {
          throw new VerificationFailure('authentication-required')
        }
        const excerpt = plainText(content).slice(0, 4000)
        if (!excerpt) throw new VerificationFailure('empty-response')
        if (title) observation.title = title
        observation.textExcerpt = excerpt
        observation.reachable = true
        return observation
      }
    } catch (error) {
      observation.error = error instanceof VerificationFailure ? error.message : 'network-unavailable'
    }
    return observation
  }
}
