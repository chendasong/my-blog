import { supabase } from '@/lib/supabase'
import type { Note, NoteCategory } from '@/types'
import dayjs from 'dayjs'

export interface NoteQuery {
  category?: NoteCategory
  q?: string
}

export interface NotePageParams extends NoteQuery {
  limit: number
  offset: number
}

export interface NotePageResult {
  items: Note[]
  total: number
}

function toNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    category: row.category as NoteCategory,
    tags: row.tags as string[],
    color: row.color as string,
    pinned: row.pinned as boolean,
    createdAt: dayjs(row.created_at as string).format('YYYY-MM-DD'),
    updatedAt: dayjs(row.updated_at as string).format('YYYY-MM-DD'),
  }
}

function applyNoteFilters(query: {
  order: (c: string, o: { ascending: boolean }) => typeof query
  eq: (c: string, v: string) => typeof query
  or: (f: string) => typeof query
}, params?: NoteQuery) {
  let q = query
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })
  if (params?.category) q = q.eq('category', params.category)
  if (params?.q) q = q.or(`title.ilike.%${params.q}%,content.ilike.%${params.q}%`)
  return q
}

export const noteApi = {
  async getPage(params: NotePageParams): Promise<NotePageResult> {
    const { limit, offset, ...rest } = params
    const from = Math.max(0, offset)
    const to = from + Math.max(1, limit) - 1
    let query = supabase.from('notes').select('*', { count: 'exact' })
    query = applyNoteFilters(query, rest)
    const { data, error, count } = await query.range(from, to)
    if (error) throw error
    return {
      items: (data ?? []).map(toNote),
      total: count ?? 0,
    }
  },

  async getList(params?: NoteQuery): Promise<Note[]> {
    let query = supabase.from('notes').select('*')
    query = applyNoteFilters(query, params)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(toNote)
  },

  async getById(id: string): Promise<Note> {
    const { data, error } = await supabase.from('notes').select('*').eq('id', id).single()
    if (error) throw error
    return toNote(data)
  },

  async create(input: Omit<Note, 'id'>): Promise<Note> {
    const { data, error } = await supabase.from('notes').insert({
      title: input.title,
      content: input.content,
      category: input.category,
      tags: input.tags,
      color: input.color,
      pinned: input.pinned ?? false,
    }).select().single()
    if (error) throw error
    return toNote(data)
  },

  async update(id: string, input: Partial<Note>): Promise<Note> {
    const { data, error } = await supabase.from('notes').update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.pinned !== undefined && { pinned: input.pinned }),
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single()
    if (error) throw error
    return toNote(data)
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) throw error
  },

  async togglePin(id: string, pinned: boolean): Promise<Note> {
    return this.update(id, { pinned: !pinned })
  },
}
