import { supabase } from '@/lib/supabase'
import type { KnowledgeArticle, KnowledgeFolder } from '@/types/aiKnowledge'

function isoDateOnly(ts: string | null | undefined): string {
  if (!ts) return new Date().toISOString().slice(0, 10)
  return ts.slice(0, 10)
}

interface FolderRow {
  id: string
  title: string
  icon: string
  sort_order: number
  created_at: string
  updated_at: string
}

interface ArticleRow {
  id: string
  folder_id: string
  title: string
  content: string
  sort_order: number
  created_at: string
  updated_at: string
}

export async function fetchKnowledgeLibrary(): Promise<{
  folders: KnowledgeFolder[]
  articles: Record<string, KnowledgeArticle>
}> {
  const { data: folderRows, error: e1 } = await supabase
    .from('knowledge_folders')
    .select('*')
    .order('sort_order', { ascending: true })
  if (e1) throw e1

  const { data: articleRows, error: e2 } = await supabase.from('knowledge_articles').select('*')
  if (e2) throw e2

  const folderRowsOrdered = (folderRows ?? []) as FolderRow[]
  const arts = (articleRows ?? []) as ArticleRow[]
  const articles: Record<string, KnowledgeArticle> = {}
  const folderArticleIds = new Map<string, string[]>()

  for (const f of folderRowsOrdered) {
    const inFolder = arts
      .filter((a) => a.folder_id === f.id)
      .sort((a, b) => a.sort_order - b.sort_order)
    const ids: string[] = []
    for (const r of inFolder) {
      ids.push(r.id)
      articles[r.id] = {
        id: r.id,
        folderId: r.folder_id,
        title: r.title,
        content: r.content,
        updatedAt: isoDateOnly(r.updated_at),
      }
    }
    folderArticleIds.set(f.id, ids)
  }

  const folders: KnowledgeFolder[] = folderRowsOrdered.map((f) => ({
    id: f.id,
    title: f.title,
    icon: f.icon,
    articleIds: folderArticleIds.get(f.id) ?? [],
  }))

  return { folders, articles }
}

async function maxFolderSort(): Promise<number> {
  const { data } = await supabase
    .from('knowledge_folders')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return typeof data?.sort_order === 'number' ? data.sort_order : -1
}

async function maxArticleSort(folderId: string): Promise<number> {
  const { data } = await supabase
    .from('knowledge_articles')
    .select('sort_order')
    .eq('folder_id', folderId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return typeof data?.sort_order === 'number' ? data.sort_order : -1
}

export async function insertFolder(id: string, title: string, icon: string): Promise<void> {
  const sort_order = (await maxFolderSort()) + 1
  const { error } = await supabase.from('knowledge_folders').insert({
    id,
    title,
    icon,
    sort_order,
  })
  if (error) throw error
}

export async function updateFolder(id: string, patch: { title?: string; icon?: string }): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.title !== undefined) row.title = patch.title
  if (patch.icon !== undefined) row.icon = patch.icon
  const { error } = await supabase.from('knowledge_folders').update(row).eq('id', id)
  if (error) throw error
}

export async function removeFolder(id: string): Promise<void> {
  const { error } = await supabase.from('knowledge_folders').delete().eq('id', id)
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
  const { error } = await supabase.from('knowledge_articles').insert({
    id: params.id,
    folder_id: params.folderId,
    title: params.title,
    content: params.content,
    sort_order,
    updated_at: now,
  })
  if (error) throw error
}

export async function updateArticleRow(params: {
  id: string
  title?: string
  content?: string
  folderId?: string
  previousFolderId?: string
}): Promise<void> {
  const now = new Date().toISOString()
  const row: Record<string, unknown> = { updated_at: now }
  if (params.title !== undefined) row.title = params.title
  if (params.content !== undefined) row.content = params.content

  const moving =
    params.folderId != null &&
    params.previousFolderId != null &&
    params.folderId !== params.previousFolderId
  if (moving) {
    row.folder_id = params.folderId
    row.sort_order = (await maxArticleSort(params.folderId!)) + 1
  }

  const { error } = await supabase.from('knowledge_articles').update(row).eq('id', params.id)
  if (error) throw error
}

export async function removeArticle(id: string): Promise<void> {
  const { error } = await supabase.from('knowledge_articles').delete().eq('id', id)
  if (error) throw error
}
