export const STAT_KEYS = [
  'min',
  't2m',
  't2a',
  't3m',
  't3a',
  'ftm',
  'fta',
  'ro',
  'rd',
  'as',
  'br',
  'bp',
  'tap',
  'fc',
  'fr',
  'pm',
] as const

export type StatKey = (typeof STAT_KEYS)[number]

export interface Player {
  id: string
  num: number
  first: string
  last: string
  min: number
  t2m: number
  t2a: number
  t3m: number
  t3a: number
  ftm: number
  fta: number
  ro: number
  rd: number
  as: number
  br: number
  bp: number
  tap: number
  fc: number
  fr: number
  pm: number
}

export interface Loc {
  x: number
  y: number
  zone: string
  three: boolean
  def: boolean
}

export type EventKind = 'made' | 'miss' | 'stat' | 'opp'

export interface GameEvent {
  id: number
  pid: string | null
  period: number
  clock: number
  delta: Partial<Record<StatKey, number>>
  pts: number
  oppPts: number
  foul: boolean
  oppFoul: boolean
  loc: Loc | null
  court: string[]
  kind: EventKind
  tag: string
  text: string
}

export interface Pending {
  x: number
  y: number
  def: boolean
  three: boolean
  dist: number
  zone: string
}

export type Chain =
  | { type: 'ast'; pid: string; loc: Loc; three: boolean; srcId: number }
  | { type: 'reb'; pid: string; loc: Loc; three?: boolean; fromShot: boolean; srcId: number }
  | { type: 'ftAsk'; pid: string; loc: Loc; srcId: number }
  | { type: 'ft'; pid: string; loc: Loc; n: 1 | 2 | 3; i: number; res: boolean[]; srcId: number }

export interface GameState {
  running: boolean
  clock: number
  period: number
  poss: 'home' | 'away'
  attackRight: boolean
  players: Player[]
  court: string[]
  oppScore: number
  fouls: { home: number; away: number }
  to: { home: number; away: number }
  pending: Pending | null
  chain: Chain | null
  subs: { out: string | null; inn: string | null } | null
  subLog: { period: number; clock: number; out: string; inn: string }[]
  events: GameEvent[]
  editing: boolean
  editVal: string
  editErr: boolean
  logoErr: { home?: boolean; away?: boolean }
}

export type ActionKey = 'made' | 'miss' | 'ro' | 'rd' | 'bp' | 'br' | 'fr' | 'fc'

export type TeamSide = 'home' | 'away'
