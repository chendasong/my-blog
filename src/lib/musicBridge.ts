/**
 * 供 AI 助手等外部模块控制 MusicPlayerPro，避免直接改播放器内部状态。
 */
export type MusicBridgeCommand =
  | { type: 'toggle_play' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'select_track'; index: number }
  | { type: 'set_loop'; mode: 'off' | 'all' | 'one' }

const EVENT = 'luminary-music-bridge'

export function emitMusicCommand(cmd: MusicBridgeCommand): void {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: cmd }))
}

export function onMusicCommand(handler: (cmd: MusicBridgeCommand) => void): () => void {
  const fn = (e: Event) => {
    handler((e as CustomEvent<MusicBridgeCommand>).detail)
  }
  window.addEventListener(EVENT, fn)
  return () => window.removeEventListener(EVENT, fn)
}
