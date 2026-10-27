import { STAT_KEYS, type GameEvent, type GameState, type Player, type StatKey } from './types'

export const GREEN = '#0A7E3A'
export const RED = '#B02A2D'
export const TEAM_C = '#B199F4'

export function mkPlayer(id: string, num: number, first: string, last: string): Player {
  const p: Player = {
    id,
    num,
    first,
    last,
    min: 0,
    t2m: 0,
    t2a: 0,
    t3m: 0,
    t3a: 0,
    ftm: 0,
    fta: 0,
    ro: 0,
    rd: 0,
    as: 0,
    br: 0,
    bp: 0,
    tap: 0,
    fc: 0,
    fr: 0,
    pm: 0,
  }
  return p
}

export function initialState(): GameState {
  const players = [
    mkPlayer('h1', 3, '', 'Aitaimi'),
    mkPlayer('h2', 7, '', 'Boja'),
    mkPlayer('h3', 11, '', 'Juanlu'),
    mkPlayer('h4', 22, '', 'Agronomo'),
    mkPlayer('h5', 41, '', 'Gloria'),
    mkPlayer('h6', 5, '', 'Tino'),
    mkPlayer('h7', 8, '', 'Mawé'),
  ]
  return {
    running: false,
    clock: 6000,
    period: 1,
    poss: 'home',
    attackRight: true,
    players,
    court: ['h1', 'h2', 'h3', 'h4', 'h5'],
    oppScore: 0,
    fouls: { home: 0, away: 0 },
    to: { home: 0, away: 0 },
    pending: null,
    chain: null,
    subs: null,
    subLog: [],
    events: [],
    editing: false,
    editVal: '',
    editErr: false,
    logoErr: {},
  }
}

export const pts = (p: Pick<Player, 't2m' | 't3m' | 'ftm'>) => 2 * p.t2m + 3 * p.t3m + p.ftm

export const val = (p: Player | Record<StatKey, number>) =>
  pts(p) +
  p.ro +
  p.rd +
  p.as +
  p.br +
  p.tap +
  p.fr -
  (p.t2a - p.t2m + (p.t3a - p.t3m) + (p.fta - p.ftm) + p.bp + p.fc)

export const pct = (m: number, a: number) => (a ? `${Math.round((m / a) * 100)}%` : '–')
export const sg = (n: number) => (n > 0 ? `+${n}` : String(n))

export const fmtMin = (t: number) => {
  const s = Math.floor(t / 10)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const fmtClock = (c: number) =>
  c >= 600
    ? `${Math.floor(c / 600)}:${String(Math.floor(c / 10) % 60).padStart(2, '0')}`
    : `${String(Math.floor(c / 10)).padStart(2, '0')}.${c % 10}`

export const maxClock = (p: number) => (p <= 4 ? 6000 : 3000)

export const periodLabel = (p: number) => (p <= 4 ? 'CUARTO' : 'PRÓRROGA')
export const periodVal = (p: number) => (p <= 4 ? `${p}º` : `PR${p - 4}`)
export const toMaxFor = (p: number) => (p <= 2 ? 2 : p <= 4 ? 3 : 1)

export function applyDelta(
  list: Player[],
  pid: string | null,
  delta: Partial<Record<StatKey, number>>,
  n: number,
  sign: number,
  court: string[],
): Player[] {
  return list.map((p) => {
    if (p.id !== pid && !(n && court.includes(p.id))) return p
    const q = { ...p }
    if (p.id === pid) {
      for (const k in delta) {
        const key = k as StatKey
        q[key] = Math.max(0, q[key] + sign * (delta[key] ?? 0))
      }
    }
    if (n && court.includes(p.id)) q.pm += sign * n
    return q
  })
}

export function zoneAt(x: number, y: number, right: boolean) {
  const bx = right ? 26.425 : 1.575
  const dist = Math.hypot(x - bx, y - 7.5)
  const back = right ? x < 14 : x > 14
  const three = back || dist > 6.75 || y < 0.9 || y > 14.1
  const paint = (right ? x > 22.2 : x < 5.8) && y > 5.05 && y < 9.95
  const corner = !back && (y < 0.9 || y > 14.1) && (right ? x > 25.01 : x < 2.99)
  const zone = back
    ? 'Campo propio'
    : paint
      ? 'Zona'
      : corner
        ? 'Triple esquina'
        : three
          ? 'Triple'
          : 'Media distancia'
  return { dist, three, zone }
}

export function zoneFor(x: number, y: number, def: boolean, AR: boolean) {
  const z = zoneAt(x, y, def ? !AR : AR)
  if (def && z.zone === 'Campo propio') z.zone = 'Campo contrario'
  return { def, ...z }
}

export function shotEv(three: boolean, made: boolean) {
  return {
    delta: three ? { t3a: 1, t3m: made ? 1 : 0 } : { t2a: 1, t2m: made ? 1 : 0 },
    pts: made ? (three ? 3 : 2) : 0,
    kind: (made ? 'made' : 'miss') as 'made' | 'miss',
    tag: made ? (three ? '+3' : '+2') : three ? 'T3' : 'T2',
    text: `${three ? 'Triple' : 'Tiro de 2'}${made ? ' anotado' : ' fallado'}`,
  }
}

export const EV: Record<
  string,
  {
    delta: Partial<Record<StatKey, number>>
    kind: 'stat'
    tag: string
    text: string
    foul?: boolean
    oppFoul?: boolean
  }
> = {
  bp: { delta: { bp: 1 }, kind: 'stat', tag: 'BP', text: 'Pérdida' },
  fr: { delta: { fr: 1 }, kind: 'stat', tag: 'FR', text: 'Falta recibida', oppFoul: true },
  rd: { delta: { rd: 1 }, kind: 'stat', tag: 'RD', text: 'Rebote defensivo' },
  br: { delta: { br: 1 }, kind: 'stat', tag: 'BR', text: 'Robo' },
  fc: { delta: { fc: 1 }, kind: 'stat', tag: 'FC', text: 'Falta cometida', foul: true },
  as: { delta: { as: 1 }, kind: 'stat', tag: 'AS', text: 'Asistencia' },
  ro: { delta: { ro: 1 }, kind: 'stat', tag: 'RO', text: 'Rebote ofensivo' },
}

export function parseClock(raw: string, period: number): number | null {
  const v = raw.trim().replace(',', '.')
  let m = v.match(/^(\d{1,2}):(\d{1,2})(?:\.(\d))?$/)
  let t: number | null = null
  if (m && +m[2] < 60) t = (+m[1] * 60 + +m[2]) * 10 + +(m[3] || 0)
  else if ((m = v.match(/^(\d{1,3})(?:\.(\d))?$/))) t = +m[1] * 10 + +(m[2] || 0)
  if (t === null || t > maxClock(period)) return null
  return t
}

/**
 * Entrada del crono con teclado numérico (sin dos puntos): los dígitos entran por la derecha,
 * como en una calculadora. 1 → 0:01, 530 → 5:30, 1000 → 10:00. Con coma o punto se deja tal cual
 * (5,3 = 5 segundos y 3 décimas).
 */
export function formatClockInput(raw: string) {
  if (/[.,]/.test(raw)) return raw.replace(/[^\d.,]/g, '').replace(/^0+(?=\d)/, '')
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(-4)
  if (!digits) return ''
  const padded = digits.padStart(3, '0')
  return `${padded.slice(0, -2)}:${padded.slice(-2)}`
}

export function clockEditValue(c: number) {
  const sec = Math.floor(c / 10)
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}${c % 10 ? `,${c % 10}` : ''}`
}

export function commitEvent(
  s: GameState,
  pid: string | null,
  ev: Partial<GameEvent> & Pick<GameEvent, 'kind' | 'tag' | 'text'>,
  id: number,
  keepPending = false,
): GameState {
  const e: GameEvent = {
    id,
    pid,
    period: s.period,
    clock: s.clock,
    delta: {},
    pts: 0,
    oppPts: 0,
    foul: false,
    oppFoul: false,
    loc: null,
    court: s.court,
    ...ev,
  }
  const out: GameState = {
    ...s,
    players: applyDelta(s.players, pid, e.delta, e.pts - e.oppPts, 1, e.court),
    events: [e, ...s.events].slice(0, 400),
  }
  if (!keepPending) out.pending = null
  if (e.oppPts) out.oppScore = s.oppScore + e.oppPts
  if (e.foul || e.oppFoul) {
    out.fouls = {
      home: s.fouls.home + (e.foul ? 1 : 0),
      away: s.fouls.away + (e.oppFoul ? 1 : 0),
    }
  }
  return out
}

export function totals(players: Player[]): Record<StatKey, number> {
  const tot = {} as Record<StatKey, number>
  STAT_KEYS.forEach((k) => {
    tot[k] = players.reduce((a, p) => a + p[k], 0)
  })
  return tot
}
