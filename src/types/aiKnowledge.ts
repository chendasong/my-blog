/** AI 知识库（静态 / 后续可接 Supabase） */

export interface KnowledgeArticle {
  id: string
  folderId: string
  title: string
  /** Markdown 正文 */
  content: string
  updatedAt: string
}

export interface KnowledgeFolder {
  id: string
  title: string
  /** 展示用 emoji 或短符号 */
  icon?: string
  /** 该目录下文章 id 顺序（与 Supabase sort_order 一致） */
  articleIds: string[]
}
