import { supabase } from '@/lib/supabase'
import type { CoupleMemory } from '@/types'

function toMemory(row: Record<string, unknown>): CoupleMemory {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    image: row.image as string,
    date: row.date as string,
    type: row.type as CoupleMemory['type'],
    emotion: row.emotion as CoupleMemory['emotion'],
  }
}

export const coupleApi = {
  async getMemories(type?: string): Promise<CoupleMemory[]> {
    let query = supabase.from('couple_memories').select('*').order('date', { ascending: false })
    if (type && type !== 'all') query = query.eq('type', type)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(toMemory)
  },

  async createMemory(input: Omit<CoupleMemory, 'id'>): Promise<CoupleMemory> {
    const { data, error } = await supabase.from('couple_memories').insert({
      title: input.title,
      description: input.description,
      image: input.image,
      date: input.date || null,
      type: input.type,
      emotion: input.emotion,
    }).select().single()
    if (error) throw error
    return toMemory(data)
  },

  async updateMemory(id: string, input: Partial<CoupleMemory>): Promise<CoupleMemory> {
    const { data, error } = await supabase.from('couple_memories').update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.image !== undefined && { image: input.image }),
      ...(input.date !== undefined && { date: input.date || null }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.emotion !== undefined && { emotion: input.emotion }),
    }).eq('id', id).select().single()
    if (error) throw error
    return toMemory(data)
  },

  async removeMemory(id: string): Promise<void> {
    const { error } = await supabase.from('couple_memories').delete().eq('id', id)
    if (error) throw error
  },

  // 上传图片到 Supabase Storage
  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const fileName = `memory-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (error) throw error
    const { data } = supabase.storage.from('images').getPublicUrl(fileName)
    return data.publicUrl
  },
}
