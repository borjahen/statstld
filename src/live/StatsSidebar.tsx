import { Presence } from '@ark-ui/react/presence'
import type { GameApi } from '../game/useGame'

export function StatsSidebar({ game }: { game: GameApi }) {
  const { vm } = game
  const pn = vm.panel

  return (
    <aside className="sidebar">
      <div className="side-head">
        <span className="side-title">CB TELDE · EN PISTA</span>
        <button className="cambios" onClick={() => game.openSubs(null)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ECEBE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 4 3 8l4 4" />
            <path d="M3 8h14" />
            <path d="m17 20 4-4-4-4" />
            <path d="M21 16H7" />
          </svg>
          <span>Cambios</span>
        </button>
      </div>

      <div className="table">
        <div className="t-row t-head">
          <span />
          {vm.headCols.map((h) => (
            <button key={h.id} className="player-head" onClick={() => game.openSubs(h.id)}>
              <span className="player-num" style={{ color: h.color }}>
                {h.num}
              </span>
              <span className="player-last" style={{ color: h.color }}>
                {h.last}
              </span>
            </button>
          ))}
          <div className="equipo">EQUIPO</div>
        </div>
        {vm.rows.map((r) => (
          <div key={r.label} className="t-row stat-row" style={{ background: r.rowBg }}>
            <span className="stat-label" style={{ color: r.lblColor }}>
              {r.label}
            </span>
            {r.cells.map((c, i) => (
              <span key={i} className="stat-cell" style={{ background: c.bg, fontWeight: c.fw, color: c.color }}>
                {c.v}
              </span>
            ))}
          </div>
        ))}
      </div>

      <Presence present={vm.panelOpen} lazyMount unmountOnExit className="panel">
        <div className="panel-inner">
          <div className="panel-head">
            <div className="panel-copy">
              <div className="panel-meta">
                <span className="panel-eye">{pn.eyebrow}</span>
                <span className="panel-sub">{pn.sub}</span>
              </div>
              <span className="panel-title">{pn.title}</span>
            </div>
            <button className="panel-x" title="Cerrar" onClick={game.cancelPanel}>
              ✕
            </button>
          </div>
          {pn.rows.length > 0 ? (
            <div className="p-rows">
              {pn.rows.map((r) => (
                <div key={r.id} className="p-row" style={{ maxHeight: r.maxH }}>
                  <div className="p-jersey" style={{ background: r.stripe }}>
                    <span className="p-num">{r.num}</span>
                    <span className="p-last">{r.last}</span>
                  </div>
                  <div className="p-grid" style={{ gridTemplateColumns: `repeat(${r.cols}, minmax(0,1fr))` }}>
                    {r.btns.map((b, i) => (
                      <button key={i} className="p-btn" style={{ background: b.bg, color: b.fg }} onClick={b.on}>
                        <span className="p-btn-l">{b.label}</span>
                        <span className="p-btn-s">{b.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {pn.big.length > 0 ? (
            <div className="p-big" style={{ gridTemplateColumns: pn.bigCols }}>
              {pn.big.map((b) => (
                <button key={b.label} className="p-big-btn" style={{ background: b.bg, color: b.fg }} onClick={b.on}>
                  <span className="p-big-l">{b.label}</span>
                  <span className="p-big-s">{b.sub}</span>
                </button>
              ))}
            </div>
          ) : null}
          {pn.foot.length > 0 ? (
            <div className="p-foot">
              {pn.foot.map((b) => (
                <button key={b.label} className="p-foot-btn" style={{ background: b.bg, color: b.fg }} onClick={b.on}>
                  {b.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </Presence>

      <Presence present={vm.subsOpen} lazyMount unmountOnExit className="subs">
        <div className="subs-inner">
          <div className="subs-head">
            <div className="subs-copy">
              <span className="side-title">CAMBIOS</span>
              <span className="subs-title">Sustitución</span>
              <span className="subs-sub">{vm.subsTitle}</span>
            </div>
            <button className="subs-x" title="Cerrar" onClick={game.closeSubs}>
              ✕
            </button>
          </div>
          <div className="subs-sec">
            <span>EN PISTA</span>
            <div className="subs-court">
              {vm.subsCourt.map((p) => (
                <button
                  key={p.id}
                  className="sub-card"
                  style={{ background: p.bg, borderColor: p.bd, opacity: p.op }}
                  onClick={() => game.pickSub(p.id)}
                >
                  <span className="sub-num">{p.num}</span>
                  <span className="sub-last">{p.last}</span>
                  <span className="sub-line" style={{ color: p.lineColor }}>
                    {p.line}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="subs-sec">
            <span>BANQUILLO</span>
            <div className="subs-bench">
              {vm.subsBench.map((p) => (
                <button
                  key={p.id}
                  className="sub-card"
                  style={{ background: p.bg, borderColor: p.bd, opacity: p.op }}
                  onClick={() => game.pickSub(p.id)}
                >
                  <span className="sub-num">{p.num}</span>
                  <span className="sub-last">{p.last}</span>
                  <span className="sub-line" style={{ color: p.lineColor }}>
                    {p.line}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="subs-spacer" />
          <button className="hecho" onClick={game.closeSubs}>
            Hecho
          </button>
        </div>
      </Presence>
    </aside>
  )
}
