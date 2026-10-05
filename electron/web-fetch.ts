import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'

const TIMEOUT_MS = 20_000
const MAX_BYTES = 2_000_000
const MAX_CHARS = 20_000
const MAX_REDIRECTS = 5

// The model can be steered by what it reads, so it never reaches the user's
// own machine or network: only public addresses.
const PRIVATE = new BlockList()
for (const [net, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 3],
] as const) {
  PRIVATE.addSubnet(net, prefix, 'ipv4')
}
for (const [net, prefix] of [
  ['::', 127],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  PRIVATE.addSubnet(net, prefix, 'ipv6')
}

function isPrivate(address: string): boolean {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address)?.[1]
  if (mapped) return PRIVATE.check(mapped, 'ipv4')
  return PRIVATE.check(address, isIP(address) === 6 ? 'ipv6' : 'ipv4')
}

async function assertPublic(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https URLs can be fetched.')
  }
  const host = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = isIP(host)
    ? [host]
    : (await lookup(host, { all: true })).map(a => a.address)
  if (addresses.some(isPrivate)) {
    throw new Error(`${url.hostname} is a private address, which can't be fetched.`)
  }
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] !== '#') return ENTITIES[code.toLowerCase()] ?? match
    const point = code[1].toLowerCase() === 'x'
      ? parseInt(code.slice(2), 16)
      : parseInt(code.slice(1), 10)
    return Number.isFinite(point) && point <= 0x10ffff
      ? String.fromCodePoint(point)
      : match
  })
}

function htmlToText(html: string): { title?: string; text: string } {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]
  const text = html
    .replace(/<(script|style|noscript|svg|template|head)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(
      /<br\s*\/?>|<\/(p|div|section|article|main|h[1-6]|li|tr|pre|blockquote|table|ul|ol)>/gi,
      '\n',
    )
    .replace(/<[^>]+>/g, ' ')
  return {
    title: title && decodeEntities(title).trim(),
    text: decodeEntities(text)
      .replace(/[^\S\n]+/g, ' ')
      .replace(/ *\n[\s]*/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  }
}

async function readCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    size += value.byteLength
  }
  void reader.cancel()
  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, MAX_BYTES))
}

/** GETs a public page and returns its readable text. */
export async function webFetch(target: string, signal: AbortSignal) {
  let url = new URL(target)
  let response: Response | undefined
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url)
    response = await fetch(url, {
      redirect: 'manual',
      headers: { 'user-agent': 'Agent Desktop', accept: 'text/html, text/plain, application/json;q=0.9, */*;q=0.5' },
      signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
    })
    const location = response.headers.get('location')
    if (response.status < 300 || response.status >= 400 || !location) break
    url = new URL(location, url)
    response = undefined
  }
  if (!response) throw new Error(`More than ${MAX_REDIRECTS} redirects.`)

  const contentType = response.headers.get('content-type') ?? ''
  if (!/^(text\/|application\/(json|xml|rss\+xml|atom\+xml|xhtml\+xml))/i.test(contentType)) {
    void response.body?.cancel()
    throw new Error(`Can't read content of type ${contentType || 'unknown'}.`)
  }
  const raw = await readCapped(response)
  const { title, text } = /html/i.test(contentType)
    ? htmlToText(raw)
    : { title: undefined, text: raw }
  return {
    url: url.href,
    status: response.status,
    contentType,
    title,
    text: text.slice(0, MAX_CHARS),
    truncated: text.length > MAX_CHARS,
  }
}
