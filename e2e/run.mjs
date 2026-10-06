// Runs the e2e suites in order against the rig (e2e/rig/): `node e2e/run.mjs [suite…]`.
// Build first (`pnpm build`); the app under test is dist/ and dist-electron/.
import { spawn } from 'node:child_process'

const ALL = ['smoke', 'plugins', 'runs', 'agents', 'triggers', 'client-tools', 'artifacts', 'notifications', 'replay', 'tasks', 'task-changes', 'replies', 'branches', 'spinoff']
const suites = process.argv.length > 2 ? process.argv.slice(2) : ALL

const summary = []
for (const suite of suites) {
  console.log(`=== ${suite}`)
  const child = spawn(process.execPath, [new URL(`./suites/${suite}.mjs`, import.meta.url).pathname], { stdio: ['ignore', 'pipe', 'inherit'] })
  let out = ''
  child.stdout.on('data', chunk => {
    process.stdout.write(chunk)
    out += chunk
  })
  const code = await new Promise(resolve => child.on('close', resolve))
  const count = word => (out.match(new RegExp(`^${word} `, 'gm')) ?? []).length
  summary.push({ suite, pass: count('PASS'), fail: count('FAIL'), code })
}
console.log('\n=== summary')
for (const { suite, pass, fail, code } of summary) {
  console.log(`${fail === 0 && code === 0 ? 'ok  ' : 'FAIL'} ${suite}: ${pass} passed, ${fail} failed${code ? `, exit ${code}` : ''}`)
}
if (summary.some(s => s.fail > 0 || s.code !== 0)) process.exitCode = 1
