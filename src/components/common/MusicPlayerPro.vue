<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { onMusicCommand } from '@/lib/musicBridge'
import { snapFabToEdges } from '@/lib/snapFabToEdge'

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
const volume = ref(0.5)
const audioRef = ref<HTMLAudioElement | null>(null)
const loopMode = ref<'shuffle' | 'off' | 'all' | 'one'>('shuffle') // shuffle: 随机播放, off: 不循环, all: 列表循环, one: 单曲循环

/** 随机播放队列：在 shuffle 模式下生效，首曲即随机 */
const shuffleOrder = ref<number[]>([])
const shufflePos = ref(0)

/** 与按钮宽度一致（圆形按钮） */
const PLAYER = 56
const STORAGE_POS = 'music-player-fab-pos'

// 拖动状态（与 AIAssistantFloat 一致：不用 transition 动画 left/top，用 dragMoved 区分点击）
const isDragging = ref(false)
const dragMoved = ref(false)
/** 避免首屏从默认坐标加载存档时触发 left/top 过渡 */
const fabSnapTransitionReady = ref(false)
const position = ref({
  x: typeof window !== 'undefined' ? window.innerWidth - PLAYER - 24 : 400,
  y: typeof window !== 'undefined' ? window.innerHeight - PLAYER - 128 : 400,
})
let dragStartX = 0
let dragStartY = 0
let dragStartPosX = 0
let dragStartPosY = 0

const MUSIC_PANEL_W = 320

/** 与 AI 助手面板相同：fixed 视口坐标，避免相对 .music-player 再叠加 left 导致错位 */
const musicPanelStyle = computed(() => {
  if (typeof window === 'undefined') {
    return {
      position: 'fixed' as const,
      bottom: '120px',
      left: '12px',
      width: '320px',
      maxHeight: 'min(78vh, 520px)',
      zIndex: '10000',
    }
  }
  const vw = window.innerWidth
  const vh = window.innerHeight
  const fabX = position.value.x
  const fabY = position.value.y
  const panelW = Math.min(MUSIC_PANEL_W, vw - 24)
  const margin = 12
  const gap = 8
  const fabCenterX = fabX + PLAYER / 2
  const bottomPx = vh - fabY - PLAYER
  const maxH = Math.min(vh * 0.78, 520)

  const base: Record<string, string> = {
    position: 'fixed',
    bottom: `${bottomPx}px`,
    width: `${panelW}px`,
    maxHeight: `${maxH}px`,
    zIndex: '10000',
    overflowY: 'auto',
    left: 'auto',
    right: 'auto',
  }

  if (fabCenterX < vw / 2) {
    let left = fabX + PLAYER + gap
    if (left + panelW > vw - margin) left = vw - margin - panelW
    if (left < margin) left = margin
    base.left = `${left}px`
  } else {
    const panelLeft = fabX - gap - panelW
    if (panelLeft >= margin) {
      base.right = `${vw - fabX + gap}px`
    } else {
      base.left = `${margin}px`
    }
  }

  return base
})

// 音波动画
const audioBars = ref([0, 0, 0, 0, 0])
let animationFrameId: number | null = null

const STORAGE_KEY = 'music_player_state'

function loadFabPos() {
  try {
    const s = localStorage.getItem(STORAGE_POS)
    if (s) {
      const { x, y } = JSON.parse(s) as { x: number; y: number }
      if (typeof x === 'number' && typeof y === 'number') {
        position.value = {
          x: Math.max(0, Math.min(x, window.innerWidth - PLAYER)),
          y: Math.max(0, Math.min(y, window.innerHeight - PLAYER)),
        }
      }
    }
  } catch {
    /* noop */
  }
}

function saveFabPos() {
  localStorage.setItem(STORAGE_POS, JSON.stringify(position.value))
}

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

/** 拖拽进度条时不让 timeupdate 抢写，避免与滑块打架 */
const isScrubbing = ref(false)

function endScrubListen() {
  isScrubbing.value = false
}

function onProgressPointerDown() {
  isScrubbing.value = true
  window.addEventListener('pointerup', endScrubListen, { once: true })
  window.addEventListener('pointercancel', endScrubListen, { once: true })
}

function onProgressInput(e: Event) {
  const el = e.target as HTMLInputElement
  const pct = parseFloat(el.value)
  if (!audioRef.value || !duration.value || Number.isNaN(pct)) return
  const t = (pct / 100) * duration.value
  audioRef.value.currentTime = t
  currentTime.value = t
}

function isValidShuffleOrder(order: unknown, n: number): order is number[] {
  if (!Array.isArray(order) || order.length !== n) return false
  const seen = new Set<number>()
  for (const x of order) {
    if (typeof x !== 'number' || !Number.isInteger(x) || x < 0 || x >= n || seen.has(x)) return false
    seen.add(x)
  }
  return seen.size === n
}

function randomPermutation(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 冷启动 / 歌单变更等：随机顺序且从打乱后第一首开始 */
function initShuffleQueue() {
  const n = playlist.value.length
  if (n === 0) return
  const arr = randomPermutation(n)
  shuffleOrder.value = arr
  shufflePos.value = 0
  currentTrackIndex.value = arr[0]!
}

/** 切换到随机或修复队列时：重排但保持当前正在播的曲目不变 */
function initShuffleQueuePreserveCurrent() {
  const n = playlist.value.length
  if (n === 0) return
  const pin = Math.min(Math.max(0, currentTrackIndex.value), n - 1)
  const arr = randomPermutation(n)
  shuffleOrder.value = arr
  const pos = arr.indexOf(pin)
  shufflePos.value = pos >= 0 ? pos : 0
}

// 保存播放状态
const saveState = () => {
  if (!hasMusic.value) return
  const payload: Record<string, unknown> = {
    trackIndex: currentTrackIndex.value,
    isPlaying: isPlaying.value,
    currentTime: currentTime.value,
    loopMode: loopMode.value,
  }
  if (loopMode.value === 'shuffle' && shuffleOrder.value.length === playlist.value.length) {
    payload.shuffleOrder = shuffleOrder.value
    payload.shufflePos = shufflePos.value
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

// 恢复播放状态
const restoreState = () => {
  const n = playlist.value.length
  if (n === 0) return
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      if (loopMode.value === 'shuffle') initShuffleQueue()
      else currentTrackIndex.value = 0
      return
    }
    const state = JSON.parse(saved) as {
      trackIndex?: number
      currentTime?: number
      loopMode?: 'shuffle' | 'off' | 'all' | 'one'
      shuffleEnabled?: boolean
      shuffleOrder?: unknown
      shufflePos?: number
    }
    currentTime.value = state.currentTime || 0

    const mode = state.loopMode ?? (state.shuffleEnabled !== false ? 'shuffle' : 'all')
    loopMode.value = mode

    if (mode === 'shuffle') {
      if (isValidShuffleOrder(state.shuffleOrder, n)) {
        shuffleOrder.value = state.shuffleOrder
        shufflePos.value = Math.min(
          Math.max(0, Math.floor(state.shufflePos ?? 0)),
          n - 1,
        )
        currentTrackIndex.value = shuffleOrder.value[shufflePos.value]!
      } else {
        initShuffleQueue()
      }
    } else {
      shuffleOrder.value = []
      shufflePos.value = 0
      const ti = state.trackIndex
      if (typeof ti === 'number' && ti >= 0 && ti < n) currentTrackIndex.value = ti
      else currentTrackIndex.value = 0
    }
  } catch (e) {
    console.error('Failed to restore player state:', e)
    if (loopMode.value === 'shuffle') initShuffleQueue()
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
  (newU, oldU) => {
    if (newU === oldU) return
    const n = playlist.value.length
    if (n === 0) return
    if (loopMode.value === 'shuffle') {
      initShuffleQueue()
    } else {
      currentTrackIndex.value = Math.min(currentTrackIndex.value, n - 1)
    }
    if (currentTrack.value && audioRef.value) {
      audioRef.value.src = currentTrack.value.url
      audioRef.value.load()
    }
    saveState()
  },
)

let unlistenMusicBridge: (() => void) | null = null

onMounted(() => {
  loadFabPos()
  restoreState()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fabSnapTransitionReady.value = true
    })
  })
  if (currentTrack.value && audioRef.value) {
    audioRef.value.src = currentTrack.value.url
  }
  window.addEventListener('mousemove', handleMouseMove, true)
  window.addEventListener('mouseup', handleMouseUp, true)

  unlistenMusicBridge = onMusicCommand((cmd) => {
    if (!hasMusic.value) return
    switch (cmd.type) {
      case 'toggle_play':
        togglePlay()
        break
      case 'next':
        nextTrack()
        break
      case 'prev':
        prevTrack()
        break
      case 'select_track': {
        const n = playlist.value.length
        if (n === 0) return
        const i = Math.max(0, Math.min(n - 1, cmd.index))
        selectTrack(i)
        break
      }
      case 'set_loop':
        loopMode.value = cmd.mode
        break
    }
  })
})

onUnmounted(() => {
  unlistenMusicBridge?.()
  unlistenMusicBridge = null
  window.removeEventListener('mousemove', handleMouseMove, true)
  window.removeEventListener('mouseup', handleMouseUp, true)
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
  const n = playlist.value.length
  if (loopMode.value === 'shuffle' && n > 1) {
    if (shuffleOrder.value.length !== n) initShuffleQueuePreserveCurrent()
    shufflePos.value = (shufflePos.value + 1) % n
    currentTrackIndex.value = shuffleOrder.value[shufflePos.value]!
  } else {
    currentTrackIndex.value = (currentTrackIndex.value + 1) % n
  }
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
  const n = playlist.value.length
  if (loopMode.value === 'shuffle' && n > 1) {
    if (shuffleOrder.value.length !== n) initShuffleQueuePreserveCurrent()
    shufflePos.value = (shufflePos.value - 1 + n) % n
    currentTrackIndex.value = shuffleOrder.value[shufflePos.value]!
  } else {
    currentTrackIndex.value = (currentTrackIndex.value - 1 + n) % n
  }
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
  const n = playlist.value.length
  if (loopMode.value === 'shuffle' && n > 1) {
    if (shuffleOrder.value.length !== n) {
      const arr = randomPermutation(n)
      shuffleOrder.value = arr
      shufflePos.value = Math.max(0, arr.indexOf(index))
    } else {
      const j = shuffleOrder.value.indexOf(index)
      if (j >= 0) shufflePos.value = j
    }
  }
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
  const modes: Array<'shuffle' | 'off' | 'all' | 'one'> = ['shuffle', 'all', 'one', 'off']
  const currentIndex = modes.indexOf(loopMode.value)
  const nextMode = modes[(currentIndex + 1) % modes.length]
  loopMode.value = nextMode
  if (nextMode === 'shuffle') {
    initShuffleQueuePreserveCurrent()
  } else {
    shuffleOrder.value = []
    shufflePos.value = 0
  }
  saveState()
}

const handleTimeUpdate = () => {
  if (audioRef.value && !isScrubbing.value) {
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
  } else if (loopMode.value === 'all' || loopMode.value === 'shuffle') {
    // 列表循环 / 随机播放
    nextTrack()
  } else {
    // 不循环，停止播放
    isPlaying.value = false
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
  if (e.button !== 0) return
  e.preventDefault()
  isDragging.value = true
  dragMoved.value = false
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragStartPosX = position.value.x
  dragStartPosY = position.value.y
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  const deltaX = e.clientX - dragStartX
  const deltaY = e.clientY - dragStartY
  if (Math.abs(deltaX) + Math.abs(deltaY) > 4) dragMoved.value = true

  let newX = dragStartPosX + deltaX
  let newY = dragStartPosY + deltaY
  newX = Math.max(0, Math.min(newX, window.innerWidth - PLAYER))
  newY = Math.max(0, Math.min(newY, window.innerHeight - PLAYER))
  position.value = { x: newX, y: newY }
}

const handleMouseUp = () => {
  if (!isDragging.value) return
  isDragging.value = false
  if (!dragMoved.value) return
  const vw = window.innerWidth
  const vh = window.innerHeight
  const snapped = snapFabToEdges(
    position.value.x,
    position.value.y,
    PLAYER,
    vw,
    vh
  )
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      position.value = snapped
      saveFabPos()
    })
  })
}

const handleButtonClick = () => {
  if (dragMoved.value) {
    dragMoved.value = false
    return
  }
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div
    v-if="hasMusic"
    class="music-player"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    :class="{
      'music-player--dragging': isDragging,
      'music-player--snap-ease': fabSnapTransitionReady,
    }"
  >
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
      <div v-if="isExpanded" class="music-player__panel" :style="musicPanelStyle" @mousedown.stop>
        <div class="music-player__header">
          <h4 class="music-player__title">🎵 {{ currentTrack?.name }}</h4>
          <button class="music-player__close" @click="isExpanded = false">✕</button>
        </div>

        <div class="music-player__controls">
          <div class="music-player__controls-row" role="group" aria-label="播放控制">
            <div class="music-player__controls-side music-player__controls-side--left" aria-hidden="true" />
            <div class="music-player__controls-core">
              <button class="music-player__control-btn" @click="prevTrack" :disabled="playlist.length <= 1">⏮</button>
              <button class="music-player__play-btn" @click="togglePlay">
                {{ isPlaying ? '⏸' : '▶' }}
              </button>
              <button class="music-player__control-btn" @click="nextTrack" :disabled="playlist.length <= 1">⏭</button>
            </div>
            <div class="music-player__controls-side music-player__controls-side--right">
              <button
                type="button"
                class="music-player__mode-btn music-player__loop-btn"
                :class="{ 'music-player__loop-btn--one': loopMode === 'one' }"
                :aria-label="`播放模式: ${loopMode === 'shuffle' ? '随机播放' : loopMode === 'all' ? '列表循环' : loopMode === 'one' ? '单曲循环' : '不循环'}`"
                :title="`播放模式: ${loopMode === 'shuffle' ? '随机播放（首曲随机）' : loopMode === 'all' ? '列表循环' : loopMode === 'one' ? '单曲循环' : '不循环'}`"
                @click="toggleLoopMode"
              >
            <!-- 随机：两条交叉曲线 + 末端箭头，与其它模式同线宽 -->
            <svg
              v-if="loopMode === 'shuffle'"
              class="music-player__loop-svg music-player__loop-svg--compact"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 17.5C7.5 17.5 10.5 9 21 4.5M18.2 2.8L21 4.5 19.3 7.2" />
              <path d="M3 6.5C7.5 6.5 10.5 15 21 19.5M18.2 21.2L21 19.5 19.3 16.8" />
            </svg>
            <!-- 列表循环：双箭头回路 -->
            <svg
              v-else-if="loopMode === 'all'"
              class="music-player__loop-svg music-player__loop-svg--compact"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M17 2l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 22l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <!-- 单曲循环：简洁回路 + 角标 1（小尺寸比单大弧更易辨认） -->
            <template v-else-if="loopMode === 'one'">
              <svg
                class="music-player__loop-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M20.5 4.75v4.25h-4.25" />
                <path d="M18.85 14a6.55 6.55 0 1 1-1.54-6.82L20.5 9.5" />
              </svg>
              <span class="music-player__loop-one-badge" aria-hidden="true">1</span>
            </template>
            <!-- 不循环：仅向前播放 -->
            <svg
              v-else
              class="music-player__loop-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h12" />
              <path d="M14 8l4 4-4 4" />
            </svg>
              </button>
            </div>
          </div>
        </div>


        <div class="music-player__progress-container">
          <input
            type="range"
            min="0"
            max="100"
            step="0.05"
            class="music-player__progress-slider"
            :value="progress"
            :disabled="!duration"
            :style="{
              background: `linear-gradient(to right, #5b8af0 0%, #8b6ff0 ${progress}%, rgba(91,138,240,0.14) ${progress}%, rgba(91,138,240,0.14) 100%)`,
            }"
            aria-label="播放进度"
            @pointerdown="onProgressPointerDown"
            @input="onProgressInput"
          />
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
          <button
            type="button"
            class="music-player__playlist-btn"
            :aria-expanded="showPlaylist"
            @click="showPlaylist = !showPlaylist"
          >
            {{ showPlaylist ? '▼ 隐藏播放列表' : '▶ 显示播放列表' }}
          </button>
        </div>

        <!-- 用 grid 0fr/1fr 做高度过渡，避免 v-if + Transition 整段挂载导致卡顿 -->
        <div
          class="music-player__playlist-shell"
          :class="{ 'music-player__playlist-shell--open': showPlaylist }"
        >
          <div class="music-player__playlist-inner">
            <div class="music-player__playlist">
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
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.music-player {
  position: fixed;
  z-index: 999;
  user-select: none;
  transition:
    box-shadow 0.25s ease,
    filter 0.2s ease;
}

/* 仅松手贴边时过渡 left/top；拖动时由 --dragging 关掉 */
.music-player.music-player--snap-ease {
  transition:
    left var(--fab-snap-duration) var(--fab-snap-ease),
    top var(--fab-snap-duration) var(--fab-snap-ease),
    box-shadow 0.25s ease,
    filter 0.2s ease;
}

.music-player--dragging {
  cursor: grabbing;
  transition: none;
}

.music-player--dragging .music-player__button {
  transition: none;
}

.music-player--dragging .music-player__button:hover {
  transform: none;
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

.music-player__panel {
  /* position / width / bottom / max-height 由 musicPanelStyle（fixed）控制 */
  display: flex;
  flex-direction: column;
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
  margin-bottom: 16px;
}

/* 中间仅传输键，左右等宽，保证主控件相对面板水平居中；模式键在右侧 */
.music-player__controls-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
  column-gap: 8px;
}

.music-player__controls-core {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.music-player__controls-side {
  display: flex;
  align-items: center;
  min-height: 44px;
}

.music-player__controls-side--right {
  justify-content: flex-end;
}

.music-player__controls-side--left {
  pointer-events: none;
}

.music-player__control-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  background: rgba(91, 138, 240, 0.2);
  border: 1px solid rgba(91, 138, 240, 0.3);
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  line-height: 1;
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

.music-player__mode-btn {
  position: relative;
  overflow: visible;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  line-height: 1;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.music-player__mode-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.22);
  color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.music-player__loop-btn--one {
  border-color: rgba(139, 111, 240, 0.35);
  background: rgba(139, 111, 240, 0.12);
}

.music-player__loop-svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  pointer-events: none;
}

/* 随机 / 列表循环图形占满 viewBox，缩到与不循环箭头视觉接近 */
.music-player__loop-svg--compact {
  width: 16px;
  height: 16px;
}

.music-player__loop-one-badge {
  position: absolute;
  left: 6px;
  bottom: 5px;
  font-size: 8px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif);
}

.music-player__loop-btn--one:hover {
  background: rgba(139, 111, 240, 0.2);
  border-color: rgba(186, 170, 255, 0.45);
}

.music-player__play-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8af0 0%, #8b6ff0 100%);
  border: none;
  color: white;
  font-size: 1.2rem;
  line-height: 1;
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
  gap: 8px;
  margin-bottom: 8px;
}

.music-player__progress-slider {
  width: 100%;
  height: 4px;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.music-player__progress-slider:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.music-player__progress-slider::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: transparent;
}

.music-player__progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 11px;
  height: 11px;
  margin-top: -3.5px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8af0 0%, #8b6ff0 100%);
  cursor: grab;
}

.music-player__progress-slider:active::-webkit-slider-thumb {
  cursor: grabbing;
}

.music-player__progress-slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: transparent;
}

.music-player__progress-slider::-moz-range-thumb {
  width: 11px;
  height: 11px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8af0 0%, #8b6ff0 100%);
  box-shadow: 0 0 0 1.5px rgba(20, 20, 30, 0.95);
  cursor: grab;
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

.music-player__playlist-shell {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.22s cubic-bezier(0.32, 0.72, 0, 1);
}

.music-player__playlist-shell--open {
  grid-template-rows: 1fr;
}

.music-player__playlist-inner {
  min-height: 0;
  overflow: hidden;
}

.music-player__playlist {
  max-height: min(200px, 38vh);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  contain: content;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(91, 138, 240, 0.12);
}

.music-player__playlist-shell:not(.music-player__playlist-shell--open) .music-player__playlist {
  pointer-events: none;
}

.music-player__playlist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
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
