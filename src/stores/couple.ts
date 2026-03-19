import { defineStore } from 'pinia'
import { ref } from 'vue'
import { coupleApi } from '@/api'
import type { CoupleMemory } from '@/types'
import dayjs from 'dayjs'
void dayjs // suppress unused warning

export const useCoupleStore = defineStore('couple', () => {
  const memories = ref<CoupleMemory[]>([])
  const loading = ref(false)

  async function fetchMemories(type?: string) {
    loading.value = true
    try {
      memories.value = await coupleApi.getMemories(type)
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<CoupleMemory, 'id'>) {
    const memory = await coupleApi.createMemory(data)
    memories.value.unshift(memory)
    return memory
  }

  async function update(id: string, data: Partial<CoupleMemory>) {
    const memory = await coupleApi.updateMemory(id, data)
    const idx = memories.value.findIndex(m => m.id === id)
    if (idx !== -1) memories.value[idx] = memory
    return memory
  }

  async function remove(id: string) {
    await coupleApi.removeMemory(id)
    memories.value = memories.value.filter(m => m.id !== id)
  }

  return { memories, loading, fetchMemories, create, update, remove }
})
