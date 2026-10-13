import type { GameApi } from '../game/useGame'

export function HistoryBar({ game }: { game: GameApi }) {
  const { vm } = game
  if (!vm.history.length) {
    return (
      <section className="history" aria-label="Últimas acciones">
        <div className="hist-empty">
          <span className="hist-empty-label">
            QUINTETO
            <br />
            INICIAL
          </span>
          <div className="starters">
            {vm.starters.map((p) => (
              <div key={p.num} className="starter">
                <span className="starter-num">{p.num}</span>
                <span className="starter-last">{p.last}</span>
              </div>
            ))}
          </div>
          <span className="hint">Toca la cancha para registrar la primera acción</span>
        </div>
      </section>
    )
  }

  return (
    <section className="history" aria-label="Últimas acciones">
      {vm.history.map((h) => (
        <div key={h.id} className="hist-cell" style={{ background: h.bg }}>
          <div className="hist-body">
            <div className="hist-l1">
              <span className="tag" style={{ background: h.tagBg, color: h.tagColor, border: `1px solid ${h.tagBd}` }}>
                {h.tag}
              </span>
              <span className="hist-time">{h.time}</span>
            </div>
            <div className="hist-l2">
              <span className="hist-num">{h.num}</span>
              <span className="hist-last">{h.last}</span>
            </div>
            <span className="hist-text">{h.text}</span>
          </div>
          <button className="undo" title="Deshacer esta acción" onClick={() => game.undo(h.id)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4C6CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14 4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
            </svg>
          </button>
        </div>
      ))}
      {Array.from({ length: vm.histBlanks }, (_, i) => (
        <div key={`b${i}`} className="hist-blank" />
      ))}
    </section>
  )
}
