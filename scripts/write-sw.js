// Include every built asset in the offline shell and derive its version from its content.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const hash = createHash('sha256')
const assets = []
function visit(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) visit(file)
    else if (entry.isFile()) {
      const relative = path.relative(dist, file).split(path.sep).join('/')
      hash.update(relative).update('\0').update(readFileSync(file))
      if (relative !== 'sw.js') assets.push(`./${relative}`)
    }
  }
}
visit(dist)
const swPath = path.join(dist, 'sw.js')
const sw = readFileSync(swPath, 'utf8')
if (!sw.includes('tesbihat-v__VERSION__') || !sw.includes('__PRECACHE_ASSETS__')) throw new Error('Service worker placeholders missing')
const version = hash.digest('hex').slice(0, 16)
writeFileSync(swPath, sw.replace('tesbihat-v__VERSION__', `tesbihat-v${version}`).replace("JSON.parse('__PRECACHE_ASSETS__')", JSON.stringify(assets)))
console.log(`Service worker cache: tesbihat-v${version}, ${assets.length} assets`)
