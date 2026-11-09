import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

import { describe, expect, it } from 'vitest'

const SRC_DIR = join(import.meta.dirname, '..')
const THEME_DIR = import.meta.dirname
const SOURCE_FILE = /\.(ts|tsx|css)$/
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/g

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

describe('無寫死色碼', () => {
  it('theme/ 以外的檔案不得出現 hex、rgb、hsl 色碼', () => {
    const offenders = listFiles(SRC_DIR)
      .filter((file) => SOURCE_FILE.test(file) && !file.startsWith(THEME_DIR + sep))
      .flatMap((file) => {
        const matches = readFileSync(file, 'utf8').match(COLOR_LITERAL) ?? []
        return matches.map((match) => `${relative(SRC_DIR, file)}: ${match}`)
      })
    expect(offenders).toEqual([])
  })
})
