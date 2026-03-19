style = """
<style scoped>
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.notes-page { min-height: calc(100vh - 64px); }
.notes-hero { padding: 48px 0 20px; border-bottom: 1px solid var(--color-border); margin-bottom: 32px; }
.notes-title { font-size: clamp(2rem,4vw,3rem); font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.03em; margin-bottom: 6px; }
.notes-subtitle { font-size: var(--text-base); color: var(--color-text-muted); font-family: var(--font-serif); margin-bottom: 16px; }
.search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.search-input { flex: 1; padding: 11px 18px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; transition: all var(--transition-fast); }
.search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.12); }
.search-input::placeholder { color: var(--color-text-muted); }
.new-note-btn { flex-shrink: 0; padding: 10px 20px; border-radius: var(--radius-full); background: var(--gradient-primary); color: white; font-size: var(--text-sm); font-weight: 600; cursor: pointer; border: none; white-space: nowrap; }
.new-note-btn:hover { opacity: 0.88; }
.category-filter { display: flex; flex-wrap: wrap; gap: 8px; }
.cat-btn { padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.cat-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cat-btn--active { background: rgba(91,138,240,0.10); color: var(--color-primary); border-color: rgba(91,138,240,0.3); font-weight: 600; }
.notes-body { padding-bottom: 80px; }
.notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.note-card { padding: 20px; cursor: pointer; border-left: 4px solid var(--color-primary); transition: all var(--transition-base); }
.note-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
.note-card__header { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.note-card__cat { font-size: var(--text-xs); font-weight: 600; }
.note-card__title { font-size: var(--text-base); font-weight: 700; color: var(--color-text-primary); margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.note-card__preview { font-size: var(--text-xs); color: var(--color-text-muted); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 12px; }
.note-card__footer { display: flex; align-items: center; justify-content: space-between; }
.note-card__date { font-size: var(--text-xs); color: var(--color-text-muted); }
.note-card__ops { display: flex; gap: 4px; }
.op-btn { padding: 3px 8px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-bg-glass); font-size: var(--text-xs); cursor: pointer; transition: all var(--transition-fast); }
.op-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.op-btn--danger:hover { border-color: #E8607A; color: #E8607A; }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 24px; color: var(--color-text-muted); }
.loading-dots { display: flex; gap: 6px; }
.loading-dots span { width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); animation: bounce 1.2s ease-in-out infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1} }
.empty-state { text-align: center; padding: 80px 24px; display: flex; flex-direction: column; align-items: center; gap: 16px; color: var(--color-text-muted); }
.empty-icon { font-size: 3rem; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; }
.overlay-enter-active, .overlay-leave-active { transition: all 0.2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.modal { width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; padding: 32px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border); }
.modal-header h3 { font-size: var(--text-lg); font-weight: 700; color: var(--color-text-primary); }
.modal-actions { display: flex; gap: 8px; align-items: center; }
.close-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--color-border); background: var(--color-bg-glass); cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); }
.close-btn:hover { background: rgba(232,96,122,0.1); color: #E8607A; }
.note-editor__form { display: flex; flex-direction: column; gap: 14px; }
.ne-title-input { width: 100%; padding: 12px 0; background: transparent; border: none; border-bottom: 2px solid var(--color-border); font-size: var(--text-xl); font-weight: 600; color: var(--color-text-primary); outline: none; font-family: var(--font-sans); }
.ne-title-input:focus { border-color: var(--color-primary); }
.ne-row { display: flex; gap: 12px; }
.ne-select, .ne-input { flex: 1; padding: 9px 12px; background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; font-family: var(--font-sans); }
.ne-colors { display: flex; align-items: center; gap: 8px; }
.ne-label { font-size: var(--text-xs); color: var(--color-text-muted); }
.color-dot { width: 20px; height: 20px; border-radius: 50%; border: none; cursor: pointer; transition: transform var(--transition-fast); }
.color-dot:hover { transform: scale(1.2); }
.ne-content { width: 100%; padding: 14px; background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-mono); line-height: 1.7; resize: vertical; outline: none; }
.ne-content:focus { border-color: var(--color-primary); }
.note-detail__cat { font-size: var(--text-sm); font-weight: 600; }
.note-detail__title { font-size: clamp(1.4rem,3vw,2rem); font-weight: 700; color: var(--color-text-primary); margin: 12px 0 8px; line-height: 1.3; }
.note-detail__dates { display: flex; gap: 16px; font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 12px; }
.note-detail__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
.note-detail__ops { display: flex; gap: 6px; }
.note-detail__body { padding-top: 16px; border-top: 1px solid var(--color-border); }
</style>
"""

with open('E:/github/chends/src/pages/notes/NotesPage.vue', 'a', encoding='utf-8') as f:
    f.write(style)
print('style appended')
