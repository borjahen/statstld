import { useGame } from '../game/useGame'
import { Court } from './Court'
import { HistoryBar } from './HistoryBar'
import { StatsSidebar } from './StatsSidebar'
import { Topbar } from './Topbar'
import './live.css'
import './compact.css'

export function LiveGame() {
  const game = useGame()
  return (
    <div className="shell">
      <div className="left">
        <Topbar game={game} />
        <Court game={game} />
        <HistoryBar game={game} />
      </div>
      <StatsSidebar game={game} />
    </div>
  )
}
