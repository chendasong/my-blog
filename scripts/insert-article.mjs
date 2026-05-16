/**
 * 脚本：将抓取的文章内容插入到 AI 知识库
 * 用法：node scripts/insert-article.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 从 .env 文件读取配置
const envPath = join(__dirname, '..', '.env')
let envContent = ''
try {
  envContent = readFileSync(envPath, 'utf-8')
} catch {
  console.log('未找到 .env 文件，将使用环境变量')
}

const envVars = {}
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return
  const match = trimmed.match(/^(VITE_\w+)=(.+)$/)
  if (match) {
    envVars[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('错误：缺少 Supabase 配置')
  console.error('请在 .env 文件中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 文章内容
const articleContent = `<p align="center">
<a href="https://ai.codefather.cn/library/2010994846520700929">
      <img src="https://pic.code-nav.cn/migrate_image/4dc582f83196ff2ae86c663d2daf8b3f.webp" alt="Vibe Coding" width="600">
    </a>
</p>
<h1 align="center">🐟 鱼皮的 AI 知识库</h1>
<p align="center">
  <b>完全免费开放的 AI 知识共享平台 | 减少信息差，让每个人都能享受技术红利</b>
</p>
<p>汇总整合目前热门的 AI 工具相关信息，包括产品介绍、使用指南、工具测评、技巧分享、应用场景、AI 变现、行业资讯、教程资源等一系列内容。</p>
<p>鱼皮希望带领大家打破 AI 技术的信息壁垒，让每个人都能平等获取 AI 时代的工具与认知，利用科技让生活更美好。</p>
<h2>🧭 AI 知识库导航</h2>
<h3>新手入门</h3>
<table>
<thead>
<tr><th align="left">资源</th><th align="left">链接</th></tr>
</thead>
<tbody>
<tr><td align="left">AI 基础概念</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1939618416083517441?type=">动画解释大模型</a></td></tr>
<tr><td align="left">关于 DeepSeek</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1936010131284197378?type=">什么是 DeepSeek</a> ｜ <a href="https://ai.codefather.cn/course/1935993640975368194/section/1936010134115352577?type=">快速上手指南</a></td></tr>
<tr><td align="left">本地部署</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1936010134094381057?type=">DeepSeek 本地部署</a> ｜ <a href="https://ai.codefather.cn/course/1935993640975368194/section/1936010134044049410?type=">API 调用教程</a></td></tr>
<tr><td align="left">提问技巧</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1936010133884665858?type=">DeepSeek 提问技巧</a> ｜ <a href="https://ai.codefather.cn/course/1935993640975368194/section/1939613141913882625?type=">去除文章 AI 味</a></td></tr>
<tr><td align="left">学习资料</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1936010134908076034?type=">清华大学 DeepSeek 指南</a> ｜ <a href="https://ai.codefather.cn/library/2010958562586652674">免费 AI 学习资源</a></td></tr>
</tbody>
</table>

<h3>AI 编程</h3>
<table>
<thead>
<tr><th align="left">类别</th><th align="left">精选内容</th></tr>
</thead>
<tbody>
<tr><td align="left">🔥 热门教程</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1936010134970990594?type=">AI 智能体项目</a> ｜ <a href="https://ai.codefather.cn/library/1953419034767884290">AI 零代码平台</a> ｜ <a href="https://ai.codefather.cn/course/1935993640975368194/section/1939594304172048385?type=">AI 大模型应用开发学习路线</a></td></tr>
<tr><td align="left">Cursor 技巧</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1940016883188420609?type=">一文秒懂 Cursor 开发的正确姿势</a> ｜ <a href="https://ai.codefather.cn/course/1935993640975368194/section/1940013576386691073?type=">10 个超实用的 Cursor 使用技巧</a> ｜ <a href="https://ai.codefather.cn/library/2010960235900039169">7 个 Cursor 极限省钱大法</a></td></tr>
<tr><td align="left">实战项目</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1936010134362816514?type=">用 DeepSeek 给对象做网站</a> ｜ <a href="https://ai.codefather.cn/course/1935993640975368194/section/1936010134933241858?type=">模拟面试系统</a> ｜ <a href="https://ai.codefather.cn/course/1935993640975368194/section/1936010135000350722?type=">亲戚计算器</a></td></tr>
<tr><td align="left">进阶技术</td><td align="left"><a href="https://ai.codefather.cn/library/2010962851845500930">Claude Code 神级技巧</a> ｜ <a href="https://ai.codefather.cn/library/2010961573182566401">用 AI 手搓 Claude Code</a> ｜ <a href="https://ai.codefather.cn/library/1939616989344874498">MCP 服务开发</a></td></tr>
<tr><td align="left">框架整合</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1939604858608758786?type=">Spring AI 1.0 核心能力体验</a> ｜ <a href="https://ai.codefather.cn/library/1939605498152861697">Spring AI Alibaba 1.0 速览</a></td></tr>
</tbody>
</table>

<h3>AI 工具测评</h3>
<table>
<thead>
<tr><th align="left">测评内容</th></tr>
</thead>
<tbody>
<tr><td align="left"><a href="https://ai.codefather.cn/library/1953708402784243713">🆕 GPT-5 炸裂登场！可免费使用</a></td></tr>
<tr><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1939608538959523842?type=">Claude 4 炸裂发布！凭什么敢称宇宙最强编程 AI？</a></td></tr>
<tr><td align="left"><a href="https://ai.codefather.cn/library/2010960103049654274">Cursor 2.0 炸裂发布！这 3 大亮点必学</a></td></tr>
<tr><td align="left"><a href="https://ai.codefather.cn/library/2010960433514672129">Gemini 3.0 发布！前端又无了？</a></td></tr>
<tr><td align="left"><a href="https://ai.codefather.cn/library/2010962343906897922">开源 AI 编程工具能干掉 Claude Code？OpenCode 体验实测！</a></td></tr>
<tr><td align="left"><a href="https://ai.codefather.cn/library/2010959589482295298">3 大模型对比测试！AI 争霸赛谁赢了？</a></td></tr>
<tr><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1939608069806473217?type=">全球首个无限执行的 AI！Flowith 体验</a></td></tr>
<tr><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1939603744484999169?type=">Gemini CLI 首测，免费开源很香，但坑点很多！</a></td></tr>
</tbody>
</table>

<h3>其他 AI 应用场景</h3>
<table>
<thead>
<tr><th align="left">场景</th><th align="left">教程</th></tr>
</thead>
<tbody>
<tr><td align="left">视频创作</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1939612684927811586?type=">用 AI 做千万播放的爆款视频！</a> ｜ <a href="https://ai.codefather.cn/course/1935993640975368194/section/1939612504572739586?type=">1 分钟做出动物奥运会视频！</a></td></tr>
<tr><td align="left">办公效率</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1936010134610280450?type=">AI 王炸组合，自动生成 PPT</a> ｜ <a href="https://ai.codefather.cn/library/2010961061171294210">干掉 Draw.io 的画图神器</a></td></tr>
<tr><td align="left">知识管理</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1939982669017694209?type=">轻松搭建 DeepSeek 个人知识库</a> ｜ <a href="https://ai.codefather.cn/library/2010957959428960257">让 AI 帮我读文档</a></td></tr>
<tr><td align="left">求职提升</td><td align="left"><a href="https://ai.codefather.cn/course/1935993640975368194/section/1939980585996304385?type=">用 AI 润色简历</a> ｜ <a href="https://ai.codefather.cn/library/2010963301307117569">3 个免费 AI 文章检测工具</a></td></tr>
</tbody>
</table>

<h2>🔥 鱼皮的 Vibe Coding 零基础入门教程</h2>
<p>如今 <strong>Vibe Coding（氛围编程）</strong> 已经火遍全网！不仅是程序员，连设计师、产品运营、甚至完全不懂技术的人都开始用 Vibe Coding 实现自己的想法，用 AI 做出了自己的产品并盈利变现。</p>
<p>我一人爆肝创作了这套 <a href="https://ai.codefather.cn/vibe">《Vibe Coding 零基础入门教程》</a>，<strong>上千张图、几十万字</strong>，结合了我两年半的 AI 编程经验 + 项目开发经验 + 产品变现经验，目标只有一个：</p>
<p><strong>帮助任何人快速掌握 Vibe Coding，哪怕零基础，也能快速开发上线自己的产品并盈利。</strong></p>
<p>臭不要脸一下，我敢说这套免费教程吊打 90% 的付费 Vibe Coding 内容。</p>
<p><img src="https://pic.code-nav.cn/course_picture/1777901361900417025/Wj4V63Ufb8lG242B.webp" alt=""></p>

<h3>教程包含什么？</h3>
<p>我精心梳理了内容结构，让你能够一条龙学习，或者快速找到适合自己阅读的内容。</p>
<ul>
<li>基础必读：帮你快速理解 Vibe Coding 并上手实践，10 分钟做出第一个作品</li>
<li>编程工具：帮你选择适合自己的 AI 编程工具，包括 AI 模型选择、AI 零代码平台、AI 智能体平台、AI 代码编辑器、AI 命令行工具、IDE 插件等</li>
<li>项目实战：手把手带你从 0 到 1 做出真实可用的产品，覆盖个人工具、AI 应用、全栈应用、小程序等多种类型</li>
<li>经验技巧：帮你提升 Vibe Coding 效率和质量，包括核心心法、对话工程、上下文管理、幻觉处理、代码质量保障等</li>
<li>产品变现：教你如何让产品产生价值，涵盖需求分析、技术选型、架构设计、盈利模式、SEO 优化、自媒体运营等</li>
<li>编程学习：为想深入学习编程的同学准备的进阶内容，包括学习路线、知识百科、资源大全、MCP 开发、面试刷题等</li>
<li>资源宝库：汇集各种实用资源，包括工具大全、提示词模板、AI 概念大全、Vibe Coding 常见问题等</li>
</ul>
<p><img src="https://pic.code-nav.cn/course_picture/1777901361900417025/9HaEpTIhqbdwNOiC.webp" alt="鱼皮的 Vibe Coding 零基础教程大纲"></p>

<h3>学习路径推荐</h3>
<p><strong>零基础新手：</strong></p>
<ul>
<li>第 1 天：读完基础必读，理解 Vibe Coding 并做出第一个作品</li>
<li>第 1-2 周：学习 AI 编程工具 + 做几个简单项目</li>
<li>之后：按需学习经验技巧和产品变现</li>
</ul>
<p><strong>有编程基础：</strong></p>
<ul>
<li>第 1 天：快速过完基础内容，完成快速上手教程</li>
<li>第 1 周：学习主流 AI 编程工具，尝试重构之前的项目</li>
<li>之后：重点学习进阶技巧，提升对话和上下文管理能力</li>
</ul>
<p align="center">
  <a href="https://ai.codefather.cn/vibe"><img src="https://img.shields.io/badge/👉 立即开始学习-Vibe Coding 教程-ff6b6b?style=for-the-badge" alt="开始学习"></a>
</p>

<h2>交流渠道</h2>
<p>欢迎加入我们的 AI 交流群，关注公众号：<strong>【程序员鱼皮】</strong>，获取更多最一手 AI 资讯，一起探讨 AI 应用实践。</p>
<p><img src="https://pic.code-nav.cn/course_picture/1777901361900417025/4HoJWfdkJfmzWhUV.webp" alt="鱼皮的交流群大全"></p>

<h2>参与共建</h2>
<p>如果你也是 AI 探索者、爱好者，并且乐于分享和沉淀你的知识和奇思妙想，欢迎加入进来参与知识库共建，一起构建属于所有人的 AI 知识宝藏！</p>
<p>🎉 <strong>你将收获：</strong></p>
<table>
<thead>
<tr><th align="left">收获</th><th align="left">说明</th></tr>
</thead>
<tbody>
<tr><td align="left">🌟 影响力提升</td><td align="left">在活跃社区中展示才华，建立个人品牌与专业声誉</td></tr>
<tr><td align="left">📚 深度学习</td><td align="left">接触多元视角，与同行切磋，加速个人成长</td></tr>
<tr><td align="left">🏆 价值认同</td><td align="left">您的贡献将被明确署名，获得社区成员的尊重与感谢</td></tr>
<tr><td align="left">🤝 拓展人脉</td><td align="left">连接志同道合的伙伴，融入充满活力的 AI 生态圈</td></tr>
</tbody>
</table>
<p><strong>联系方式（微信号）：yupi996</strong></p>

<h2>感谢 Star</h2>
<p>如果这个项目对你有帮助，请给一个 <strong>Star</strong> ⭐️ 支持一下！</p>
<p><a href="https://github.com/liyupi/ai-guide"><img src="https://pic.code-nav.cn/course_picture/1612112932991139842/2nNWiHglO0JYqo78.webp" alt="api.star-history.com_svg_repos=liyupi_ai-guide&amp;type=Date.png"></a></p>

<h2>写在最后</h2>
<p>我一直相信，知识分享是互利共赢的。</p>
<p>这个知识库完全免费开源，希望能帮更多人打开 AI 的大门。</p>
<p>📖 Vibe Coding 教程文档开源地址：<a href="https://github.com/liyupi/ai-guide">https://github.com/liyupi/ai-guide</a></p>
<p>🌐 Vibe Coding 教程在线阅读地址：<a href="https://ai.codefather.cn/vibe">https://ai.codefather.cn/vibe</a></p>
<p>🎬 作者的视频合集：<a href="https://space.bilibili.com/12890453">https://space.bilibili.com/12890453</a></p>
<p>💬 交流反馈：欢迎在 <a href="https://ai.codefather.cn">AI 导航社区</a> 提问</p>`

async function getFirstFolder() {
  const { data, error } = await supabase
    .from('knowledge_folders')
    .select('*')
    .order('sort_order', { ascending: true })
    .limit(1)
    .single()

  if (error) {
    console.error('获取目录失败:', error.message)
    return null
  }
  return data
}

async function getMaxArticleSort(folderId) {
  const { data } = await supabase
    .from('knowledge_articles')
    .select('sort_order')
    .eq('folder_id', folderId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return typeof data?.sort_order === 'number' ? data.sort_order : -1
}

async function insertArticle(folderId, title, content) {
  const sort_order = (await getMaxArticleSort(folderId)) + 1
  const now = new Date().toISOString()
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

  const { error } = await supabase.from('knowledge_articles').insert({
    id,
    folder_id: folderId,
    title,
    content,
    sort_order,
    updated_at: now,
  })

  if (error) {
    throw new Error(`插入文章失败: ${error.message}`)
  }

  return id
}

async function main() {
  console.log('正在获取第一个目录...')
  const folder = await getFirstFolder()

  if (!folder) {
    console.error('没有找到任何目录，请先创建一个目录')
    process.exit(1)
  }

  console.log(`找到目录: ${folder.title} (ID: ${folder.id})`)

  const title = '🚀 AI 知识库启航 - 鱼皮的 AI 知识库'

  console.log('正在插入文章...')
  try {
    const articleId = await insertArticle(folder.id, title, articleContent)
    console.log(`✅ 文章插入成功！ID: ${articleId}`)
    console.log(`标题: ${title}`)
    console.log(`所属目录: ${folder.title}`)
  } catch (error) {
    console.error('插入文章失败:', error.message)
    process.exit(1)
  }
}

main()
