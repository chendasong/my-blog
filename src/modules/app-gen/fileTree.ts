/**
 * 生成结果的可视化目录结构。
 * AppGenFileMap 是扁平 path→content；UI 侧栏需要树形展开/折叠，本模块负责转换与默认展开策略。
 */
import type { AppGenFileMap, FileTreeNode } from './types'

/**
 * 将扁平文件路径转为可展开目录树（根级为 src、package.json 等并列节点）。
 * 目录在前、文件在后，同级按名称排序，便于用户按 IDE 习惯浏览生成物。
 */
export function buildFileTree(files: AppGenFileMap): FileTreeNode[] {
  type Mutable = { name: string; path: string; type: 'file' | 'dir'; children: Mutable[] }
  const root: Mutable[] = []

  const ensureDir = (parts: string[], parent: Mutable[]): Mutable => {
    let cursor = parent
    let acc = ''
    let node: Mutable | undefined
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part
      node = cursor.find((n) => n.type === 'dir' && n.name === part)
      if (!node) {
        node = { name: part, path: acc, type: 'dir', children: [] }
        cursor.push(node)
      }
      cursor = node.children
    }
    return node!
  }

  for (const fullPath of Object.keys(files).sort((a, b) => a.localeCompare(b))) {
    const parts = fullPath.split('/').filter(Boolean)
    if (!parts.length) continue
    const fileName = parts[parts.length - 1]
    const dirParts = parts.slice(0, -1)
    const parent = dirParts.length ? ensureDir(dirParts, root).children : root
    if (!parent.some((n) => n.type === 'file' && n.path === fullPath)) {
      parent.push({ name: fileName, path: fullPath, type: 'file', children: [] })
    }
  }

  const toImmutable = (nodes: Mutable[]): FileTreeNode[] =>
    nodes.map((n) =>
      n.type === 'dir'
        ? { name: n.name, path: n.path, type: 'dir', children: toImmutable(n.children) }
        : { name: n.name, path: n.path, type: 'file' },
    )

  const sortNodes = (nodes: Mutable[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    for (const n of nodes) {
      if (n.type === 'dir') sortNodes(n.children)
    }
  }
  sortNodes(root)
  return toImmutable(root)
}

/**
 * 文件树 UI 的初始展开集合：展开前两层目录（如 src、src/views）。
 * 避免首次进入时整棵树折叠，用户还要逐层点开才能看到主要业务文件。
 */
export function defaultExpandedDirs(tree: FileTreeNode[]): Set<string> {
  const open = new Set<string>()
  const walk = (nodes: FileTreeNode[], depth: number) => {
    for (const n of nodes) {
      if (n.type === 'dir' && depth < 2) {
        open.add(n.path)
        if (n.children) walk(n.children, depth + 1)
      }
    }
  }
  walk(tree, 0)
  return open
}
