import { supabase } from '@/lib/supabase'
import type { Note, NoteCategory } from '@/types'
import dayjs from 'dayjs'

export interface NoteQuery {
  category?: NoteCategory
  q?: string
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

export const noteApi = {
  async getList(params?: NoteQuery): Promise<Note[]> {
    let query = supabase.from('notes').select('*').order('pinned', { ascending: false }).order('updated_at', { ascending: false })
    if (params?.category) query = query.eq('category', params.category)
    if (params?.q) query = query.or(`title.ilike.%${params.q}%,content.ilike.%${params.q}%`)
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
