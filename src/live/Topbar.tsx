import { Field } from '@ark-ui/react/field'
import { Toggle } from '@ark-ui/react/toggle'
import { useEffect, useRef } from 'react'
import { asset } from '../asset'
import type { GameApi } from '../game/useGame'

export function Topbar({ game }: { game: GameApi }) {
  const { state, vm } = game
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [state.editing])

  return (
    <header className="topbar">
      <div className="team">
        <div className="crest">
          {state.logoErr.home ? (
            <span className="crest-fallback">CBT</span>
          ) : (
            <img src={asset('cbtelde.png')} alt="CB Telde" onError={() => game.logoErr('home')} />
          )}
        </div>
        <div className="team-info">
          <div className="team-name">CB Telde</div>
          <div>
            <div className="pips">
              {vm.homeFouls.map((f, i) => (
                <span key={i} className="foul-pip" style={{ background: f.bg, border: `1.5px solid ${f.bd}` }} />
              ))}
            </div>
            <div className="pips">
              {vm.homeTO.map((t, i) => (
                <button
                  key={i}
                  className="to-btn"
                  title="Tiempo muerto"
                  onClick={() => game.toggleTO('home', t.i, t.rem, vm.toMax)}
                >
                  <span className="to-pip" style={{ background: t.bg, border: `1.5px solid ${t.bd}` }} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="score">{vm.homeScore}</div>
      </div>

      <div className="clock-block">
        <div className="clock-col">
          <span className="eyebrow">{vm.periodLabel}</span>
          <div className="period-row">
            <button className="ghost step" onClick={() => game.setPeriod(-1)}>
              ‹
            </button>
            <span className="period-val">{vm.periodVal}</span>
            <button className="ghost step" onClick={() => game.setPeriod(1)}>
              ›
            </button>
          </div>
        </div>
        <div className="vdiv" />
        <div className="clock-col time">
          {state.editing ? (
            <>
              <Field.Root invalid={state.editErr}>
                <Field.Input
                  ref={inputRef}
                  className="clock-input"
                  value={state.editVal}
                  inputMode="decimal"
                  placeholder="m:ss"
                  style={{ borderColor: state.editErr ? '#FF6B6B' : '#E9B949' }}
                  onChange={(e) => game.setEdit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') game.saveEdit()
                    if (e.key === 'Escape') game.cancelEdit()
                  }}
                />
              </Field.Root>
              <div className="edit-row">
                <button className="ghost edit-cancel" onClick={game.cancelEdit}>
                  Cancelar
                </button>
                <button className="edit-ok" onClick={game.saveEdit}>
                  OK
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="clock-num" style={{ color: vm.clockColor }}>
                {vm.clockStr}
              </div>
              <button className="ghost edit-clock" onClick={game.startEdit}>
                <span>✎</span>
                <span>Editar</span>
              </button>
            </>
          )}
        </div>
        <button className="play" title="Iniciar / parar crono (espacio)" style={{ background: vm.playBg }} onClick={game.toggleClock}>
          {state.running ? (
            <svg width="16" height="18" viewBox="0 0 20 22">
              <rect x="2" y="1" width="5.5" height="20" rx="1.5" fill="#ECEBE8" />
              <rect x="12.5" y="1" width="5.5" height="20" rx="1.5" fill="#ECEBE8" />
            </svg>
          ) : (
            <svg width="16" height="18" viewBox="0 0 20 22">
              <polygon points="3,1 19,11 3,21" fill="#141414" />
            </svg>
          )}
        </button>
        <div className="vdiv" />
        <div className="toggles">
          <Toggle.Root
            className="ghost toggle"
            pressed={state.poss === 'away'}
            onPressedChange={game.togglePoss}
            title="Flecha de posesión alterna"
          >
            <svg width="11" height="11" viewBox="0 0 18 18">
              <polygon points="16,2 16,16 3,9" fill={vm.possL} />
            </svg>
            <span className="toggle-label">POS.</span>
            <svg width="11" height="11" viewBox="0 0 18 18">
              <polygon points="2,2 2,16 15,9" fill={vm.possR} />
            </svg>
          </Toggle.Root>
          <Toggle.Root
            className="ghost toggle"
            pressed={state.attackRight}
            onPressedChange={game.toggleAttack}
            title="Canasta que atacamos"
          >
            <svg width="11" height="11" viewBox="0 0 18 18">
              <polygon points="16,2 16,16 3,9" fill={vm.atkL} />
            </svg>
            <span className="toggle-label">ATAQUE</span>
            <svg width="11" height="11" viewBox="0 0 18 18">
              <polygon points="2,2 2,16 15,9" fill={vm.atkR} />
            </svg>
          </Toggle.Root>
        </div>
      </div>

      <div className="team">
        <div className="score score-away">{vm.awayScore}</div>
        <div className="team-info" style={{ alignItems: 'flex-end' }}>
          <div className="team-name">CB Gran Canaria</div>
          <div>
            <div className="pips" style={{ justifyContent: 'flex-end' }}>
              {vm.awayFouls.map((f, i) => (
                <span key={i} className="foul-pip" style={{ background: f.bg, border: `1.5px solid ${f.bd}` }} />
              ))}
            </div>
            <div className="pips" style={{ justifyContent: 'flex-end' }}>
              {vm.awayTO.map((t, i) => (
                <button
                  key={i}
                  className="to-btn"
                  title="Tiempo muerto"
                  onClick={() => game.toggleTO('away', t.i, t.rem, vm.toMax)}
                >
                  <span className="to-pip" style={{ background: t.bg, border: `1.5px solid ${t.bd}` }} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="crest">
          {state.logoErr.away ? (
            <span className="crest-fallback">CBGC</span>
          ) : (
            <img
              src="https://cbgrancanaria.net/wp-content/uploads/2015/01/logo-team.png"
              alt="CB Gran Canaria"
              onError={() => game.logoErr('away')}
            />
          )}
        </div>
      </div>

      <div className="opp-col">
        <button className="opp-btn" title="Rival anota 1" onClick={() => game.opp(1)}>
          +1
        </button>
        <button className="opp-btn" title="Rival anota 2" onClick={() => game.opp(2)}>
          +2
        </button>
        <button className="opp-btn" title="Rival anota 3" onClick={() => game.opp(3)}>
          +3
        </button>
      </div>
    </header>
  )
}
