import { WebContainer, type FileSystemTree } from '@webcontainer/api'
import type { AppGenFileMap } from './types'

/**
 * 浏览器内 WebContainer 预览：将虚拟 files 挂载为文件树，npm install 后启动 Vite。
 * boot 全局单例；PreviewSession 提供 iframe URL 与运行中单文件热写。
 */

let bootPromise: Promise<WebContainer> | null = null
let instance: WebContainer | null = null

const INSTALL_TIMEOUT_MS = 180_000
const DEV_TIMEOUT_MS = 90_000

/** 将扁平 path→content 映射转为 WebContainer 所需的嵌套 directory/file 树 */
export function filesToTree(files: AppGenFileMap): FileSystemTree {
  const tree: FileSystemTree = {}

  for (const [rawPath, contents] of Object.entries(files)) {
    const parts = rawPath.replace(/^\/+/, '').split('/').filter(Boolean)
    if (!parts.length) continue
    let cursor: FileSystemTree = tree
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      if (isFile) {
        cursor[part] = { file: { contents } }
      } else {
        const existing = cursor[part]
        if (!existing || !('directory' in existing)) {
          cursor[part] = { directory: {} }
        }
        cursor = (cursor[part] as { directory: FileSystemTree }).directory
      }
    }
  }
  return tree
}

/** WebContainer.boot 昂贵且页面生命周期内只需一次，复用同一实例 */
async function getContainer(onLog?: (line: string) => void): Promise<WebContainer> {
  if (instance) return instance
  if (!bootPromise) {
    onLog?.('正在启动 WebContainer 运行时（浏览器内 Node）…')
    bootPromise = WebContainer.boot()
      .then((wc) => {
        instance = wc
        onLog?.('WebContainer 已就绪')
        return wc
      })
      .catch((err) => {
        bootPromise = null
        const msg = err instanceof Error ? err.message : String(err)
        throw new Error(
          `WebContainer 启动失败：${msg}。请确认页面启用了 COOP/COEP（需用最新 vite 配置并硬刷新），且浏览器支持 SharedArrayBuffer。`,
        )
      })
  }
  return bootPromise
}

export type PreviewSession = {
  url: string
  writeFile: (path: string, content: string) => Promise<void>
  disposeDev: () => void
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    const err = new Error('已取消预览')
    err.name = 'AbortError'
    throw err
  }
}

async function waitProcessExit(
  proc: { exit: Promise<number>; kill: () => void },
  opts: {
    timeoutMs: number
    timeoutMessage: string
    signal?: AbortSignal
    onTick?: (elapsedSec: number) => void
  },
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    let settled = false
    const started = Date.now()
    const tick = window.setInterval(() => {
      opts.onTick?.(Math.round((Date.now() - started) / 1000))
    }, 5000)

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      window.clearInterval(tick)
      window.clearTimeout(timer)
      opts.signal?.removeEventListener('abort', onAbort)
      fn()
    }

    const timer = window.setTimeout(() => {
      try {
        proc.kill()
      } catch {
        /* ignore */
      }
      finish(() => reject(new Error(opts.timeoutMessage)))
    }, opts.timeoutMs)

    const onAbort = () => {
      try {
        proc.kill()
      } catch {
        /* ignore */
      }
      finish(() => {
        const err = new Error('已取消预览')
        err.name = 'AbortError'
        reject(err)
      })
    }

    opts.signal?.addEventListener('abort', onAbort)
    void proc.exit.then(
      (code) => finish(() => resolve(code)),
      (err) => finish(() => reject(err instanceof Error ? err : new Error(String(err)))),
    )
  })
}

/**
 * 在 WebContainer 中安装依赖并启动 Vite 预览。
 * 注意：WebContainer.boot 全局只能成功一次。
 */
export async function startVuePreview(
  files: AppGenFileMap,
  options?: {
    onLog?: (line: string) => void
    signal?: AbortSignal
  },
): Promise<PreviewSession> {
  const onLog = options?.onLog
  const signal = options?.signal
  assertNotAborted(signal)

  const wc = await getContainer(onLog)
  assertNotAborted(signal)

  onLog?.('挂载项目文件到虚拟文件系统…')
  await wc.mount(filesToTree(files))
  assertNotAborted(signal)

  // 跳过 audit/fund，减少无效网络；预览不需要 typescript 编译器
  onLog?.('开始 npm install（浏览器内下载，受网络影响；已跳过 audit/fund）…')
  const install = await wc.spawn('npm', [
    'install',
    '--no-audit',
    '--no-fund',
    '--progress=false',
    '--loglevel=info',
  ])
  pipeOutput(install.output, onLog)

  const installCode = await waitProcessExit(install, {
    timeoutMs: INSTALL_TIMEOUT_MS,
    timeoutMessage:
      'npm install 超时（3 分钟）。常见原因：网络访问 npm registry 慢、WebContainer 被扩展拦截。可点「停止」后重试，或先下载 ZIP 本地运行。',
    signal,
    onTick: (sec) => onLog?.(`安装仍在进行…已等待 ${sec}s`),
  })
  if (installCode !== 0) {
    throw new Error(
      `npm install 失败（exit ${installCode}）。请展开下方安装日志查看具体错误，或下载 ZIP 在本地 npm install。`,
    )
  }
  onLog?.('依赖安装完成')
  assertNotAborted(signal)

  onLog?.('启动 Vite 开发服务器…')
  const dev = await wc.spawn('npm', ['run', 'dev'])
  pipeOutput(dev.output, onLog)

  const url = await new Promise<string>((resolve, reject) => {
    let unsub: (() => void) | undefined
    let settled = false
    const timer = window.setTimeout(() => {
      settle(() => reject(new Error('Vite 启动超时，请检查入口文件 / vite.config')))
    }, DEV_TIMEOUT_MS)

    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      unsub?.()
      signal?.removeEventListener('abort', onAbort)
      fn()
    }

    unsub = wc.on('server-ready', (port: number, serverUrl: string) => {
      settle(() => resolve(serverUrl || `http://localhost:${port}`))
    })

    const onAbort = () => {
      try {
        dev.kill()
      } catch {
        /* ignore */
      }
      settle(() => {
        const err = new Error('已取消预览')
        err.name = 'AbortError'
        reject(err)
      })
    }
    signal?.addEventListener('abort', onAbort)
  })

  onLog?.(`预览地址：${url}`)

  return {
    url,
    writeFile: async (path, content) => {
      const clean = path.replace(/^\/+/, '')
      const dir = clean.includes('/') ? clean.slice(0, clean.lastIndexOf('/')) : ''
      if (dir) {
        await wc.fs.mkdir(dir, { recursive: true })
      }
      await wc.fs.writeFile(clean, content)
    },
    disposeDev: () => {
      try {
        dev.kill()
      } catch {
        /* ignore */
      }
    },
  }
}

function pipeOutput(output: ReadableStream<string>, onLog?: (line: string) => void) {
  const reader = output.getReader()
  const pump = async () => {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value && onLog) {
          value
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
            .forEach((line) => onLog(line.slice(0, 400)))
        }
      }
    } catch {
      /* ignore */
    }
  }
  void pump()
}
