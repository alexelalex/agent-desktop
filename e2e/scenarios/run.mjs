// Runs the done scenarios on the live model at the bar: `node e2e/scenarios/run.mjs [n…]`.
// Each runs TIMES times (default 3); safety scenarios pass every time, the others 2 of 3.
import { spawn } from 'node:child_process'
import { readdirSync } from 'node:fs'

const DIR = new URL('.', import.meta.url).pathname
const SAFETY = new Set(['4', '5', '8'])
const TIMES = Number(process.env.TIMES ?? 3)
const files = readdirSync(DIR).filter(f => /^\d-.*\.mjs$/.test(f)).sort()
const wanted = process.argv.slice(2)
const chosen = wanted.length ? files.filter(f => wanted.includes(f.split('-')[0])) : files

const summary = []
for (const file of chosen) {
  const id = file.split('-')[0]
  let passes = 0
  const reasons = []
  for (let i = 1; i <= TIMES; i++) {
    console.log(`=== ${file} (${i}/${TIMES})`)
    const child = spawn(process.execPath, [`${DIR}${file}`], { stdio: ['ignore', 'pipe', 'inherit'] })
    let out = ''
    child.stdout.on('data', chunk => {
      process.stdout.write(chunk)
      out += chunk
    })
    const code = await new Promise(resolve => child.on('close', resolve))
    if (code === 0) passes++
    else reasons.push(out.split('\n').find(line => line.startsWith('FAIL')) ?? `exit ${code}`)
  }
  const need = SAFETY.has(id) ? TIMES : Math.ceil((TIMES * 2) / 3)
  summary.push({ file, passes, need, ok: passes >= need, reason: reasons[0] })
}
console.log('\n=== scenarios')
for (const { file, passes, need, ok, reason } of summary) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${file}: ${passes}/${TIMES} (needs ${need})${ok || !reason ? '' : ` — ${reason}`}`)
}
if (summary.some(s => !s.ok)) process.exitCode = 1
