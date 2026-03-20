<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Track {
  url: string
  name: string
}

interface Props {
  musicUrls?: string
  musicNames?: string
}

const props = withDefaults(defineProps<Props>(), {
  musicUrls: '',
  musicNames: '',
})

// 播放状态
const isPlaying = ref(false)
const isExpanded = ref(false)
const showPlaylist = ref(false)
const currentTrackIndex = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.7)
const audioRef = ref<HTMLAudioElement | null>(null)
const loopMode = ref<'off' | 'all' | 'one'>('all') // off: 不循环, all: 列表循环, one: 单曲循环

// 拖动状态
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const position = ref({ x: window.innerWidth - 80, y: window.innerHeight / 2 - 28, bottom: 'auto' })
let dragStartX = 0
let dragStartY = 0
let dragStartPosX = 0
let dragStartPosY = 0

const panelPosition = computed(() => {
  const windowWidth = window.innerWidth
  const playerWidth = 56
  const panelWidth = 320
  const centerX = (typeof position.value.x === 'number' ? position.value.x : 24) + playerWidth / 2
  
  // 如果按钮在左半边，面板显示在右边；如果在右半边，面板显示在左边
  if (centerX < windowWidth / 2) {
    // 按钮在左边，面板显示在右边
    return { right: 'auto', left: (typeof position.value.x === 'number' ? position.value.x : 24) + playerWidth + 8 + 'px' }
  } else {
    // 按钮在右边，面板显示在左边
    return { left: 'auto', right: windowWidth - (typeof position.value.x === 'number' ? position.value.x : 24) + 8 + 'px' }
  }
})

// 音波动画
const audioBars = ref([0, 0, 0, 0, 0])
let animationFrameId: number | null = null

const STORAGE_KEY = 'music_player_state'

const playlist = computed(() => {
  if (!props.musicUrls) return []
  const urls = props.musicUrls
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0)
  
  const names = props.musicNames
    ? props.musicNames
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0)
    : []
  
  return urls.map((url, idx) => ({
    url,
    name: names[idx] || url.split('/').pop()?.split('?')[0] || `音乐 ${idx + 1}`,
  }))
})

const currentTrack = computed(() => {
  return playlist.value[currentTrackIndex.value] || null
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

// 保存播放状态
const saveState = () => {
  if (!hasMusic.value) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    trackIndex: currentTrackIndex.value,
    isPlaying: isPlaying.value,
    currentTime: currentTime.value,
  }))
}

// 恢复播放状态
const restoreState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const state = JSON.parse(saved)
      if (state.trackIndex < playlist.value.length) {
        currentTrackIndex.value = state.trackIndex
        currentTime.value = state.currentTime || 0
      }
    }
  } catch (e) {
    console.error('Failed to restore player state:', e)
  }
}

// 音波动画
const updateAudioBars = () => {
  if (!audioRef.value || !isPlaying.value) {
    audioBars.value = [0, 0, 0, 0, 0]
    return
  }
  
  audioBars.value = audioBars.value.map(() => Math.random() * 100)
  animationFrameId = requestAnimationFrame(updateAudioBars)
}

watch(isPlaying, (playing) => {
  if (playing) {
    updateAudioBars()
  } else {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    audioBars.value = [0, 0, 0, 0, 0]
  }
})

watch(currentTrackIndex, () => {
  saveState()
})

watch(
  () => props.musicUrls,
  () => {
    if (currentTrack.value && audioRef.value) {
      audioRef.value.src = currentTrack.value.url
      audioRef.value.load()
    }
  },
)

watch(
  () => [props.musicUrls, props.musicNames],
  () => {
    // 当props改变时，重新计算playlist
  },
  { deep: true }
)

onMounted(() => {
  restoreState()
  if (currentTrack.value && audioRef.value) {
    audioRef.value.src = currentTrack.value.url
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
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
  saveState()
}

const nextTrack = () => {
  if (!hasMusic.value) return
  currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.value.length
  if (audioRef.value) {
    audioRef.value.src = currentTrack.value!.url
    audioRef.value.addEventListener('canplay', () => {
      if (isPlaying.value) {
        audioRef.value?.play().catch(err => {
          console.error('播放失败:', err)
        })
      }
    }, { once: true })
    audioRef.value.load()
  }
}

const prevTrack = () => {
  if (!hasMusic.value) return
  currentTrackIndex.value = (currentTrackIndex.value - 1 + playlist.value.length) % playlist.value.length
  if (audioRef.value) {
    audioRef.value.src = currentTrack.value!.url
    audioRef.value.addEventListener('canplay', () => {
      if (isPlaying.value) {
        audioRef.value?.play().catch(err => {
          console.error('播放失败:', err)
        })
      }
    }, { once: true })
    audioRef.value.load()
  }
}

const selectTrack = (index: number) => {
  currentTrackIndex.value = index
  if (audioRef.value) {
    audioRef.value.src = currentTrack.value!.url
    // 等待音频加载完成后再播放
    audioRef.value.addEventListener('canplay', () => {
      audioRef.value?.play().catch(err => {
        console.error('播放失败:', err)
      })
    }, { once: true })
    audioRef.value.load()
    isPlaying.value = true
  }
}

const toggleLoopMode = () => {
  const modes: Array<'off' | 'all' | 'one'> = ['all', 'one', 'off']
  const currentIndex = modes.indexOf(loopMode.value)
  loopMode.value = modes[(currentIndex + 1) % modes.length]
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
  if (loopMode.value === 'one') {
    // 单曲循环
    if (audioRef.value) {
      audioRef.value.currentTime = 0
      audioRef.value.play()
    }
  } else if (loopMode.value === 'all') {
    // 列表循环
    nextTrack()
  } else {
    // 不循环，停止播放
    isPlaying.value = false
  }
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

let volumeChangeTimeout: ReturnType<typeof setTimeout> | null = null
const handleVolumeInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  volume.value = parseFloat(value)
  
  if (volumeChangeTimeout) clearTimeout(volumeChangeTimeout)
  volumeChangeTimeout = setTimeout(() => {
    if (audioRef.value) {
      audioRef.value.volume = volume.value
    }
  }, 50)
}

const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragStartPosX = typeof position.value.x === 'number' ? position.value.x : 24
  dragStartPosY = typeof position.value.y === 'number' ? position.value.y : 24
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  const deltaX = e.clientX - dragStartX
  const deltaY = e.clientY - dragStartY
  
  let newX = dragStartPosX + deltaX
  let newY = dragStartPosY + deltaY
  
  // 边界限制
  newX = Math.max(0, Math.min(newX, window.innerWidth - 56))
  newY = Math.max(0, Math.min(newY, window.innerHeight - 56))
  
  position.value = { x: newX, y: newY, bottom: 'auto' }
}

const handleMouseUp = () => {
  if (!isDragging.value) return
  isDragging.value = false
  
  // 贴边吸附
  const windowWidth = window.innerWidth
  const playerWidth = 56
  const threshold = windowWidth / 2
  
  if (typeof position.value.x === 'number') {
    const centerX = position.value.x + playerWidth / 2
    if (centerX < threshold) {
      position.value = { x: 24, y: position.value.y, bottom: 'auto' }
    } else {
      position.value = { x: windowWidth - playerWidth - 24, y: position.value.y, bottom: 'auto' }
    }
  }
}

const handleButtonClick = (e: MouseEvent) => {
  // 如果是拖动，不触发点击
  if (isDragging.value) return
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div v-if="hasMusic" class="music-player" :style="{ left: position.x + 'px', top: position.y + 'px', bottom: position.bottom }" :class="{ 'music-player--dragging': isDragging }">
    <audio
      ref="audioRef"
      :src="currentTrack?.url"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @ended="handleEnded"
    />

    <div class="music-player__button" @mousedown="handleMouseDown" @click="handleButtonClick">
      <div class="music-player__icon">
        <span v-if="!isPlaying" class="icon">🎵</span>
        <span v-else class="icon rotating">🎶</span>
      </div>
      <div v-if="isPlaying" class="music-player__bars">
        <div v-for="(bar, i) in audioBars" :key="i" class="bar" :style="{ height: bar + '%' }" />
      </div>
    </div>

    <transition name="slide-up">
      <div v-if="isExpanded" class="music-player__panel" :style="panelPosition" @mousedown.stop>
        <div class="music-player__header">
          <h4 class="music-player__title">🎵 {{ currentTrack?.name }}</h4>
          <button class="music-player__close" @click="isExpanded = false">✕</button>
        </div>

        <div class="music-player__controls">
          <button class="music-player__control-btn" @click="prevTrack" :disabled="playlist.length <= 1">⏮</button>
          <button class="music-player__play-btn" @click="togglePlay">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
          <button class="music-player__control-btn" @click="nextTrack" :disabled="playlist.length <= 1">⏭</button>
          <button class="music-player__loop-btn" @click="toggleLoopMode" :title="`循环模式: ${loopMode === 'all' ? '列表循环' : loopMode === 'one' ? '单曲循环' : '不循环'}`">
            {{ loopMode === 'all' ? '🔁' : loopMode === 'one' ? '🔂' : '➡️' }}
          </button>
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
            step="0.01"
            :value="volume"
            class="music-player__volume-slider"
            @input="handleVolumeInput"
          />
        </div>

        <div class="music-player__playlist-toggle">
          <button class="music-player__playlist-btn" @click="showPlaylist = !showPlaylist">
            {{ showPlaylist ? '▼ 隐藏播放列表' : '▶ 显示播放列表' }}
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
              <span class="music-player__playlist-name">{{ track.name }}</span>
              <span v-if="idx === currentTrackIndex" class="music-player__playlist-playing">▶</span>
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
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.music-player--dragging {
  cursor: grabbing;
}

.music-player__button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(91, 138, 240, 0.9) 0%, rgba(139, 111, 240, 0.9) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 8px 32px rgba(91, 138, 240, 0.4);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.music-player__button:hover {
  transform: scale(1.15);
  box-shadow: 0 12px 48px rgba(91, 138, 240, 0.5);
}

.music-player__button:active {
  cursor: grabbing;
}

.music-player__icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.icon.rotating {
  animation: rotate360 2s linear infinite;
}

@keyframes rotate360 {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.music-player__bars {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  padding: 8px;
  border-radius: 50%;
}

.bar {
  width: 3px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
  border-radius: 2px;
  transition: height 0.1s ease;
  min-height: 2px;
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
  border-radius: 999px;
  min-width: 28px;
  text-align: center;
}

.music-player__panel {
  position: absolute;
  bottom: 0;
  width: 320px;
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.music-player__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.music-player__title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.music-player__close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.music-player__close:hover {
  color: rgba(255, 255, 255, 0.9);
}

.music-player__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  position: relative;
}

.music-player__control-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(91, 138, 240, 0.2);
  border: 1px solid rgba(91, 138, 240, 0.3);
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.music-player__control-btn:hover:not(:disabled) {
  background: rgba(91, 138, 240, 0.3);
  border-color: rgba(91, 138, 240, 0.5);
  color: rgba(255, 255, 255, 0.9);
}

.music-player__control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.music-player__loop-btn {
  position: absolute;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(91, 138, 240, 0.2);
  border: 1px solid rgba(91, 138, 240, 0.3);
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.music-player__loop-btn:hover {
  background: rgba(91, 138, 240, 0.3);
  border-color: rgba(91, 138, 240, 0.5);
  color: rgba(255, 255, 255, 0.9);
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
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.music-player__play-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(91, 138, 240, 0.4);
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
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
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
  color: #8b6ff0;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.3s;
}

.music-player__playlist-btn:hover {
  color: #5b8af0;
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
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.music-player__playlist-item:hover {
  background: rgba(91, 138, 240, 0.1);
}

.music-player__playlist-item--active {
  background: rgba(91, 138, 240, 0.2);
  color: #8b6ff0;
  font-weight: 600;
}

.music-player__playlist-index {
  min-width: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
}

.music-player__playlist-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-player__playlist-playing {
  font-size: 0.75rem;
  color: #8b6ff0;
  margin-left: 4px;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
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
