import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

// Everything the app keeps lives as files in its user-data folder.
const resolve = (name: string) => path.join(app.getPath('userData'), name)

export function readFile(name: string): Buffer | undefined {
  try {
    return readFileSync(resolve(name))
  } catch {
    return undefined
  }
}

export function readJson<T>(name: string, fallback: T): T {
  const raw = readFile(name)
  if (!raw) return fallback
  try {
    return JSON.parse(raw.toString('utf8')) as T
  } catch (error) {
    console.error(`Unreadable ${name}; starting from empty`, error)
    return fallback
  }
}

// Written to a temporary file and renamed, so a crash never leaves half a file.
export function writeFile(name: string, data: string | Buffer) {
  const file = resolve(name)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(`${file}.tmp`, data)
  renameSync(`${file}.tmp`, file)
}

export const writeJson = (name: string, data: unknown) =>
  writeFile(name, JSON.stringify(data))

export const removeFile = (name: string) => rmSync(resolve(name), { force: true })

/** Moves a file if it exists. */
export function moveFile(from: string, to: string) {
  if (existsSync(resolve(from))) renameSync(resolve(from), resolve(to))
}
