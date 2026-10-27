import { Capacitor } from '@capacitor/core'
import { LiveGame } from './live/LiveGame'
import { ForceLandscape } from './pwa/ForceLandscape'
import { InstallApp } from './pwa/InstallApp'

// En la app nativa el sistema ya fija el horizonte y no hay nada que instalar.
const native = Capacitor.isNativePlatform()

export default function App() {
  return (
    <>
      <LiveGame />
      {native ? null : <InstallApp />}
      {native ? null : <ForceLandscape />}
    </>
  )
}
