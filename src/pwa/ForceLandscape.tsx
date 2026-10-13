import { useEffect, useState } from 'react'
import './landscape.css'

function isPortrait() {
  return window.matchMedia('(orientation: portrait)').matches || window.innerHeight > window.innerWidth
}

async function lockLandscape() {
  const orient = screen.orientation as ScreenOrientation & {
    lock?: (orientation: string) => Promise<void>
  }
  if (typeof orient?.lock !== 'function') return
  try {
    await orient.lock('landscape')
  } catch {
    try {
      await orient.lock('landscape-primary')
    } catch {
      /* Solo funciona en PWA instalada, Android o pantalla completa. */
    }
  }
}

export function ForceLandscape() {
  const [portrait, setPortrait] = useState(() => isPortrait())

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)')
    const sync = () => setPortrait(isPortrait())
    const onVisible = () => {
      if (document.visibilityState === 'visible') void lockLandscape()
    }
    const onGesture = () => {
      void lockLandscape()
    }

    mq.addEventListener('change', sync)
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    window.addEventListener('pointerdown', onGesture, { passive: true })
    document.addEventListener('visibilitychange', onVisible)
    void lockLandscape()

    return () => {
      mq.removeEventListener('change', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
      window.removeEventListener('pointerdown', onGesture)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!portrait) return null

  return (
    <div className="rotate-gate" role="alertdialog" aria-live="assertive" aria-labelledby="rotate-title">
      <div className="rotate-visual" aria-hidden>
        <svg className="rotate-tablet" viewBox="0 0 120 120">
          <rect x="36" y="16" width="48" height="88" rx="9" fill="#17181B" stroke="#E9B949" strokeWidth="3" />
          <rect x="42" y="26" width="36" height="62" rx="3" fill="#0A2B85" />
          <rect x="46" y="30" width="20" height="54" rx="1.5" fill="#E0C9AE" />
          <rect x="68" y="30" width="6" height="54" rx="1" fill="#1D1F23" />
          <rect x="54" y="94" width="12" height="3" rx="1.5" fill="#E9B949" />
        </svg>
      </div>
      <h1 id="rotate-title">Gira el dispositivo</h1>
      <p>Esta pantalla solo funciona en horizontal.</p>
    </div>
  )
}
