import { supabase } from '@/lib/supabase'
import {
  deleteRemoteStorageFile,
  extractImageUrlsFromArticleContent,
  isHostedStorageAssetUrl,
} from '@/lib/qiniuClient'
import type { Article } from '@/types'

export interface ArticleQuery {
  category?: string
  q?: string
  featured?: boolean
}

export interface ArticlePageParams extends ArticleQuery {
  limit: number
  offset: number
}

export interface PageResult<T> {
  items: T[]
  total: number
}

// 将 Supabase 行数据转换为前端 Article 类型
function toArticle(row: Record<string, unknown>): Article {
  return {
    id: row.id as string,
    title: row.title as string,
    summary: row.summary as string,
    content: row.content as string,
    cover: row.cover as string,
    category: row.category as string,
    tags: row.tags as string[],
    author: row.author as string,
    featured: row.featured as boolean,
    views: row.views as number,
    likes: row.likes as number,
    comments: row.comments as number,
    publishedAt: row.published_at as string,
    updatedAt: row.updated_at as string,
  }
}

function applyArticleFilters(query: {
  order: (c: string, o: { ascending: boolean }) => typeof query
  eq: (c: string, v: string | boolean) => typeof query
  or: (f: string) => typeof query
}, params?: ArticleQuery) {
  let q = query.order('published_at', { ascending: false })
  if (params?.category) q = q.eq('category', params.category)
  if (params?.featured) q = q.eq('featured', true)
  if (params?.q) q = q.or(`title.ilike.%${params.q}%,summary.ilike.%${params.q}%`)
  return q
}

export const articleApi = {
  /** 分页列表（列表页使用） */
  async getPage(params: ArticlePageParams): Promise<PageResult<Article>> {
    const { limit, offset, ...rest } = params
    const from = Math.max(0, offset)
    const to = from + Math.max(1, limit) - 1
    let query = supabase.from('articles').select('*', { count: 'exact' })
    query = applyArticleFilters(query, rest)
    const { data, error, count } = await query.range(from, to)
    if (error) throw error
    return {
      items: (data ?? []).map(toArticle),
      total: count ?? 0,
    }
  },

  /** 全量（首页统计等少量场景；大库慎用） */
  async getList(params?: ArticleQuery): Promise<Article[]> {
    let query = supabase.from('articles').select('*')
    query = applyArticleFilters(query, params)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(toArticle)
  },

  async getById(id: string): Promise<Article> {
    const { data, error } = await supabase.from('articles').select('*').eq('id', id).single()
    if (error) throw error
    // 增加阅读数
    supabase.from('articles').update({ views: (data.views ?? 0) + 1 }).eq('id', id).then(() => {})
    return toArticle(data)
  },

  async create(input: Omit<Article, 'id'>): Promise<Article> {
    const { data, error } = await supabase.from('articles').insert({
      title: input.title,
      summary: input.summary,
      content: input.content,
      cover: input.cover,
      category: input.category,
      tags: input.tags,
      author: input.author,
      featured: input.featured,
      views: 0,
      likes: 0,
      comments: 0,
    }).select().single()
    if (error) throw error
    return toArticle(data)
  },

  async update(id: string, input: Partial<Article>): Promise<Article> {
    const { data, error } = await supabase.from('articles').update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.summary !== undefined && { summary: input.summary }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.cover !== undefined && { cover: input.cover }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.featured !== undefined && { featured: input.featured }),
      ...(input.likes !== undefined && { likes: input.likes }),
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single()
    if (error) throw error
    return toArticle(data)
  },

  async remove(id: string): Promise<void> {
    const { data, error: selErr } = await supabase
      .from('articles')
      .select('cover,content')
      .eq('id', id)
      .maybeSingle()
    if (selErr) throw selErr

    const urls = new Set<string>()
    const cover = data?.cover
    if (typeof cover === 'string' && isHostedStorageAssetUrl(cover)) {
      urls.add(cover.trim())
    }
    const content = typeof data?.content === 'string' ? data.content : ''
    for (const u of extractImageUrlsFromArticleContent(content)) {
      if (isHostedStorageAssetUrl(u)) urls.add(u)
    }

    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (error) throw error

    for (const url of urls) {
      try {
        await deleteRemoteStorageFile(url)
      } catch (e) {
        console.warn('[articles] 删除文章后清理文件失败', url, e)
      }
    }
  },

  async like(id: string, currentLikes: number): Promise<Article> {
    return this.update(id, { likes: currentLikes + 1 })
  },
}
