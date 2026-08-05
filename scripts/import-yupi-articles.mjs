/**
 * 将抓取的鱼皮文章写入「AI 编程」目录
 * 用法：node scripts/import-yupi-articles.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ARTICLES_DIR = join(__dirname, 'articles')
const FOLDER_ID = 'folder-f6438e75'
const FOLDER_TITLE = 'AI 编程'

function loadEnv() {
  const env = {}
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    env[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, '')
  }
  return env
}

function extractMarkdownFromFirecrawlFile(path) {
  const raw = readFileSync(path, 'utf8')
  const data = JSON.parse(raw)
  return data.markdown || ''
}

function cleanZhihuNoise(md) {
  // 去掉知乎评论区及之后杂讯
  const cutMarkers = [
    '\n编辑于 ',
    '\n​赞同 ',
    '\n3 条评论',
    '\n关于作者',
    '\n大家都在搜',
    '\n### 推荐阅读',
    '\n未登录用户',
  ]
  let out = md
  for (const m of cutMarkers) {
    const i = out.indexOf(m)
    if (i > 2000) out = out.slice(0, i)
  }
  // 去掉知乎站内搜索链接噪音（保留正文图片）
  out = out.replace(/\[[^\]]*\]\(https:\/\/zhida\.zhihu\.com\/search[^)]*\)/g, (match) => {
    const text = match.match(/^\[([^\]]*)\]/)
    return text ? text[1] : ''
  })
  out = out.replace(/\\_/g, '_')
  return out.trim()
}

function cleanTencentNoise(md) {
  let out = md
  // 从正文标题开始
  const titleIdx = out.indexOf('# 我用 AI 做了个小程序')
  if (titleIdx >= 0) out = out.slice(titleIdx)
  const cutMarkers = ['\n本文参与', '\n评论\n\n登录后参与评论', '\n推荐阅读', '\n编辑精选文章', '\n作者相关精选']
  for (const m of cutMarkers) {
    const i = out.indexOf(m)
    if (i > 2000) out = out.slice(0, i)
  }
  // 去掉腾讯云空代码块噪音标签
  out = out.replace(/\n代码语言：javascript\n\nAI代码解释\n\n复制\n\n```javascript\n\n```\n/g, '\n\n')
  return out.trim()
}

function cleanCsdnNoise(md) {
  let out = md
  const titleIdx = out.indexOf('# 不写代码')
  if (titleIdx < 0) {
    const alt = out.indexOf('不写代码，让 AI 生成手机 APP')
    if (alt >= 0) {
      // ensure heading
      out = '# 不写代码，让 AI 生成手机 APP！保姆级教程\n\n' + out.slice(alt)
    }
  } else {
    out = out.slice(titleIdx)
  }
  const cutMarkers = [
    '\n## 登录社区云',
    '\n## 相关文章',
    '\n版权声明',
    '\n原文链接',
    '\n评论 ',
    '\n开源鸿蒙跨平台开发者社区\n\n[首页]',
  ]
  for (const m of cutMarkers) {
    const i = out.indexOf(m)
    if (i > 2000) out = out.slice(0, i)
  }
  // 去掉顶部社区导航噪音
  const h1 = out.indexOf('# 不写代码')
  if (h1 > 0) out = out.slice(h1)
  return out.trim()
}

function withSourceNote(md, sourceUrl, originalUrl) {
  const note = [
    `> 原文（鱼皮 AI 知识库）：[${originalUrl}](${originalUrl})`,
    `> 同步来源：[${sourceUrl}](${sourceUrl})`,
    '',
    md,
  ].join('\n')
  return note
}

async function maxArticleSort(supabase, folderId) {
  const { data } = await supabase
    .from('knowledge_catalog')
    .select('sort_order')
    .eq('kind', 'article')
    .eq('folder_id', folderId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return typeof data?.sort_order === 'number' ? data.sort_order : -1
}

async function findExistingByTitle(supabase, folderId, title) {
  const { data } = await supabase
    .from('knowledge_catalog')
    .select('id')
    .eq('kind', 'article')
    .eq('folder_id', folderId)
    .eq('title', title)
    .maybeSingle()
  return data?.id || null
}

async function upsertArticle(supabase, { folderId, title, content, existingId }) {
  const now = new Date().toISOString()
  if (existingId) {
    const { error: cErr } = await supabase
      .from('knowledge_catalog')
      .update({ title, updated_at: now })
      .eq('id', existingId)
      .eq('kind', 'article')
    if (cErr) throw cErr
    const { error: bErr } = await supabase.from('knowledge_article_contents').upsert({
      article_id: existingId,
      content,
      updated_at: now,
    })
    if (bErr) throw bErr
    return existingId
  }

  const sort_order = (await maxArticleSort(supabase, folderId)) + 1
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  const { error: catalogError } = await supabase.from('knowledge_catalog').insert({
    id,
    kind: 'article',
    folder_id: folderId,
    title,
    icon: '📁',
    sort_order,
    updated_at: now,
  })
  if (catalogError) throw catalogError
  const { error: contentError } = await supabase.from('knowledge_article_contents').insert({
    article_id: id,
    content,
    updated_at: now,
  })
  if (contentError) throw contentError
  return id
}

function prepareArticles() {
  mkdirSync(ARTICLES_DIR, { recursive: true })

  // 1) GitHub README — 对应「对标大厂 AI 项目」
  const readmePath = join(ARTICLES_DIR, '01-ai-code-platform.md')
  let a1 = existsSync(readmePath)
    ? readFileSync(readmePath, 'utf8')
    : readFileSync(join(__dirname, '_tmp_article1.md'), 'utf8')
  // 使用知识库原标题风格的导语
  if (!a1.includes('这次，带做一个对标大厂')) {
    a1 = [
      '# 这次，带做一个对标大厂的 AI 项目！',
      '',
      '大家好，我是鱼皮，分享个我的新项目，依然是从 0 到 1 全程带做！',
      '',
      '对于准备秋招和社招的朋友们，我敢说这一定是简历上的王炸项目！',
      '',
      '> 文末有本项目的学习方式',
      '',
      a1.replace(/^# AI 零代码应用生成平台\s*/, ''),
    ].join('\n')
  }
  a1 = withSourceNote(
    a1.trim(),
    'https://github.com/liyupi/yu-ai-code-mother',
    'https://ai.codefather.cn/library/1953419034767884290',
  )
  writeFileSync(join(ARTICLES_DIR, '01-final.md'), a1, 'utf8')

  // 2) Cordova — 优先用知乎/CSDN 抓取结果
  const agentDir = join(
    process.env.USERPROFILE || '',
    '.cursor/projects/d-projects-my-blog-2/agent-tools',
  )
  const csdnFile = join(agentDir, '54222bec-0c9e-40be-a717-9d1e88ef5fa4.txt')
  const zhihuCordovaFallback = join(ARTICLES_DIR, '02-cordova-raw.md')

  let a2 = ''
  if (existsSync(csdnFile)) {
    a2 = cleanCsdnNoise(extractMarkdownFromFirecrawlFile(csdnFile))
  }
  // 若 CSDN 内容太短，尝试本地已保存的知乎正文
  if (a2.length < 3000 && existsSync(zhihuCordovaFallback)) {
    a2 = cleanZhihuNoise(readFileSync(zhihuCordovaFallback, 'utf8'))
  }
  if (!a2.startsWith('#')) {
    a2 = '# 不写代码，让 AI 生成手机 APP！保姆级教程\n\n' + a2
  }
  a2 = withSourceNote(
    a2,
    'https://zhuanlan.zhihu.com/p/1918253363402867753',
    'https://ai.codefather.cn/library/1939606874832486401',
  )
  writeFileSync(join(ARTICLES_DIR, '02-final.md'), a2, 'utf8')

  // 3) 学习英雄小程序
  const tencentFile = join(agentDir, 'eec21af6-258b-444b-a2ee-29fd4171de19.txt')
  const zhihu3File = join(agentDir, '4a1be72c-1ed2-4474-b6fe-102ed58479f3.txt')
  let a3 = ''
  if (existsSync(zhihu3File)) {
    a3 = cleanZhihuNoise(extractMarkdownFromFirecrawlFile(zhihu3File))
  }
  if (a3.length < 3000 && existsSync(tencentFile)) {
    a3 = cleanTencentNoise(extractMarkdownFromFirecrawlFile(tencentFile))
  }
  if (!a3.startsWith('#')) {
    a3 = '# 我用 AI 做了个小程序，治好了我的学习焦虑症！\n\n' + a3
  }
  a3 = withSourceNote(
    a3,
    'https://developer.cloud.tencent.com/article/2686869',
    'https://ai.codefather.cn/library/2010958819768791041',
  )
  writeFileSync(join(ARTICLES_DIR, '03-final.md'), a3, 'utf8')

  return [
    {
      title: '这次，带做一个对标大厂的 AI 项目！',
      content: a1,
      file: '01-final.md',
    },
    {
      title: '不写代码，让 AI 生成手机 APP！保姆级教程',
      content: a2,
      file: '02-final.md',
    },
    {
      title: '我用 AI 做了个小程序，治好了我的学习焦虑症！',
      content: a3,
      file: '03-final.md',
    },
  ]
}

async function main() {
  const env = loadEnv()
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    console.error('缺少 Supabase 配置')
    process.exit(1)
  }
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

  console.log(`目标目录: ${FOLDER_TITLE} (${FOLDER_ID})`)
  const articles = prepareArticles()

  for (const a of articles) {
    console.log(`\n处理: ${a.title}`)
    console.log(`  正文长度: ${a.content.length} 字符`)
    if (a.content.length < 500) {
      console.error('  正文过短，跳过')
      continue
    }
    const existingId = await findExistingByTitle(supabase, FOLDER_ID, a.title)
    try {
      const id = await upsertArticle(supabase, {
        folderId: FOLDER_ID,
        title: a.title,
        content: a.content,
        existingId,
      })
      console.log(`  ✅ ${existingId ? '已更新' : '已插入'} id=${id}`)
    } catch (e) {
      console.error(`  ❌ 失败:`, e.message || e)
      process.exitCode = 1
    }
  }
}

main()
