import { supabase } from '@/lib/supabase'
import type { KnowledgeArticle, KnowledgeFolder } from '@/types/aiKnowledge'

function isoDateOnly(ts: string | null | undefined): string {
  if (!ts) return new Date().toISOString().slice(0, 10)
  return ts.slice(0, 10)
}

interface CatalogArticleRow {
  id: string
  title: string
  folder_id: string
  sort_order: number
  updated_at: string
}

interface CatalogFolderTreeRow {
  id: string
  title: string
  icon: string
  sort_order: number
  updated_at: string
  articles: CatalogArticleRow[] | null
}

interface CatalogRow {
  id: string
  kind: 'folder' | 'article'
  folder_id: string | null
  title: string
  icon: string
  sort_order: number
  updated_at: string
}

function mapTreeRows(folderRows: CatalogFolderTreeRow[]): {
  folders: KnowledgeFolder[]
  articles: Record<string, KnowledgeArticle>
} {
  const articles: Record<string, KnowledgeArticle> = {}
  const folders: KnowledgeFolder[] = folderRows.map((f) => {
    const list = [...(f.articles ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    const articleIds: string[] = []
    for (const a of list) {
      articleIds.push(a.id)
      articles[a.id] = {
        id: a.id,
        folderId: a.folder_id,
        title: a.title,
        content: '',
        updatedAt: isoDateOnly(a.updated_at),
      }
    }
    return {
      id: f.id,
      title: f.title,
      icon: f.icon,
      articleIds,
    }
  })
  return { folders, articles }
}

function mapFlatRows(rows: CatalogRow[]): {
  folders: KnowledgeFolder[]
  articles: Record<string, KnowledgeArticle>
} {
  const folderRows = rows.filter((r) => r.kind === 'folder').sort((a, b) => a.sort_order - b.sort_order)
  const articlesByFolder = new Map<string, CatalogRow[]>()
  for (const r of rows) {
    if (r.kind !== 'article' || !r.folder_id) continue
    const list = articlesByFolder.get(r.folder_id) ?? []
    list.push(r)
    articlesByFolder.set(r.folder_id, list)
  }
  const articles: Record<string, KnowledgeArticle> = {}
  const folders: KnowledgeFolder[] = folderRows.map((f) => {
    const list = [...(articlesByFolder.get(f.id) ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    const articleIds: string[] = []
    for (const a of list) {
      articleIds.push(a.id)
      articles[a.id] = {
        id: a.id,
        folderId: a.folder_id!,
        title: a.title,
        content: '',
        updatedAt: isoDateOnly(a.updated_at),
      }
    }
    return { id: f.id, title: f.title, icon: f.icon, articleIds }
  })
  return { folders, articles }
}

/** 一次请求：目录树 + 其下文章标题（嵌套子节点，不含正文） */
export async function fetchKnowledgeTree(): Promise<{
  folders: KnowledgeFolder[]
  articles: Record<string, KnowledgeArticle>
}> {
  const nested = await supabase
    .from('knowledge_catalog')
    .select(
      `
      id,
      title,
      icon,
      sort_order,
      updated_at,
      articles:knowledge_catalog!folder_id (
        id,
        title,
        folder_id,
        sort_order,
        updated_at
      )
    `,
    )
    .eq('kind', 'folder')
    .order('sort_order', { ascending: true })

  if (!nested.error) {
    return mapTreeRows((nested.data ?? []) as CatalogFolderTreeRow[])
  }

  const flat = await supabase
    .from('knowledge_catalog')
    .select('id, kind, folder_id, title, icon, sort_order, updated_at')
    .order('sort_order', { ascending: true })

  if (flat.error) throw flat.error
  return mapFlatRows((flat.data ?? []) as CatalogRow[])
}

/** @deprecated 使用 fetchKnowledgeTree */
export const fetchKnowledgeLibrary = fetchKnowledgeTree

interface ArticleContentRow {
  content: string
  updated_at: string
}

/** 点击标题后仅拉正文（标题元数据已在目录树中） */
export async function fetchArticleContentById(articleId: string): Promise<{
  content: string
  updatedAt: string
}> {
  const { data, error } = await supabase
    .from('knowledge_article_contents')
    .select('content, updated_at')
    .eq('article_id', articleId)
    .single()

  if (error) throw error
  const row = data as ArticleContentRow
  return {
    content: row.content ?? '',
    updatedAt: isoDateOnly(row.updated_at),
  }
}

async function maxFolderSort(): Promise<number> {
  const { data } = await supabase
    .from('knowledge_catalog')
    .select('sort_order')
    .eq('kind', 'folder')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return typeof data?.sort_order === 'number' ? data.sort_order : -1
}

async function maxArticleSort(folderId: string): Promise<number> {
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

export async function insertFolder(id: string, title: string, icon: string): Promise<void> {
  const sort_order = (await maxFolderSort()) + 1
  const now = new Date().toISOString()
  const { error } = await supabase.from('knowledge_catalog').insert({
    id,
    kind: 'folder',
    folder_id: null,
    title,
    icon,
    sort_order,
    updated_at: now,
  })
  if (error) throw error
}

export async function updateFolder(id: string, patch: { title?: string; icon?: string }): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.title !== undefined) row.title = patch.title
  if (patch.icon !== undefined) row.icon = patch.icon
  const { error } = await supabase.from('knowledge_catalog').update(row).eq('id', id).eq('kind', 'folder')
  if (error) throw error
}

export async function removeFolder(id: string): Promise<void> {
  const { error } = await supabase.from('knowledge_catalog').delete().eq('id', id).eq('kind', 'folder')
  if (error) throw error
}

export async function insertArticle(params: {
  id: string
  folderId: string
  title: string
  content: string
}): Promise<void> {
  const sort_order = (await maxArticleSort(params.folderId)) + 1
  const now = new Date().toISOString()
  const { error: catalogError } = await supabase.from('knowledge_catalog').insert({
    id: params.id,
    kind: 'article',
    folder_id: params.folderId,
    title: params.title,
    icon: '📁',
    sort_order,
    updated_at: now,
  })
  if (catalogError) throw catalogError

  const { error: contentError } = await supabase.from('knowledge_article_contents').insert({
    article_id: params.id,
    content: params.content,
    updated_at: now,
  })
  if (contentError) throw contentError
}

export async function updateArticleRow(params: {
  id: string
  title?: string
  content?: string
  folderId?: string
  previousFolderId?: string
}): Promise<void> {
  const now = new Date().toISOString()
  const catalogRow: Record<string, unknown> = { updated_at: now }
  if (params.title !== undefined) catalogRow.title = params.title

  const moving =
    params.folderId != null &&
    params.previousFolderId != null &&
    params.folderId !== params.previousFolderId
  if (moving) {
    catalogRow.folder_id = params.folderId
    catalogRow.sort_order = (await maxArticleSort(params.folderId!)) + 1
  }

  if (Object.keys(catalogRow).length > 1) {
    const { error } = await supabase
      .from('knowledge_catalog')
      .update(catalogRow)
      .eq('id', params.id)
      .eq('kind', 'article')
    if (error) throw error
  }

  if (params.content !== undefined) {
    const { error } = await supabase
      .from('knowledge_article_contents')
      .upsert({
        article_id: params.id,
        content: params.content,
        updated_at: now,
      })
    if (error) throw error
  }
}

export async function removeArticle(id: string): Promise<void> {
  const { error } = await supabase.from('knowledge_catalog').delete().eq('id', id).eq('kind', 'article')
  if (error) throw error
}
