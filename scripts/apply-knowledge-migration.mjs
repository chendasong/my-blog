/**
 * 通过 Supabase Management API 执行知识库分表迁移。
 * 需要 .env 中配置 SUPABASE_ACCESS_TOKEN（Dashboard → Account → Access Tokens）
 * 或已执行 `npx supabase login` 后由 CLI 写入的 token。
 */
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_REF = 'nbvujauclgslrfnamxnj'
const MIGRATION_PATH = join(__dirname, '../supabase/migrations/20260516_split_knowledge_catalog_and_contents.sql')

function loadEnv() {
  const envPath = join(__dirname, '../.env')
  if (!existsSync(envPath)) return {}
  const out = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    out[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, '')
  }
  return out
}

function loadCliToken() {
  const home = process.env.USERPROFILE || process.env.HOME
  if (!home) return null
  const paths = [
    join(home, '.supabase', 'access-token'),
    join(home, 'AppData', 'Local', 'supabase', 'access-token'),
  ]
  for (const p of paths) {
    if (existsSync(p)) return readFileSync(p, 'utf8').trim()
  }
  return null
}

async function runQuery(token, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return text
}

async function main() {
  const env = loadEnv()
  const token = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN || loadCliToken()
  if (!token) {
    console.error('缺少 SUPABASE_ACCESS_TOKEN。请任选其一：')
    console.error('  1. 在 .env 添加 SUPABASE_ACCESS_TOKEN=（Dashboard → Account → Access Tokens）')
    console.error('  2. 运行 npx supabase login 后重试本脚本')
    process.exit(1)
  }

  const sql = readFileSync(MIGRATION_PATH, 'utf8')
  console.log('正在执行迁移…')
  await runQuery(token, sql)
  console.log('迁移完成。')

  const verify = await runQuery(
    token,
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('knowledge_catalog','knowledge_article_contents','knowledge_folders','knowledge_articles')
     ORDER BY table_name`,
  )
  console.log('当前表:', verify)
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
