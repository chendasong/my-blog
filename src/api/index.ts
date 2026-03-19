import { supabase } from '@/lib/supabase'

// 通用图片上传（文章封面等）
export async function uploadImage(file: File, bucket = 'images'): Promise<string> {
  const ext = file.name.split('.').pop()
  const fileName = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data.publicUrl
}

export { articleApi } from './articles'
export { noteApi } from './notes'
export { coupleApi } from './couple'
export { supabase } from '@/lib/supabase'
