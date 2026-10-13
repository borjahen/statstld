import { LiveGame } from './live/LiveGame'
import { ForceLandscape } from './pwa/ForceLandscape'
import { InstallApp } from './pwa/InstallApp'

export default function App() {
  return (
    <>
      <LiveGame />
      <InstallApp />
      <ForceLandscape />
    </>
  )
}
