# CB Telde · Stats (PWA)

Pantalla **Live Game** para tablet horizontal. UI del handoff, lista para ir añadiendo persistencia (offline-first + Supabase).

## Stack

- **Vite 7** + **React 19** + TypeScript
- **[Ark UI](https://ark-ui.com) 5.39.3** (`@ark-ui/react`) — última estable
- **vite-plugin-pwa** (service worker + manifiesto landscape)

Ark UI es headless: los colores y medidas salen de `design_handoff_live_game_tablet/tokens.json`.

## Arranque

```bash
npm install
npm run dev
```

Abre en Chrome a **1180×820** (modo dispositivo / tableta apaisada).

## GitHub Pages

Tras cada push a `main` se publica en [https://borjahen.github.io/statstld/](https://borjahen.github.io/statstld/).

## Qué hay ahora

- Marcador, crono, cuartos, posesión y lado de ataque
- Cancha FIBA táctil con punto pendiente
- Panel de acción (anota/falla + cadena asistencia / rebote / TL)
- Tabla en pista, historial con deshacer y cambios
- PWA instalable (offline del shell; datos aún en memoria)

Supabase y sync quedan para el siguiente paso.
