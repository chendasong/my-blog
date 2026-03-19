import { defineStore } from 'pinia'
import { ref } from 'vue'
import { noteApi } from '@/api'
import type { Note, NoteCategory } from '@/types'
import dayjs from 'dayjs'

export const useNoteStore = defineStore('note', () => {
  const notes = ref<Note[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchList(params?: { category?: NoteCategory; q?: string }) {
    loading.value = true
    error.value = null
    try {
      notes.value = await noteApi.getList(params)
    } catch (e) {
      error.value = '加载失败'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Note, 'id'>) {
    const now = dayjs().format('YYYY-MM-DD')
    const note = await noteApi.create({ ...data, createdAt: now, updatedAt: now })
    notes.value.unshift(note)
    return note
  }

  async function update(id: string, data: Partial<Note>) {
    const now = dayjs().format('YYYY-MM-DD')
    const note = await noteApi.update(id, { ...data, updatedAt: now })
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx !== -1) notes.value[idx] = note
    return note
  }

  async function remove(id: string) {
    await noteApi.remove(id)
    notes.value = notes.value.filter(n => n.id !== id)
  }

  async function togglePin(note: Note) {
    const updated = await noteApi.togglePin(note.id, note.pinned)
    const idx = notes.value.findIndex(n => n.id === note.id)
    if (idx !== -1) notes.value[idx] = updated
  }

  return { notes, loading, error, fetchList, create, update, remove, togglePin }
})
