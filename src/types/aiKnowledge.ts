/** AI 知识库（Supabase：knowledge_catalog 目录+标题，knowledge_article_contents 正文） */

export interface KnowledgeArticle {
  id: string
  folderId: string
  title: string
  /** 正文；进入页时为空，按 id 拉取后填充 */
  content: string
  updatedAt: string
}

/** 目录节点；articleIds 为其下文章标题（树子节点）顺序 */
export interface KnowledgeFolder {
  id: string
  title: string
  icon?: string
  articleIds: string[]
}

export type ArticleContentStatus = 'idle' | 'loading' | 'loaded' | 'error'
