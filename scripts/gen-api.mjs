// Regenerates src/api/schema.d.ts from a Stream Security instance's OpenAPI spec.
//   STREAM_URL=https://<tenant>.streamsec.io STREAM_TOKEN=<access token> pnpm gen:api
//   pnpm gen:api --file ./openapi.json
import { readFile, writeFile } from 'node:fs/promises'
import openapiTS, { astToString } from 'openapi-typescript'

async function loadSpec() {
  const fileFlag = process.argv.indexOf('--file')
  if (fileFlag !== -1) {
    return JSON.parse(await readFile(process.argv[fileFlag + 1], 'utf8'))
  }
  const { STREAM_URL, STREAM_TOKEN } = process.env
  if (!STREAM_URL || !STREAM_TOKEN) {
    throw new Error('Set STREAM_URL and STREAM_TOKEN, or pass --file <spec.json>')
  }
  const response = await fetch(`${STREAM_URL}/docs/json`, {
    headers: { authorization: `Bearer ${STREAM_TOKEN}` },
  })
  if (!response.ok) throw new Error(`GET /docs/json: HTTP ${response.status}`)
  return response.json()
}

const ast = await openapiTS(await loadSpec())
await writeFile(
  new URL('../src/api/schema.d.ts', import.meta.url),
  astToString(ast),
)
console.log('Wrote src/api/schema.d.ts')
