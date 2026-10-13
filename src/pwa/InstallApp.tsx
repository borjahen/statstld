import { Dialog } from '@ark-ui/react/dialog'
import { useCallback, useEffect, useRef, useState } from 'react'
import './install.css'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

function isIos() {
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return iOS && !isStandalone()
}

const SNOOZE_MS = 20_000

export function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [snoozed, setSnoozed] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const snoozeTimer = useRef<number>(0)
  const ios = isIos()

  useEffect(() => {
    sessionStorage.removeItem('pwa-install-dismissed')
    setInstalled(isStandalone())

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setInstalled(true)
    }
    const mqStandalone = window.matchMedia('(display-mode: standalone)')
    const mqFullscreen = window.matchMedia('(display-mode: fullscreen)')
    const syncMode = () => setInstalled(isStandalone())

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    mqStandalone.addEventListener('change', syncMode)
    mqFullscreen.addEventListener('change', syncMode)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      mqStandalone.removeEventListener('change', syncMode)
      mqFullscreen.removeEventListener('change', syncMode)
      window.clearTimeout(snoozeTimer.current)
    }
  }, [])

  const dismiss = () => {
    setSnoozed(true)
    window.clearTimeout(snoozeTimer.current)
    snoozeTimer.current = window.setTimeout(() => setSnoozed(false), SNOOZE_MS)
  }

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      setDeferred(null)
      if (outcome === 'accepted') setInstalled(true)
      return
    }
    setHelpOpen(true)
  }, [deferred])

  if (installed || snoozed) return null

  return (
    <>
      <div className="install-fab">
        <button type="button" className="install-btn" onClick={() => void install()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12" />
            <path d="m7 11 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          Instalar app
        </button>
        <button type="button" className="install-x" title="Ocultar un momento" onClick={dismiss}>
          ✕
        </button>
      </div>

      <Dialog.Root open={helpOpen} onOpenChange={(d) => setHelpOpen(d.open)} lazyMount unmountOnExit>
        <Dialog.Backdrop className="install-backdrop" />
        <Dialog.Positioner className="install-pos">
          <Dialog.Content className="install-dialog">
            <Dialog.Title className="install-dialog-title">Instalar Telde Stats</Dialog.Title>
            <Dialog.Description className="install-dialog-body">
              {ios ? (
                <>
                  En iPad/iPhone: toca <strong>Compartir</strong> y luego <strong>Añadir a pantalla de inicio</strong>.
                  Así se abre a pantalla completa, sin el navegador.
                </>
              ) : (
                <>
                  El instalador del navegador no está disponible ahora. En Chrome o Edge abre el menú (⋮) y elige{' '}
                  <strong>Instalar aplicación</strong> o <strong>Añadir a la pantalla de inicio</strong>.
                </>
              )}
            </Dialog.Description>
            <Dialog.CloseTrigger className="install-dialog-ok">Entendido</Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  )
}
