<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  musicUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  musicUrl: '',
})

const isPlaying = ref(false)
const isExpanded = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.7)
const audioRef = ref<HTMLAudioElement | null>(null)

const hasMusic = computed(() => !!props.musicUrl)

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
  () => props.musicUrl,
  (newUrl) => {
    if (newUrl && audioRef.value) {
      audioRef.value.src = newUrl
      audioRef.value.load()
    }
  },
)

const togglePlay = () => {
  if (!audioRef.value || !hasMusic.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
  isPlaying.value = !isPlaying.value
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
  isPlaying.value = false
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
</script>

<template>
  <div v-if="hasMusic" class="music-player" :class="{ 'music-player--expanded': isExpanded }">
    <audio
      ref="audioRef"
      :src="musicUrl"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @ended="handleEnded"
    />

    <div class="music-player__button" @click="isExpanded = !isExpanded">
      <div class="music-player__icon">
        <span v-if="!isPlaying" class="icon">🎵</span>
        <span v-else class="icon playing">🎶</span>
      </div>
    </div>

    <transition name="slide-up">
      <div v-if="isExpanded" class="music-player__panel">
        <div class="music-player__header">
          <h4 class="music-player__title">背景音乐</h4>
          <button class="music-player__close" @click="isExpanded = false">✕</button>
        </div>

        <div class="music-player__controls">
          <button class="music-player__play-btn" @click="togglePlay">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
          <div class="music-player__progress-container">
            <div class="music-player__progress" @click="handleProgressClick">
              <div class="music-player__progress-bar" :style="{ width: progress + '%' }" />
            </div>
            <span class="music-player__time">{{ formattedTime }}</span>
          </div>
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
      </div>
    </transition>
  </div>
</template>

<style scoped>
.music-player {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999;
}

.music-player__button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-ui-gradient-mid) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-primary) 30%, transparent);
  transition: all var(--transition-base);
}

.music-player__button:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-primary) 40%, transparent);
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
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.music-player__panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-xl);
  padding: 16px;
  box-shadow: 0 8px 32px color-mix(in srgb, var(--color-primary) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 10%, transparent);
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
  gap: 12px;
  margin-bottom: 16px;
}

.music-player__play-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-ui-gradient-mid) 100%);
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.music-player__play-btn:hover {
  transform: scale(1.05);
}

.music-player__progress-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.music-player__progress {
  height: 4px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-radius: 2px;
  cursor: pointer;
  overflow: hidden;
}

.music-player__progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-ui-gradient-mid) 100%);
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
}

.music-player__volume-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.music-player__volume-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
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
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-ui-gradient-mid) 100%);
  cursor: pointer;
}

.music-player__volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-ui-gradient-mid) 100%);
  cursor: pointer;
  border: none;
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

@media (max-width: 768px) {
  .music-player {
    bottom: 16px;
    right: 16px;
  }

  .music-player__panel {
    width: 240px;
  }
}
</style>
