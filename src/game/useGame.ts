import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import {
  clockEditValue,
  commitEvent,
  EV,
  fmtClock,
  fmtMin,
  GREEN,
  maxClock,
  parseClock,
  periodLabel,
  periodVal,
  pts,
  RED,
  shotEv,
  TEAM_C,
  toMaxFor,
  totals,
  val,
  zoneFor,
  initialState,
  pct,
  sg,
} from './logic'
import type { ActionKey, GameState, Loc, Player, StatKey, TeamSide } from './types'

type Action =
  | { type: 'TICK' }
  | { type: 'TOGGLE_CLOCK' }
  | { type: 'START_EDIT' }
  | { type: 'CANCEL_EDIT' }
  | { type: 'SET_EDIT'; value: string }
  | { type: 'SAVE_EDIT' }
  | { type: 'SET_PERIOD'; d: number }
  | { type: 'TOGGLE_POSS' }
  | { type: 'TOGGLE_ATTACK' }
  | { type: 'TOGGLE_TO'; side: TeamSide; i: number; rem: number; toMax: number }
  | { type: 'COURT_TAP'; x: number; y: number }
  | { type: 'CANCEL_PANEL' }
  | { type: 'RECORD_AT'; pid: string; k: ActionKey; id: number }
  | { type: 'OPP'; n: number; id: number; keep: boolean }
  | { type: 'UNDO'; id: number }
  | { type: 'CHAIN_ASSIST'; aPid: string | null; id: number }
  | { type: 'CHAIN_REB'; rPid: string | null; id: number }
  | { type: 'CHAIN_FT_COUNT'; n: 1 | 2 | 3 }
  | { type: 'CHAIN_FT'; made: boolean; id: number }
  | { type: 'OPEN_SUBS'; out: string | null }
  | { type: 'CLOSE_SUBS' }
  | { type: 'PICK_SUB'; id: string }
  | { type: 'LOGO_ERR'; side: TeamSide }

function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'TICK': {
      if (!s.running) return s
      if (s.clock <= 1) return { ...s, clock: 0, running: false }
      return {
        ...s,
        clock: s.clock - 1,
        players: s.players.map((p) => (s.court.includes(p.id) ? { ...p, min: p.min + 1 } : p)),
      }
    }
    case 'TOGGLE_CLOCK':
      if (s.editing) return s
      return { ...s, running: s.clock > 0 ? !s.running : false }
    case 'START_EDIT':
      return { ...s, running: false, editing: true, editVal: clockEditValue(s.clock), editErr: false }
    case 'CANCEL_EDIT':
      return { ...s, editing: false }
    case 'SET_EDIT':
      return { ...s, editVal: a.value, editErr: false }
    case 'SAVE_EDIT': {
      const t = parseClock(s.editVal, s.period)
      if (t === null) return { ...s, editErr: true }
      return { ...s, clock: t, editing: false }
    }
    case 'SET_PERIOD': {
      const p = Math.max(1, Math.min(8, s.period + a.d))
      if (p === s.period) return s
      const out: GameState = {
        ...s,
        period: p,
        clock: maxClock(p),
        running: false,
        pending: null,
        chain: null,
      }
      if (s.period <= 2 !== p <= 2) out.attackRight = !s.attackRight
      if (a.d > 0) {
        if (p <= 4) out.fouls = { home: 0, away: 0 }
        if (p === 3 || p >= 5) out.to = { home: 0, away: 0 }
      }
      return out
    }
    case 'TOGGLE_POSS':
      return { ...s, poss: s.poss === 'home' ? 'away' : 'home' }
    case 'TOGGLE_ATTACK': {
      const ar = !s.attackRight
      const p = s.pending
      return {
        ...s,
        attackRight: ar,
        pending: p ? { ...p, ...zoneFor(p.x, p.y, ar ? p.x < 14 : p.x > 14, ar) } : null,
      }
    }
    case 'TOGGLE_TO': {
      const rem = a.rem
      const next = a.i < rem ? Math.min(a.toMax, s.to[a.side] + 1) : Math.max(0, s.to[a.side] - 1)
      return { ...s, to: { ...s.to, [a.side]: next } }
    }
    case 'COURT_TAP':
      if (a.x < 0 || a.x > 28 || a.y < 0 || a.y > 15) return s
      {
        const def = s.attackRight ? a.x < 14 : a.x > 14
        return {
          ...s,
          pending: { x: a.x, y: a.y, ...zoneFor(a.x, a.y, def, s.attackRight) },
          chain: null,
          subs: null,
        }
      }
    case 'CANCEL_PANEL':
      return { ...s, pending: null, chain: null }
    case 'RECORD_AT': {
      const pd = s.pending
      if (!pd) return s
      const loc: Loc = { x: +pd.x.toFixed(2), y: +pd.y.toFixed(2), zone: pd.zone, three: pd.three, def: pd.def }
      let k: string = a.k
      if (pd.def && (k === 'made' || k === 'miss')) k = k === 'made' ? 'farMade' : 'farMiss'
      const far = k === 'farMade' || k === 'farMiss'
      if (far) {
        loc.zone = 'Campo propio'
        loc.three = true
        loc.def = false
      }
      const shot = k === 'made' || k === 'miss' || far
      const made = k === 'made' || k === 'farMade'
      const three = far || pd.three
      const ev = shot ? shotEv(three, made) : EV[k]
      let next = commitEvent(s, a.pid, ev, a.id)
      if (shot && made) next = { ...next, chain: { type: 'ast', pid: a.pid, loc, three, srcId: a.id } }
      else if (shot) next = { ...next, chain: { type: 'reb', pid: a.pid, loc, three, fromShot: true, srcId: a.id } }
      else if (k === 'fr') next = { ...next, chain: { type: 'ftAsk', pid: a.pid, loc, srcId: a.id } }
      return next
    }
    case 'OPP':
      return commitEvent(
        s,
        null,
        {
          oppPts: a.n,
          kind: 'opp',
          tag: `+${a.n}`,
          text: a.n === 1 ? 'Rival · tiro libre' : 'Rival anota',
        },
        a.id,
        a.keep,
      )
    case 'UNDO': {
      const e = s.events.find((x) => x.id === a.id)
      if (!e) return s
      const out: GameState = {
        ...s,
        players: applyPmUndo(s.players, e.pid, e.delta, e.pts - e.oppPts, e.court),
        events: s.events.filter((x) => x.id !== a.id),
        chain: s.chain && s.chain.srcId === a.id ? null : s.chain,
      }
      if (e.oppPts) out.oppScore = Math.max(0, s.oppScore - e.oppPts)
      if (e.foul || e.oppFoul) {
        out.fouls = {
          home: Math.max(0, s.fouls.home - (e.foul ? 1 : 0)),
          away: Math.max(0, s.fouls.away - (e.oppFoul ? 1 : 0)),
        }
      }
      return out
    }
    case 'CHAIN_ASSIST': {
      const ch = s.chain
      if (!ch || ch.type !== 'ast') return s
      let next = s
      if (a.aPid) next = commitEvent(s, a.aPid, { ...EV.as, loc: ch.loc }, a.id)
      return { ...next, chain: null }
    }
    case 'CHAIN_REB': {
      const ch = s.chain
      if (!ch || ch.type !== 'reb') return s
      let next = s
      if (a.rPid) next = commitEvent(s, a.rPid, { ...EV.ro, loc: ch.fromShot ? ch.loc : null }, a.id)
      return { ...next, chain: null }
    }
    case 'CHAIN_FT_COUNT':
      if (!s.chain || s.chain.type !== 'ftAsk') return s
      return { ...s, chain: { ...s.chain, type: 'ft', n: a.n, i: 0, res: [] } }
    case 'CHAIN_FT': {
      const ch = s.chain
      if (!ch || ch.type !== 'ft') return s
      const ev = a.made
        ? { delta: { ftm: 1, fta: 1 }, pts: 1, kind: 'made' as const, tag: '+1', text: 'Tiro libre anotado' }
        : { delta: { fta: 1 }, kind: 'miss' as const, tag: 'TL', text: 'Tiro libre fallado' }
      const next = commitEvent(s, ch.pid, ev, a.id)
      const i = ch.i + 1
      if (i < ch.n) return { ...next, chain: { ...ch, i, res: [...ch.res, a.made] } }
      if (!a.made) return { ...next, chain: { type: 'reb', pid: ch.pid, fromShot: false, loc: ch.loc, srcId: ch.srcId } }
      return { ...next, chain: null }
    }
    case 'OPEN_SUBS':
      return { ...s, subs: { out: a.out, inn: null }, pending: null, chain: null }
    case 'CLOSE_SUBS':
      return { ...s, subs: null }
    case 'PICK_SUB': {
      if (!s.subs) return s
      let { out, inn } = s.subs
      if (s.court.includes(a.id)) out = out === a.id ? null : a.id
      else {
        const p = s.players.find((x) => x.id === a.id)
        if (!p || p.fc >= 5) return s
        inn = inn === a.id ? null : a.id
      }
      if (out && inn) {
        return {
          ...s,
          court: s.court.map((c) => (c === out ? inn! : c)),
          subs: { out: null, inn: null },
          subLog: [...s.subLog, { period: s.period, clock: s.clock, out, inn }],
        }
      }
      return { ...s, subs: { out, inn } }
    }
    case 'LOGO_ERR':
      return { ...s, logoErr: { ...s.logoErr, [a.side]: true } }
    default:
      return s
  }
}

function applyPmUndo(
  list: Player[],
  pid: string | null,
  delta: Partial<Record<StatKey, number>>,
  n: number,
  court: string[],
) {
  return list.map((p) => {
    if (p.id !== pid && !(n && court.includes(p.id))) return p
    const q = { ...p }
    if (p.id === pid) {
      for (const k in delta) {
        const key = k as StatKey
        q[key] = Math.max(0, q[key] - (delta[key] ?? 0))
      }
    }
    if (n && court.includes(p.id)) q.pm -= n
    return q
  })
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const seq = useRef(0)
  const nextId = () => ++seq.current

  useEffect(() => {
    const iv = setInterval(() => dispatch({ type: 'TICK' }), 100)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && !state.editing) {
        e.preventDefault()
        dispatch({ type: 'TOGGLE_CLOCK' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.editing])

  const byId = useCallback((id: string) => state.players.find((p) => p.id === id) as Player, [state.players])

  const vm = useMemo(() => {
    const showPct = false
    const homeScore = state.players.reduce((a, p) => a + pts(p), 0)
    const awayScore = state.oppScore
    const toMax = toMaxFor(state.period)
    const foulSq = (t: TeamSide) =>
      Array.from({ length: 5 }, (_, i) => {
        const on = i < state.fouls[t]
        const col = state.fouls[t] >= 5 ? '#FF6B6B' : '#ECEBE8'
        return { bg: on ? col : 'transparent', bd: on ? col : 'rgba(255,255,255,0.32)' }
      })
    const toPips = (t: TeamSide) => {
      const rem = Math.max(0, toMax - state.to[t])
      return Array.from({ length: toMax }, (_, i) => ({
        bg: i < rem ? '#E9B949' : 'transparent',
        bd: i < rem ? '#E9B949' : 'rgba(255,255,255,0.32)',
        rem,
        i,
      }))
    }
    const list = state.court.map(byId)
    const tot = totals(state.players)
    const sh = (m: number, a: number) => ({ v: `${m}/${a}`, sub: pct(m, a) })
    const g = (k: StatKey) =>
      [
        (p: Player) => ({ v: p[k] }),
        () => ({ v: tot[k] }),
      ] as const
    type CellIn = { v: string | number; sub?: string; b?: number; warn?: string | null }
    const defs: [string, (p: Player) => CellIn, () => CellIn][] = [
      ['MIN', (p) => ({ v: fmtMin(p.min) }), () => ({ v: '' })],
      ['PTS', (p) => ({ v: pts(p), b: 1 }), () => ({ v: homeScore, b: 1 })],
      ['T2', (p) => sh(p.t2m, p.t2a), () => sh(tot.t2m, tot.t2a)],
      ['T3', (p) => sh(p.t3m, p.t3a), () => sh(tot.t3m, tot.t3a)],
      ['TL', (p) => sh(p.ftm, p.fta), () => sh(tot.ftm, tot.fta)],
      ['RO', ...g('ro')],
      ['RD', ...g('rd')],
      ['RT', (p) => ({ v: p.ro + p.rd }), () => ({ v: tot.ro + tot.rd })],
      ['AS', ...g('as')],
      ['BR', ...g('br')],
      ['BP', ...g('bp')],
      [
        'FC',
        (p) => ({ v: p.fc, warn: p.fc >= 5 ? '#FF6B6B' : p.fc === 4 ? '#E9B949' : null }),
        () => ({ v: tot.fc }),
      ],
      ['+/-', (p) => ({ v: sg(p.pm) }), () => ({ v: sg(homeScore - awayScore) })],
      ['VAL', (p) => ({ v: val(p), b: 1 }), () => ({ v: val(tot), b: 1 })],
    ]
    const cell = (o: CellIn, team: boolean) => ({
      v: String(o.v),
      sub: o.sub || '',
      hasSub: showPct && !!o.sub,
      bg: team ? 'rgba(255,255,255,0.035)' : 'transparent',
      color: o.warn || (o.b ? '#FFFFFF' : '#D5D6D9'),
      fw: o.b ? 700 : 500,
    })
    const rows = defs.map(([label, f, ft], i) => ({
      label,
      rowBg: i % 2 ? 'rgba(255,255,255,0.022)' : 'transparent',
      lblColor: label === 'PTS' || label === 'VAL' ? TEAM_C : '#8C8F96',
      cells: [...list.map((p) => cell(f(p), false)), cell(ft(), true)],
    }))
    const headCols = list.map((p) => ({
      id: p.id,
      num: p.num,
      last: p.last,
      color: p.fc >= 5 ? '#FF6B6B' : '#C4C6CA',
    }))
    const TAGS = {
      made: [GREEN, '#FFFFFF', GREEN],
      miss: ['transparent', '#FF8A80', 'rgba(255,107,107,0.55)'],
      stat: ['rgba(255,255,255,0.06)', '#C4C6CA', 'rgba(255,255,255,0.1)'],
      opp: ['rgba(255,107,107,0.12)', '#FF8A80', 'rgba(255,107,107,0.35)'],
    } as const
    const history = state.events.slice(0, 5).map((e, idx) => {
      const p = e.pid ? byId(e.pid) : null
      const tg = TAGS[e.kind] || TAGS.stat
      return {
        id: e.id,
        time: `${e.period <= 4 ? `${e.period}º` : `PR${e.period - 4}`} · ${fmtClock(e.clock)}`,
        tag: e.tag,
        tagBg: tg[0],
        tagColor: tg[1],
        tagBd: tg[2],
        num: p ? `#${p.num}` : 'RIV',
        last: p ? p.last : 'Gran Canaria',
        text: e.text,
        bg: idx === 0 ? '#25272c' : 'transparent',
      }
    })
    const pd = state.pending
    const AR = state.attackRight
    const ch = state.chain
    const mark = pd || (ch && 'loc' in ch ? ch.loc : null) || null
    const NEU = { bg: '#25272c', fg: '#ECEBE8' }
    const GR = { bg: GREEN, fg: '#FFFFFF' }
    const RD = { bg: RED, fg: '#FFFFFF' }
    const pName = (id: string) => {
      const p = byId(id)
      return `#${p.num} ${p.last}`
    }
    type Btn = { label: string; sub: string; bg: string; fg: string; k?: ActionKey; on: () => void }
    const row = (p: Player, btns: Btn[]) => ({
      id: p.id,
      num: p.num,
      last: p.last,
      cols: Math.min(4, btns.length),
      maxH: btns.length > 4 ? '160px' : '96px',
      btns,
    })
    const dm = pd ? `${pd.dist.toFixed(1).replace('.', ',')} m del aro` : ''
    const pn: {
      eyebrow: string
      title: string
      sub: string
      rows: (ReturnType<typeof row> & { stripe?: string })[]
      big: { label: string; sub: string; bg: string; fg: string; on: () => void }[]
      bigCols: string
      foot: { label: string; bg: string; fg: string; on: () => void }[]
    } = { eyebrow: '', title: '', sub: '', rows: [], big: [], bigCols: '1fr', foot: [] }

    if (ch && ch.type === 'ast') {
      pn.eyebrow = `CANASTA · ${pName(ch.pid)}`
      pn.title = '¿Asistencia?'
      pn.sub = `${ch.three ? '+3' : '+2'} · ${ch.loc.zone}`
      pn.rows = list
        .filter((p) => p.id !== ch.pid)
        .map((p) =>
          row(p, [{ label: 'AS', sub: 'Asistencia', ...NEU, on: () => dispatch({ type: 'CHAIN_ASSIST', aPid: p.id, id: nextId() }) }]),
        )
      pn.foot = [{ label: 'Sin asistencia', ...NEU, on: () => dispatch({ type: 'CHAIN_ASSIST', aPid: null, id: nextId() }) }]
    } else if (ch && ch.type === 'reb') {
      pn.eyebrow = `${ch.fromShot ? 'TIRO FALLADO · ' : 'TL FALLADO · '}${pName(ch.pid)}`
      pn.title = '¿Rebote ofensivo?'
      pn.sub = ch.fromShot ? `${ch.three ? 'T3' : 'T2'} · ${ch.loc.zone}` : 'Último tiro libre'
      pn.rows = list.map((p) =>
        row(p, [{ label: 'RO', sub: 'Rebote ofensivo', ...NEU, on: () => dispatch({ type: 'CHAIN_REB', rPid: p.id, id: nextId() }) }]),
      )
      pn.foot = [{ label: 'Rebote rival', ...NEU, on: () => dispatch({ type: 'CHAIN_REB', rPid: null, id: nextId() }) }]
    } else if (ch && ch.type === 'ftAsk') {
      pn.eyebrow = `FALTA RECIBIDA · ${pName(ch.pid)}`
      pn.title = '¿Tiros libres?'
      pn.sub = 'Cuántos lanza'
      pn.bigCols = 'repeat(3, minmax(0,1fr))'
      pn.big = ([1, 2, 3] as const).map((n) => ({
        label: String(n),
        sub: n === 1 ? 'tiro' : 'tiros',
        ...NEU,
        on: () => dispatch({ type: 'CHAIN_FT_COUNT', n }),
      }))
      pn.foot = [{ label: 'Sin tiros libres', ...NEU, on: () => dispatch({ type: 'CANCEL_PANEL' }) }]
    } else if (ch && ch.type === 'ft') {
      pn.eyebrow = `TIROS LIBRES · ${pName(ch.pid)}`
      pn.title = `Tiro libre ${ch.i + 1} de ${ch.n}`
      pn.sub = ch.res.length ? `Anteriores: ${ch.res.map((r) => (r ? 'anotado' : 'fallado')).join(', ')}` : 'Primer lanzamiento'
      pn.bigCols = 'repeat(2, minmax(0,1fr))'
      pn.big = [
        { label: '+1', sub: 'Anotado', ...GR, on: () => dispatch({ type: 'CHAIN_FT', made: true, id: nextId() }) },
        { label: '✕', sub: 'Fallado', ...RD, on: () => dispatch({ type: 'CHAIN_FT', made: false, id: nextId() }) },
      ]
    } else if (pd) {
      const t3 = pd.def || pd.three
      pn.eyebrow = pd.def ? 'DEFENSA' : 'ATAQUE'
      pn.title = pd.zone
      pn.sub = pd.def ? dm.replace('del aro', 'de su aro') : `Tiro de ${t3 ? '3' : '2'} · ${dm}`
      pn.rows = list.map((p) =>
        row(p, [
          { label: t3 ? '+3' : '+2', sub: 'Anota', ...GR, k: 'made', on: () => dispatch({ type: 'RECORD_AT', pid: p.id, k: 'made', id: nextId() }) },
          { label: t3 ? 'T3' : 'T2', sub: 'Falla', ...RD, k: 'miss', on: () => dispatch({ type: 'RECORD_AT', pid: p.id, k: 'miss', id: nextId() }) },
          { label: 'RO', sub: 'Reb. of.', ...NEU, k: 'ro', on: () => dispatch({ type: 'RECORD_AT', pid: p.id, k: 'ro', id: nextId() }) },
          { label: 'RD', sub: 'Reb. def.', ...NEU, k: 'rd', on: () => dispatch({ type: 'RECORD_AT', pid: p.id, k: 'rd', id: nextId() }) },
          { label: 'BP', sub: 'Pérdida', ...NEU, k: 'bp', on: () => dispatch({ type: 'RECORD_AT', pid: p.id, k: 'bp', id: nextId() }) },
          { label: 'BR', sub: 'Robo', ...NEU, k: 'br', on: () => dispatch({ type: 'RECORD_AT', pid: p.id, k: 'br', id: nextId() }) },
          { label: 'FR', sub: 'Falta rec.', ...NEU, k: 'fr', on: () => dispatch({ type: 'RECORD_AT', pid: p.id, k: 'fr', id: nextId() }) },
          { label: 'FC', sub: 'Falta', ...NEU, k: 'fc', on: () => dispatch({ type: 'RECORD_AT', pid: p.id, k: 'fc', id: nextId() }) },
        ]),
      )
    }

    const STRIPES = ['#2a2d34', '#1d1f23']
    const NEU_ALT = '#2e3139'
    pn.rows = pn.rows.map((r, i) => ({
      ...r,
      stripe: STRIPES[i % 2],
      btns: r.btns.map((b) => ({ ...b, bg: i % 2 === 0 && b.bg === NEU.bg ? NEU_ALT : b.bg })),
    }))

    const sb = state.subs
    const subCard = (p: Player, onC: boolean) => {
      const on = !!sb && (sb.out === p.id || sb.inn === p.id)
      const out5 = p.fc >= 5
      return {
        id: p.id,
        num: p.num,
        last: p.last,
        line: out5 ? 'ELIMINADO' : `${p.fc} FC · ${fmtMin(p.min)}`,
        bg: on ? (onC ? 'rgba(255,107,107,0.16)' : 'rgba(10,126,58,0.22)') : '#25272c',
        bd: on ? (onC ? '#FF6B6B' : GREEN) : 'transparent',
        lineColor: out5 ? '#FF6B6B' : '#8C8F96',
        op: !onC && out5 ? 0.45 : 1,
      }
    }

    return {
      homeScore,
      awayScore,
      homeFouls: foulSq('home'),
      awayFouls: foulSq('away'),
      homeTO: toPips('home'),
      awayTO: toPips('away'),
      toMax,
      periodLabel: periodLabel(state.period),
      periodVal: periodVal(state.period),
      clockStr: fmtClock(state.clock),
      clockColor: state.clock < 600 ? '#FF6B6B' : '#E9B949',
      playBg: state.running ? 'rgba(255,255,255,0.1)' : '#E9B949',
      possL: state.poss === 'home' ? '#E9B949' : 'rgba(255,255,255,0.16)',
      possR: state.poss === 'away' ? '#E9B949' : 'rgba(255,255,255,0.16)',
      atkL: AR ? 'rgba(255,255,255,0.16)' : '#FFFFFF',
      atkR: AR ? '#FFFFFF' : 'rgba(255,255,255,0.16)',
      dimX: AR ? -40 : 14,
      atkLabelX: AR ? 26.6 : 1.4,
      defLabelX: AR ? 0.4 : 27.6,
      atkAnchor: (AR ? 'end' : 'start') as 'end' | 'start',
      defAnchor: (AR ? 'start' : 'end') as 'end' | 'start',
      AR,
      mark,
      panelOpen: !!pd || !!ch,
      panel: pn,
      history,
      starters: list.map((p) => ({ num: p.num, last: p.last })),
      histBlanks: history.length ? Math.max(0, 5 - history.length) : 0,
      headCols,
      rows,
      subsOpen: !!sb,
      subsTitle: !sb
        ? ''
        : sb.out
          ? `Sale ${pName(sb.out)} · elige quién entra`
          : sb.inn
            ? `Entra ${pName(sb.inn)} · elige quién sale`
            : 'Elige quién sale y quién entra',
      subsCourt: list.map((p) => subCard(p, true)),
      subsBench: state.players.filter((p) => !state.court.includes(p.id)).map((p) => subCard(p, false)),
    }
  }, [state, byId])

  // Las acciones no dependen del estado: así su identidad no cambia en cada tick
  // y los componentes memoizados no se vuelven a pintar 10 veces por segundo.
  const actions = useMemo(
    () => ({
      toggleClock: () => dispatch({ type: 'TOGGLE_CLOCK' }),
      startEdit: () => dispatch({ type: 'START_EDIT' }),
      cancelEdit: () => dispatch({ type: 'CANCEL_EDIT' }),
      setEdit: (value: string) => dispatch({ type: 'SET_EDIT', value }),
      saveEdit: () => dispatch({ type: 'SAVE_EDIT' }),
      setPeriod: (d: number) => dispatch({ type: 'SET_PERIOD', d }),
      togglePoss: () => dispatch({ type: 'TOGGLE_POSS' }),
      toggleAttack: () => dispatch({ type: 'TOGGLE_ATTACK' }),
      toggleTO: (side: TeamSide, i: number, rem: number, toMax: number) =>
        dispatch({ type: 'TOGGLE_TO', side, i, rem, toMax }),
      courtTap: (x: number, y: number) => dispatch({ type: 'COURT_TAP', x, y }),
      cancelPanel: () => dispatch({ type: 'CANCEL_PANEL' }),
      opp: (n: number) => dispatch({ type: 'OPP', n, id: nextId(), keep: true }),
      undo: (id: number) => dispatch({ type: 'UNDO', id }),
      openSubs: (out: string | null) => dispatch({ type: 'OPEN_SUBS', out }),
      closeSubs: () => dispatch({ type: 'CLOSE_SUBS' }),
      pickSub: (id: string) => dispatch({ type: 'PICK_SUB', id }),
      logoErr: (side: TeamSide) => dispatch({ type: 'LOGO_ERR', side }),
    }),
    [],
  )

  return { state, vm, ...actions }
}

export type GameApi = ReturnType<typeof useGame>
