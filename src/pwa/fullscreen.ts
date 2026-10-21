import { useCallback, useEffect, useState } from 'react'

type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> }
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }

const supported = () => {
  const el = document.documentElement as FsEl
  return typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function'
}

const isFullscreen = () => Boolean(document.fullscreenElement || (document as FsDoc).webkitFullscreenElement)

async function enter() {
  const el = document.documentElement as FsEl
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' })
    else await el.webkitRequestFullscreen?.()
    // En pantalla completa Android deja bloquear la orientación.
    await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape')
  } catch {
    /* Rechazado o sin soporte (iPhone): no hay nada que hacer. */
  }
}

async function exit() {
  try {
    if (document.exitFullscreen) await document.exitFullscreen()
    else await (document as FsDoc).webkitExitFullscreen?.()
  } catch {
    /* ignorar */
  }
}

let autoTried = false

/** Estado de pantalla completa. La primera pulsación la activa sola; el botón alterna después. */
export function useFullscreen() {
  const [active, setActive] = useState(isFullscreen)
  const canFullscreen = supported()

  useEffect(() => {
    const sync = () => setActive(isFullscreen())
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)

    // El navegador exige un gesto del usuario, así que se aprovecha el primer toque.
    const auto = () => {
      if (autoTried) return
      autoTried = true
      if (supported() && !isFullscreen()) void enter()
    }
    window.addEventListener('pointerup', auto, { once: true })

    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
      window.removeEventListener('pointerup', auto)
    }
  }, [])

  const toggle = useCallback(() => {
    autoTried = true
    void (isFullscreen() ? exit() : enter())
  }, [])

  return { active, canFullscreen, toggle }
}
