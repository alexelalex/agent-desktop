// tsx's CJS exports are getter-only, so assigning over them is a silent no-op; hand back a Proxy instead.
const Module = require('module')
const require_ = Module.prototype.require
const OFF = { 'streamforce-scheduler': 'startStreamforceScheduler', 'bedrock-integration-scheduler': 'startBedrockIntegrationScheduler' }
Module.prototype.require = function (id) {
  const exports = require_.apply(this, arguments)
  const hit = Object.keys(OFF).find(name => id.endsWith(name) || id.endsWith(`${name}.ts`))
  if (!hit) return exports
  const off = () => console.log(`[rig] ${OFF[hit]} suppressed`)
  return new Proxy(exports, { get: (t, k, r) => (k === OFF[hit] ? off : Reflect.get(t, k, r)) })
}
