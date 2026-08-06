/**
 * Pull blog markdown from Payload into this repo.
 * Requires .env.astropayload with PAYLOAD_URL, PAYLOAD_API_KEY, TENANT.
 *
 *   npm run sync:content
 *
 * Production publish runs sync in GitHub Actions — synced files are not committed.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(root, '..')
const configPath = path.join(repoRoot, 'astropayload.config.json')
const envPath = path.join(repoRoot, '.env.astropayload')

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error('Create .env.astropayload with PAYLOAD_URL, PAYLOAD_API_KEY, TENANT')
    process.exit(1)
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

loadEnv()

const tenant = process.env.TENANT
if (!tenant) {
  console.error('Set TENANT=interieurwonenplaza in .env.astropayload')
  process.exit(1)
}

let blogPath = 'src/content/blog'
if (existsSync(configPath)) {
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'))
  if (cfg.blogContentPath) blogPath = cfg.blogContentPath
}

console.log(`Syncing blog for tenant ${tenant} → ${blogPath}`)

const platform = process.env.ASTROPAYLOAD_PLATFORM_ROOT
if (!platform) {
  console.error(
    'Set ASTROPAYLOAD_PLATFORM_ROOT to your astropayload monorepo path, then re-run:\n' +
      '  npm run sync:content\n\n' +
      'Or from the platform repo:\n' +
      `  pnpm tenant-cli sync --slug ${tenant} --site "${repoRoot}" --blog-path ${blogPath}`,
  )
  process.exit(1)
}

const r = spawnSync(
  'pnpm',
  ['tenant-cli', 'sync', '--slug', tenant, '--site', repoRoot, '--blog-path', blogPath],
  { cwd: platform, stdio: 'inherit', env: process.env, shell: true },
)
process.exit(r.status ?? 1)
