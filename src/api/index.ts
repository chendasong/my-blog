import { uploadImageSmart } from '@/lib/qiniuClient'

/** 通用文件上传：已配置七牛时走 CDN，否则回退 Supabase Storage */
export async function uploadImage(file: File, keyPrefix = 'articles'): Promise<string> {
  return uploadImageSmart(file, keyPrefix)
}

export { articleApi } from './articles'
export { noteApi } from './notes'
export { coupleApi } from './couple'
export { resumeApi } from './resume'
export { supabase } from '@/lib/supabase'
