<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  musicUrls?: string
}

const props = withDefaults(defineProps<Props>(), {
  musicUrls: '',
})

const isPlaying = ref(false)
const isExpanded = ref(false)
const showPlaylist = ref(false)
const currentTrackIndex = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.7)
const audioRef = ref<HTMLAudioElement | null>(null)

// 拖动相关
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const position = ref({ x: 24, y: 'auto', bottom: 24 })

const playlist = computed(() => {
  if (!props.musicUrls) return []
  return props.musicUrls
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0)
})

const currentTrack = computed(() => {
  return playlist.value[currentTrackIndex.value] || ''
})

const hasMusic = computed(() => playlist.value.length > 0)

const formattedTime = computed(() => {
  const format = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  return `${format(currentTime.value)} / ${format(duration.value)}`
})

const progress = computed(() => {
  return duration.value ? (currentTime.value / duration.value) * 100 : 0
})

watch(
  () => props.musicUrls,
  () => {
    if (currentTrack.value && audioRef.value) {
      audioRef.value.src = currentTrack.value
      audioRef.value.load()
    }
  },
)

onMounted(() => {
  if (currentTrack.value && audioRef.value) {
    audioRef.value.src = currentTrack.value
  }
})

const togglePlay = () => {
  if (!audioRef.value || !hasMusic.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const nextTrack = () => {
  if (!hasMusic.value) return
  currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.value.length
  if (audioRef.value) {
    audioRef.value.src = currentTrack.value
    audioRef.value.load()
    if (isPlaying.value) {
      audioRef.value.play()
    }
  }
}

const prevTrack = () => {
  if (!hasMusic.value) return
  currentTrackIndex.value = (currentTrackIndex.value - 1 + playlist.value.length) % playlist.value.length
  if (audioRef.value) {
    audioRef.value.src = currentTrack.value
    audioRef.value.load()
    if (isPlaying.value) {
      audioRef.value.play()
    }
  }
}

const selectTrack = (index: number) => {
  currentTrackIndex.value = index
  if (audioRef.value) {
    audioRef.value.src = currentTrack.value
    audioRef.value.load()
    if (isPlaying.value) {
      audioRef.value.play()
    }
  }
}

const handleTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime
  }
}

const handleLoadedMetadata = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration
  }
}

const handleEnded = () => {
  nextTrack()
}

const handleProgressClick = (e: MouseEvent) => {
  if (!audioRef.value || !duration.value) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  audioRef.value.currentTime = percent * duration.value
}

const handleVolumeChange = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  volume.value = parseFloat(value)
  if (audioRef.value) {
    audioRef.value.volume = volume.value
  }
}

const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  const newX = e.clientX - dragOffset.value.x
  const newY = e.clientY - dragOffset.value.y
  position.value = { x: newX, y: newY, bottom: 'auto' }
}

const handleMouseUp = () => {
  isDragging.value = false
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  return () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
})
</script>

<template>
  <div v-if="hasMusic" class="music-player" :style="{ left: position.x + 'px', top: position.y, bottom: position.bottom }" :class="{ 'music-player--dragging': isDragging }">
    <audio
      ref="audioRef"
      :src="currentTrack"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @ended="handleEnded"
    />

    <div class="music-player__button" @mousedown="handleMouseDown" @click="isExpanded = !isExpanded">
      <div class="music-player__icon">
        <span v-if="!isPlaying" class="icon">🎵</span>
        <span v-else class="icon playing">🎶</span>
      </div>
      <div v-if="playlist.length > 1" class="music-player__badge">{{ currentTrackIndex + 1 }}/{{ playlist.length }}</div>
    </div>

    <transition name="slide-up">
      <div v-if="isExpanded" class="music-player__panel" @mousedown.stop>
        <div class="music-player__header">
          <h4 class="music-player__title">🎵 播放列表</h4>
          <button class="music-player__close" @click="isExpanded = false">✕</button>
        </div>

        <div class="music-player__controls">
          <button class="music-player__control-btn" @click="prevTrack" :disabled="playlist.length <= 1">⏮</button>
          <button class="music-player__play-btn" @click="togglePlay">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
          <button class="music-player__control-btn" @click="nextTrack" :disabled="playlist.length <= 1">⏭</button>
        </div>

        <div class="music-player__progress-container">
          <div class="music-player__progress" @click="handleProgressClick">
            <div class="music-player__progress-bar" :style="{ width: progress + '%' }" />
          </div>
          <span class="music-player__time">{{ formattedTime }}</span>
        </div>

        <div class="music-player__volume">
          <span class="music-player__volume-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            :value="volume"
            class="music-player__volume-slider"
            @change="handleVolumeChange"
          />
        </div>

        <div class="music-player__playlist-toggle">
          <button class="music-player__playlist-btn" @click="showPlaylist = !showPlaylist">
            {{ showPlaylist ? '隐藏' : '显示' }}播放列表
          </button>
        </div>

        <transition name="fade">
          <div v-if="showPlaylist" class="music-player__playlist">
            <div
              v-for="(track, idx) in playlist"
              :key="idx"
              :class="['music-player__playlist-item', { 'music-player__playlist-item--active': idx === currentTrackIndex }]"
              @click="selectTrack(idx)"
            >
              <span class="music-player__playlist-index">{{ idx + 1 }}</span>
              <span class="music-player__playlist-name">{{ track.split('/').pop()?.split('?')[0] || `音乐 ${idx + 1}` }}</span>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.music-player {
  position: fixed;
  z-index: 999;
  user-select: none;
}

.music-player--dragging {
  cursor: grabbing;
}

.music-player__button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8af0 0%, #8b6ff0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 4px 16px rgba(91, 138, 240, 0.3);
  transition: all var(--transition-base);
  position: relative;
}

.music-player__button:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(91, 138, 240, 0.4);
}

.music-player__button:active {
  cursor: grabbing;
}

.music-player__icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon.playing {
  animation: bounce-music 0.6s ease-in-out infinite;
}

@keyframes bounce-music {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.music-player__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #E8607A;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  min-width: 28px;
  text-align: center;
}

.music-player__panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-xl);
  padding: 16px;
  box-shadow: 0 8px 32px rgba(91, 138, 240, 0.2);
  border: 1px solid rgba(91, 138, 240, 0.1);
}

.music-player__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.music-player__title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.music-player__close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
}

.music-player__close:hover {
  color: var(--color-text-primary);
}

.music-player__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.music-player__control-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(91, 138, 240, 0.1);
  border: 1px solid rgba(91, 138, 240, 0.2);
  color: var(--color-text-primary);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.music-player__control-btn:hover:not(:disabled) {
  background: rgba(91, 138, 240, 0.2);
  border-color: rgba(91, 138, 240, 0.3);
}

.music-player__control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.music-player__play-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8af0 0%, #8b6ff0 100%);
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.music-player__play-btn:hover {
  transform: scale(1.05);
}

.music-player__progress-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.music-player__progress {
  height: 4px;
  background: rgba(91, 138, 240, 0.1);
  border-radius: 2px;
  cursor: pointer;
  overflow: hidden;
}

.music-player__progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #5b8af0 0%, #8b6ff0 100%);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.music-player__time {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-align: right;
}

.music-player__volume {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.music-player__volume-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.music-player__volume-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(91, 138, 240, 0.1);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.music-player__volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8af0 0%, #8b6ff0 100%);
  cursor: pointer;
}

.music-player__volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8af0 0%, #8b6ff0 100%);
  cursor: pointer;
  border: none;
}

.music-player__playlist-toggle {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid rgba(91, 138, 240, 0.1);
}

.music-player__playlist-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--text-xs);
  cursor: pointer;
  font-weight: 600;
  transition: color var(--transition-fast);
}

.music-player__playlist-btn:hover {
  color: #8b6ff0;
}

.music-player__playlist {
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid rgba(91, 138, 240, 0.1);
  padding-top: 8px;
}

.music-player__playlist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.music-player__playlist-item:hover {
  background: rgba(91, 138, 240, 0.1);
}

.music-player__playlist-item--active {
  background: rgba(91, 138, 240, 0.15);
  color: var(--color-primary);
  font-weight: 600;
}

.music-player__playlist-index {
  min-width: 20px;
  text-align: center;
  color: var(--color-text-muted);
}

.music-player__playlist-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--transition-base);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .music-player {
    bottom: 16px;
    right: 16px;
  }

  .music-player__panel {
    width: 280px;
  }
}
</style>
