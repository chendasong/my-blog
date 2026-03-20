import { supabase } from '@/lib/supabase'
import type { CoupleMemory } from '@/types'

function toMemory(row: Record<string, unknown>): CoupleMemory {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    image: row.image as string,
    images: row.images ? (typeof row.images === 'string' ? JSON.parse(row.images) : row.images) : undefined,
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
      images: input.images ? JSON.stringify(input.images) : null,
      date: input.date || null,
      type: input.type,
      emotion: input.emotion,
    }).select().single()
    if (error) throw error
    return toMemory(data)
  },

  async updateMemory(id: string, input: Partial<CoupleMemory>): Promise<CoupleMemory> {
    const updateData: Record<string, any> = {}
    
    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.image !== undefined) updateData.image = input.image
    if (input.images !== undefined) updateData.images = input.images ? JSON.stringify(input.images) : null
    if (input.date !== undefined) updateData.date = input.date || null
    if (input.type !== undefined) updateData.type = input.type
    if (input.emotion !== undefined) updateData.emotion = input.emotion
    
    const { data, error } = await supabase.from('couple_memories').update(updateData).eq('id', id).select().single()
    if (error) throw error
    return toMemory(data)
  },

  async removeMemory(id: string): Promise<void> {
    const { error } = await supabase.from('couple_memories').delete().eq('id', id)
    if (error) throw error
  },

  // 删除存储中的文件
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // 从URL中提取文件路径
      // URL格式: https://xxx.supabase.co/storage/v1/object/public/images/memory-xxx.ext
      const url = new URL(fileUrl)
      const pathname = url.pathname
      
      // 方法1: 尝试从 /storage/v1/object/public/images/ 后面提取
      let filePath = ''
      if (pathname.includes('/storage/v1/object/public/images/')) {
        filePath = pathname.split('/storage/v1/object/public/images/')[1]
      } else if (pathname.includes('/images/')) {
        // 方法2: 如果是简化路径，直接从 /images/ 后面提取
        filePath = pathname.split('/images/')[1]
      }
      
      if (filePath) {
        console.log('删除文件:', filePath)
        const { error } = await supabase.storage.from('images').remove([filePath])
        if (error) {
          console.error('删除文件失败:', error)
        } else {
          console.log('文件删除成功:', filePath)
        }
      } else {
        console.warn('无法从URL提取文件路径:', fileUrl)
      }
    } catch (err) {
      console.error('删除文件出错:', err)
    }
  },

  // 删除多个文件
  async deleteFiles(fileUrls: string[]): Promise<void> {
    for (const url of fileUrls) {
      await this.deleteFile(url)
    }
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

  // 比较并删除不再使用的图片
  async cleanupUnusedImages(oldImages: string[] | undefined, newImages: string[] | undefined): Promise<void> {
    if (!oldImages || oldImages.length === 0) return
    
    const oldSet = new Set(oldImages)
    const newSet = new Set(newImages || [])
    
    const unusedImages = Array.from(oldSet).filter(url => !newSet.has(url))
    if (unusedImages.length > 0) {
      await this.deleteFiles(unusedImages)
    }
  },
}
