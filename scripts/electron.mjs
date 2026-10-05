// Builds the Electron main process with Vite: `build` once, or `dev` to watch
// it, serve the renderer from the Vite dev server and restart the app on change.
import { spawn } from 'node:child_process'
import path from 'node:path'
import electron from 'electron'
import { build, createServer } from 'vite'

const root = path.resolve(import.meta.dirname, '..')

// The main process as an ES module; the preload as CommonJS, which a
// sandboxed preload requires.
const entries = [
  { entry: 'electron/main.ts', format: 'es', fileName: 'main.js' },
  { entry: 'electron/preload.ts', format: 'cjs', fileName: 'preload.cjs' },
]

const configOf = ({ entry, format, fileName }, watch) => ({
  configFile: false,
  root,
  logLevel: 'warn',
  resolve: { alias: { '@': path.join(root, 'src') } },
  build: {
    ssr: entry,
    outDir: 'dist-electron',
    emptyOutDir: false,
    target: 'node22',
    sourcemap: true,
    minify: false,
    watch: watch ? {} : null,
    rollupOptions: { output: { format, entryFileNames: fileName } },
  },
  // Bundle every dependency: the packaged app ships without node_modules.
  ssr: { noExternal: true, external: ['electron'] },
})

if (process.argv[2] === 'dev') {
  const server = await createServer({ root })
  await server.listen()
  const url = server.resolvedUrls.local[0]
  // Set in shells spawned by VS Code; it would start Electron as plain Node.
  const { ELECTRON_RUN_AS_NODE: _, ...env } = process.env
  let child
  const restart = () => {
    child?.removeAllListeners('exit')
    child?.kill()
    child = spawn(electron, ['.'], {
      cwd: root,
      stdio: 'inherit',
      env: { ...env, VITE_DEV_SERVER_URL: url },
    })
    child.on('exit', code => {
      for (const watcher of watchers) void watcher.close()
      void server.close()
      process.exit(code ?? 0)
    })
  }
  // Both builds finish at startup: restart once, when they settle.
  let pending
  const watchers = await Promise.all(
    entries.map(entry => build(configOf(entry, true))),
  )
  for (const watcher of watchers) {
    watcher.on('event', event => {
      if (event.code === 'ERROR') console.error(event.error)
      if (event.code !== 'END') return
      clearTimeout(pending)
      pending = setTimeout(restart, 200)
    })
  }
} else {
  for (const entry of entries) await build(configOf(entry, false))
}
