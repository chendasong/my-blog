import { supabase } from '@/lib/supabase'
import { uploadImageSmart, deleteRemoteStorageFile, isHostedStorageAssetUrl } from '@/lib/qiniuClient'
import type { CoupleMemory } from '@/types'

function parseJsonStringArray(raw: unknown): string[] | undefined {
  if (raw == null) return undefined
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string')
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown
      return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

function toMemory(row: Record<string, unknown>): CoupleMemory {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    image: row.image as string,
    images: parseJsonStringArray(row.images),
    videos: parseJsonStringArray(row.videos),
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
      videos: input.videos?.length ? input.videos : null,
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
    if (input.videos !== undefined) updateData.videos = input.videos?.length ? input.videos : null
    if (input.date !== undefined) updateData.date = input.date || null
    if (input.type !== undefined) updateData.type = input.type
    if (input.emotion !== undefined) updateData.emotion = input.emotion
    
    const { data, error } = await supabase.from('couple_memories').update(updateData).eq('id', id).select().single()
    if (error) throw error
    return toMemory(data)
  },

  async removeMemory(id: string): Promise<void> {
    const { data, error: selErr } = await supabase
      .from('couple_memories')
      .select('image, images, videos')
      .eq('id', id)
      .maybeSingle()
    if (selErr) throw selErr

    const urls = new Set<string>()
    if (data?.image && typeof data.image === 'string' && isHostedStorageAssetUrl(data.image)) {
      urls.add(data.image.trim())
    }
    let list: unknown[] = []
    if (data?.images != null) {
      if (typeof data.images === 'string') {
        try {
          list = JSON.parse(data.images) as unknown[]
        } catch {
          list = []
        }
      } else if (Array.isArray(data.images)) {
        list = data.images as unknown[]
      }
    }
    for (const item of list) {
      if (typeof item === 'string' && isHostedStorageAssetUrl(item)) {
        urls.add(item.trim())
      }
    }
    let vlist: unknown[] = []
    if (data?.videos != null) {
      if (typeof data.videos === 'string') {
        try {
          vlist = JSON.parse(data.videos) as unknown[]
        } catch {
          vlist = []
        }
      } else if (Array.isArray(data.videos)) {
        vlist = data.videos as unknown[]
      }
    }
    for (const item of vlist) {
      if (typeof item === 'string' && isHostedStorageAssetUrl(item)) {
        urls.add(item.trim())
      }
    }

    const { error } = await supabase.from('couple_memories').delete().eq('id', id)
    if (error) throw error

    for (const url of urls) {
      try {
        await deleteRemoteStorageFile(url)
      } catch (e) {
        console.warn('[couple] 删除记忆后清理文件失败', url, e)
      }
    }
  },

  async deleteFile(fileUrl: string): Promise<void> {
    await deleteRemoteStorageFile(fileUrl)
  },

  // 删除多个文件
  async deleteFiles(fileUrls: string[]): Promise<void> {
    for (const url of fileUrls) {
      await this.deleteFile(url)
    }
  },

  /** 记忆图片/视频等上传（七牛或 Supabase）；prefix 作为对象键目录段 */
  async uploadImage(file: File, prefix: string = 'memory'): Promise<string> {
    const safe = prefix.replace(/[/\\]/g, '-')
    return uploadImageSmart(file, `memories/${safe}`)
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
