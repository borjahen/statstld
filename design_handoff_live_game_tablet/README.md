# Handoff: Live Game · Tablet horizontal (CB Telde)

## Overview
Pantalla de **registro de estadísticas en directo** de un partido de baloncesto (reglas FIBA) para una tablet en horizontal. La usa un delegado o un jugador desde el banquillo, no un oficial de mesa, así que prima la **rapidez**: casi cualquier acción se registra con **2 toques** (tocar la zona de la cancha y luego el botón del jugador). Solo se registran las stats de **nuestro equipo** (CB Telde). Del rival solo se lleva el marcador.

Cada acción queda guardada con su **coordenada en la cancha** para el análisis posterior (mapas de tiro, de pérdidas, etc.), que se verá en otra vista.

## About the Design Files
Los archivos de `prototype/` son **referencias de diseño hechas en HTML**. Son prototipos funcionales que muestran el aspecto y el comportamiento esperados; **no son código de producción** para copiar. La tarea es **recrear esta vista en ArkUI (ArkTS, HarmonyOS)**, 1:1 en aspecto y comportamiento, con los patrones del proyecto destino.

Para ver el prototipo, abre `prototype/Live Game - Tablet Horizontal.dc.html` en Chrome y activa el modo dispositivo con 1180×820. Hace falta conexión para cargar las fuentes de Google y el escudo rival. Toda la lógica está en el `<script data-dc-script>` del final del archivo. Es la **fuente de verdad** del comportamiento: si este README y el código discrepan, manda el código.

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografía, tamaños, espaciados e interacciones son los finales. Recréalo pixel a pixel; 1 px CSS = 1 vp.

---

## Notas de implementación ArkUI
- **Unidades:** todos los valores son px CSS y se trasladan directamente a **vp**. Las fuentes en px pasan a **fp** con el mismo número.
- **Fuentes:** registra **Barlow** (400/500/600/700) y **Barlow Condensed** (500/600/700) con `font.registerFont` (están en Google Fonts, licencia OFL). Todos los números (marcador, crono, dorsales, stats) usan Barlow Condensed con cifras tabulares, `fontFeature("\"tnum\" on")`.
- **Layout raíz:** un `Row` con una columna izquierda flexible (`layoutWeight(1)`) y un sidebar fijo de **400 vp**. La columna izquierda es un `Column` con Topbar (96 vp), Cancha (`layoutWeight(1)`) e Historial (64 vp). Ocupa toda la pantalla, sin scroll.
- **Overlays del sidebar:** el panel de acción y el de cambios van en un `Stack` encima de la tabla, ocupando el sidebar entero. **Nunca cambian el tamaño de la cancha.**
- **Cancha:**
  - Dibújala con `Canvas` y `CanvasRenderingContext2D`, o con `Shape`/`Path`, en coordenadas de metros. Tienes la geometría completa en `court.svg`.
  - Escala uniforme tipo "contain" (como `preserveAspectRatio="xMidYMid meet"`) del rectángulo de `-2.4,-2.4` a `30.4,17.4` (32.8 × 19.8 m) dentro del área disponible, centrado en los dos ejes.
  - El sobrante del área se rellena con la misma madera.
  - Para convertir un toque a metros: `xm = (touchX - offsetX) / scale - 2.4`, y lo mismo con Y.
- **Grids:** usa `Grid`/`GridItem` o `Row`/`Column` con `layoutWeight`. Los "gap: 1px" con fondo `#0B0C0D` hacen de líneas divisorias: el contenedor tiene ese fondo y los hijos van separados 1 vp.
- **Estado:** un `@Observed` GameState con el ViewModel y `@State`/`@Link` en los componentes. La lógica del prototipo está en un solo componente; sepárala como quieras.
- **Estados pulsados:** los botones con `style-active` aplican ese fondo mientras se pulsan (usa `stateStyles({ pressed: … })`). `filter: brightness(1.3)` puede ser un overlay blanco al 12–15 %.
- **Iconos:** son SVG simples, dibujados en la propia vista (ver §Iconos). Pásalos a `Path` o a recursos SVG.

---

## Screens / Views

### 0. Estructura global
- **Contenedor raíz:**
  - Fondo `#161719`, texto `#ECEBE8`, fuente Barlow.
  - Mínimo de diseño **1180 × 680 vp**; objetivo 1180×820 y 1280×800.
  - Dos columnas: izquierda flexible y sidebar de 400 vp con borde izquierdo de 1 vp `#0B0C0D`.
- **Columna izquierda:** Topbar (alto fijo 96), Cancha (flexible) e Historial (alto fijo 64), apilados sin separación.

### 1. Topbar (marcador)
- **Contenedor:**
  - Fondo `#0D0E10`, borde inferior de 1 vp `#000`, alto 96, padding horizontal 12.
  - Cuatro columnas separadas 8 vp: `[equipo local · flexible] [bloque central · ancho propio] [equipo visitante · flexible] [botones rival · ancho propio]`, centradas en vertical.

**1a. Equipo local** (Row, gap 8, alineado al centro)
- **Escudo:**
  - Caja de 38×38, fondo `#FFFFFF`, radio 6, padding 3.
  - Imagen `assets/cbtelde.png` en modo *contain*.
- **Columna de info** (flex 1, gap 4, se puede encoger):
  - **Nombre:** «CB TELDE», Barlow 13 fp, peso 700, tracking 0.04 em, mayúsculas, una sola línea con elipsis.
  - **Faltas de equipo:** fila de **5 cuadrados** de 9×9 vp, radio 2, borde de 1.5 vp, separados 2 vp.
    - Lleno: fondo y borde `#ECEBE8`.
    - Vacío: fondo transparente y borde `rgba(255,255,255,0.32)`.
    - Con 5 o más faltas, los llenos pasan a `#FF6B6B`.
  - **Tiempos muertos:** fila de **círculos** de 9×9, borde de 1.5 vp, separados 2 vp.
    - Disponible: relleno y borde `#E9B949`.
    - Gastado: transparente con borde `rgba(255,255,255,0.32)`.
    - Cada círculo está dentro de un botón de 9×20 (zona táctil; amplíala con `hitTestBehavior`/`responseRegion` hasta al menos 24 vp).
  - Las etiquetas «FALTAS» y «T.M.» se quitaron a propósito: no caben.
- **Marcador:**
  - Barlow Condensed 700, alto de línea 1, tracking 0.01 em, cifras tabulares, alineado a la derecha (`margin-left:auto`).
  - Tamaño fluido `clamp(36px, 3.4vw, 64px)`, es decir, 3.4 % del ancho de pantalla entre 36 y 64 fp. Con 1180 da **40 fp**.

**1b. Bloque central** (crono)
- **Contenedor:**
  - Row, alto 80, padding horizontal 8, gap 6, alineado al centro.
  - Fondo `#17181B`, borde de 1 vp `rgba(255,255,255,0.06)`, radio 12.
- **Cuarto** (columna, gap 4, centrada):
  - **Etiqueta:** «CUARTO» o «PRÓRROGA», Barlow 8 fp, peso 600, tracking 0.14 em, `#8C8F96`.
  - **Fila:**
    - Botón **‹** de 26×32, radio 6, borde de 1 vp `rgba(255,255,255,0.08)`, fondo `rgba(255,255,255,0.05)` (pulsado: `rgba(255,255,255,0.14)`), glifo de 16 fp.
    - Valor «1º», «2º», «3º», «4º», «PR1», «PR2»…: Barlow Condensed 700 a 22 fp, ancho mínimo 28, centrado.
    - Botón **›**, igual que el de la izquierda.
- **Divisor:** 1 vp de ancho, `rgba(255,255,255,0.07)`, margen vertical de 12 y horizontal de 2.
- **Crono** (columna, gap 4, centrada, ancho mínimo 90):
  - **Modo normal:**
    - **Tiempo:** Barlow Condensed 600, 40 fp, alto de línea 0.95, tracking 0.02 em, cifras tabulares. Color `#E9B949`, o `#FF6B6B` con menos de 60 s.
      - **Formato:** con 60 s o más, `m:ss` (por ejemplo `10:00` o `4:37`). Con menos de 60 s, `ss.d` (por ejemplo `09.4`).
    - **Botón «✎ Editar»:** alto 22, padding horizontal 9, radio 6, mismo estilo fantasma que ‹ ›, Barlow 10 fp peso 600 en `#B9BBC0`, gap 5 entre glifo y texto.
  - **Modo edición:**
    - **Campo de texto:** 96×40, Barlow Condensed 600 a 34 fp, `#E9B949`, centrado, fondo `#0D0E10`, borde de 1.5 vp `#E9B949` (`#FF6B6B` si hay error), radio 8, placeholder «m:ss», teclado numérico/decimal.
    - **Botones debajo** (gap 4):
      - «Cancelar»: fantasma, alto 22, padding 6, 10 fp, peso 600.
      - «OK»: alto 22, padding 8, fondo `#E9B949`, texto `#141414`, 10 fp, peso 700.
- **Botón iniciar/parar:**
  - 46×46, radio 10, sin borde, glifo centrado.
  - Parado: fondo `#E9B949` con triángulo ▶ (16×18) en `#141414`.
  - En marcha: fondo `rgba(255,255,255,0.1)` con pausa ❚❚ (dos rectángulos de 5.5×20 de radio 1.5 en un viewBox de 20×22, escalado a 16×18) en `#ECEBE8`.
- **Divisor:** igual que el anterior.
- **Columna de toggles** (gap 4). Son dos botones de 80×30, radio 6, estilo fantasma, con contenido en fila (gap 6, centrado): triángulo izquierdo de 11×11, etiqueta Barlow 9 fp peso 600 tracking 0.08 em en `#8C8F96`, y triángulo derecho de 11×11.
  - **«POS.»** (flecha de posesión alterna): el triángulo del lado con posesión va en `#E9B949` y el otro en `rgba(255,255,255,0.16)`. El izquierdo representa al local.
  - **«ATAQUE»** (canasta que atacamos): el triángulo del lado atacado va en `#FFFFFF` y el otro en `rgba(255,255,255,0.16)`.
  - Los triángulos se dibujan en un viewBox de 18×18. Izquierdo: `16,2 16,16 3,9`. Derecho: `2,2 2,16 15,9`.

**1c. Equipo visitante:** simétrico al local, en espejo. El orden es marcador, info alineada a la derecha y escudo. El nombre es «CB GRAN CANARIA».
- **Escudo:** imagen remota `https://cbgrancanaria.net/wp-content/uploads/2015/01/logo-team.png` en la caja blanca de 38×38. Si falla la carga, va el texto «CBGC» en Barlow Condensed 700 a 14 fp `#111`. En la app real, mejor como recurso local.

**1d. Botones del rival**
- **Contenedor:** columna con gap 3, padding izquierdo de 8 y borde izquierdo de 1 vp `rgba(255,255,255,0.07)`.
- **Botones «+1», «+2», «+3»:** 44×26, radio 6, borde de 1 vp `rgba(255,107,107,0.4)`, fondo `rgba(255,107,107,0.1)` (pulsado: `0.3`), texto Barlow Condensed 700 a 15 fp `#FF8A80`.

### 2. Cancha (área central)
- **Área táctil:** ocupa todo el espacio entre topbar e historial, sin márgenes.
- **Escalado:** ver §Notas ArkUI. La cancha se escala para caber entera y centrada, y todo el fondo sobrante es madera.

**Geometría FIBA** (metros, origen arriba a la izquierda de la pista; detalle en `court.svg`)
- **Pista:** 28 × 15. La línea central está en x = 14.
- **Franja azul perimetral:** de x −1.2 a 29.2 y de y −1.2 a 16.2, en `#0A2B85`. Fuera de ella, más madera.
- **Zona restringida:** 5.8 × 4.9 a cada lado (y de 5.05 a 9.95), relleno `#0A2B85` al 90 % de opacidad.
- **Tiro libre:** semicírculo de r = 1.8 con centro en (5.8, 7.5) / (22.2, 7.5). La mitad exterior es continua; la interior va discontinua (guion 0.3, hueco 0.24).
- **Triple:**
  - Rectas a 0.9 de las bandas (y = 0.9 e y = 14.1), desde la línea de fondo hasta x = 2.99 (o 25.01 en el otro lado).
  - Arco de r = 6.75 con centro en el aro.
- **Aro:** centro en (1.575, 7.5) / (26.425, 7.5), r = 0.225, color `#CB5A1A`, trazo 0.05. Lleva una unión de 0.15 hasta el tablero.
- **Tablero:** línea en x = 1.2 / 26.8, de y = 6.6 a 8.4, trazo 0.07.
- **Semicírculo de no carga:** r = 1.25 con centro en el aro, más unas rectas de 0.375.
- **Marcas de banquillo:** dos rayitas en x = 8.325 y 19.675, de y −0.15 a 0.
- **Líneas:** `#F7F5EF`, 5 cm (0.05).
- **Círculo central:** r = 1.8, **relleno blanco** sin línea, con el escudo `cbtelde.png` de 3.24 × 3.24 m centrado encima (90 % del círculo).

**Madera**
- **Base:** `#E0C9AE`, que es `hsl(32 44% 78%)`.
- **Textura procedural** con tres capas de ruido, con la misma configuración dentro y fuera de la franja:
  1. Veta oscura: `fractalNoise`, baseFrequency (0.05, 2.4), 3 octavas, semilla 5, color rgb(0.55, 0.33, 0.14). Alpha = 2.2·ruido − 0.95; capa al 24 %.
  2. Veta clara: baseFrequency (0.07, 3.1), semilla 19, color casi blanco (1, 0.97, 0.9). Alpha = 2.2·ruido − 1.0; capa al 26 %.
  3. Grano: baseFrequency (0.4, 26), semilla 7, color (0.42, 0.25, 0.10). Alpha = 1.6·ruido − 0.62; capa al 12 %.
- **Atajo en ArkUI:** genera esta textura **una vez** como bitmap (PixelMap) o PNG de unos 2048 px y úsala como fondo. Así queda 1:1 y es mucho más barato que calcularla en tiempo real.
- **Brillo y barniz**, solo sobre la pista, de 0 a 28 y de 0 a 15:
  - Degradado radial "sheen" (centro 50 %/45 %, r 65 %): blanco al 10 % en el centro, `#3A2410` al 16 % en el borde.
  - En modo *screen*:
    - Degradado vertical de blanco al 10 % arriba a transparente al 50 %, y `#5A3410` al 6 % abajo.
    - Cinco reflejos elípticos de degradado radial (blanco al 26 % en el centro, 8 % al 55 % del radio, 0 en el borde):
      - (7, 3.6) y (21, 3.6), con rx 5.5 y ry 2.2;
      - (7, 11.4) y (21, 11.4), igual pero al 60 %;
      - (14, 7.5), con rx 3.5, ry 1.6 y al 70 %.

**Ataque y defensa**
- **Velo de la mitad que defendemos:** rectángulo `rgba(40,24,8,0.08)` que cubre esa mitad entera, incluida la madera exterior. Es muy sutil a propósito.
- **Rótulos en la franja azul superior**, centrados en vertical en ella:
  - Barlow Condensed 700, 0.62 m de cuerpo y tracking 0.12 m.
  - **«ATAQUE»** en `#FFFFFF`, pegado a la esquina de su línea de fondo, con flecha «›» o «‹» de 0.75 m apuntando hacia fuera, hacia la canasta.
  - **«DEFENSA»** en blanco al 60 %, en la esquina contraria.
  - Si atacamos a la derecha: ATAQUE acaba en x = 26.6 y la flecha › empieza en x = 26.8; DEFENSA empieza en x = 0.4. A la izquierda, en espejo.
- **Punto pendiente:** al tocar la cancha se dibuja un marcador en ese punto: un círculo de r = 0.5 con relleno `rgba(10,43,133,0.22)` y trazo 0.08 `#0A2B85`, y dentro un punto de r = 0.12 `#0A2B85`. Sigue visible durante las preguntas encadenadas (asistencia, rebote, tiros libres).
- **Sin puntos de tiro:** la cancha no pinta tiros ni acciones anteriores; eso es para la vista de análisis.

### 3. Historial (barra inferior)
- **Contenedor:** alto 64, fondo `#1D1F23`, borde superior de 1 vp `#0B0C0D`, **5 columnas iguales**, sin márgenes. Cada celda lleva borde derecho de 1 vp `#0B0C0D`.
- **Con acciones:** se muestran las **5 más recientes**, la más reciente a la izquierda con fondo `#25272C` y el resto transparentes. Si hay menos de 5, las celdas que faltan van vacías, solo con su borde.
- **Celda:** dos columnas, contenido flexible y botón de deshacer de 34.
  - **Contenido** (columna centrada en vertical, gap 3, padding de 0 4 0 10):
    - **Línea 1** (gap 6):
      - **Etiqueta:** alto 18, ancho mínimo 28, padding de 0 4, radio 4, Barlow Condensed 700 a 12 fp, tracking 0.04 em. Variantes:
        - Anotado (`+1`, `+2`, `+3`): fondo y borde `#0A7E3A`, texto blanco.
        - Fallado (`T2`, `T3`, `TL`): fondo transparente, borde `rgba(255,107,107,0.55)`, texto `#FF8A80`.
        - Stat (`RO`, `RD`, `AS`, `BR`, `BP`, `FR`, `FC`): fondo `rgba(255,255,255,0.06)`, borde `rgba(255,255,255,0.1)`, texto `#C4C6CA`.
        - Rival (`+1`, `+2`, `+3`): fondo `rgba(255,107,107,0.12)`, borde `rgba(255,107,107,0.35)`, texto `#FF8A80`.
      - **Tiempo:** «1º · 7:42» o «PR1 · 0:45», en Barlow Condensed 600 a 13 fp `#8C8F96`, cifras tabulares. Usa el mismo formato que el crono.
    - **Línea 2:** dorsal «#3» en Barlow Condensed 700 a 14 fp blanco, y apellido en Barlow 12 fp peso 600 `#ECEBE8` con elipsis. Para el rival: «RIV» y «Gran Canaria».
    - **Línea 3:** texto de la acción en Barlow 12 fp `#A4A7AD` con elipsis, por ejemplo «Triple anotado», «Rebote defensivo» o «Rival anota».
  - **Botón deshacer:**
    - Ocupa todo el alto, 34 de ancho, con borde izquierdo de 1 vp `rgba(255,255,255,0.05)` (pulsado: fondo `rgba(255,255,255,0.12)`).
    - Icono de deshacer de 16×16, trazo 2 `#C4C6CA`, extremos y uniones redondeados. Viewbox 24: `M9 14 4 9l5-5` y `M4 9h10.5a5.5 5.5 0 0 1 0 11H11`.
- **Sin acciones (estado inicial):** una sola celda que ocupa las 5 columnas, en fila con gap 14 y padding horizontal 14.
  - Etiqueta «QUINTETO / INICIAL» en dos líneas: 10 fp, peso 600, tracking 0.14 em, `#8C8F96`.
  - 5 tarjetas de 66×44 (gap 4), fondo `#25272C`, con dorsal en Barlow Condensed 700 a 17 fp blanco y apellido a 10 fp peso 600 `#A4A7AD`.
  - A la derecha, «Toca la cancha para registrar la primera acción» en 12 fp `#6E7178`.

### 4. Sidebar · Tabla «en pista»
- **Contenedor:** 400 de ancho, fondo `#1D1F23`, padding 16, columna con gap 14. Es el ancla de los overlays.
- **Cabecera** (fila espaciada):
  - «CB TELDE · EN PISTA»: 10 fp, peso 600, tracking 0.14 em, `#8C8F96`.
  - **Botón «Cambios»:** alto 36, padding de 0 12, radio 8, borde de 1 vp `rgba(255,255,255,0.1)`, fondo `rgba(255,255,255,0.05)` (pulsado: 0.14). Lleva un icono ⇄ de 15×15 con trazo 2 `#ECEBE8` (paths `M7 4 3 8l4 4`, `M3 8h14`, `m17 20 4-4-4-4`, `M21 16H7`), separado 7 vp del texto «Cambios» en 12 fp peso 700.
- **Tabla:**
  - Columnas `[44 etiqueta][5 × jugador flexible][52 equipo]` con gap 2. Cifras tabulares.
  - **Cabecera** (alto 58, margen inferior 4): celda vacía, 5 botones de jugador y una caja «EQUIPO».
    - Cada botón de jugador tiene radio 8 y fondo transparente, con dorsal en Barlow Condensed 700 a 23 fp y apellido a 10.5 fp peso 600 con elipsis. Ambos en `#C4C6CA`, o `#FF6B6B` si el jugador tiene 5 faltas.
    - Al tocar un jugador se abre **Cambios** con ese jugador ya marcado para salir.
    - La caja «EQUIPO» tiene radio 8, fondo `rgba(255,255,255,0.035)` y texto 10 fp peso 700 tracking 0.12 em `#8C8F96`.
  - **14 filas** que se reparten el alto disponible (cada una flexible, entre 24 y 40 de alto), radio 5. Las filas pares van transparentes y las impares con `rgba(255,255,255,0.022)`.
    - Orden: **MIN, PTS, T2, T3, TL, RO, RD, RT, AS, BR, BP, FC, +/-, VAL**.
    - **Etiqueta:** padding izquierdo 8, 11 fp, peso 700, tracking 0.06 em. Color `#B199F4` para PTS y VAL, y `#8C8F96` para el resto.
    - **Celdas:** 13.5 fp, centradas, en `#D5D6D9` con peso 500. PTS y VAL van en `#FFFFFF` con peso 700. La columna de equipo lleva fondo `rgba(255,255,255,0.035)`.
    - **Faltas (FC):** el valor va en `#E9B949` con 4 faltas y en `#FF6B6B` con 5 o más.
    - **Formatos:** MIN como `m:ss` del tiempo jugado. T2, T3 y TL como `anotados/intentados` (por ejemplo `3/5`). +/- con signo (`+4`, `-2`, `0`). En la columna de equipo, MIN va vacío, +/- es la diferencia del marcador y VAL es la valoración del total.
    - **Ajuste opcional `showPct`** (en el prototipo es un tweak, por defecto apagado): bajo T2, T3 y TL muestra el % en 10 fp `#8C8F96`.
  - **Altura:** la tabla no hace scroll entre 768 y 1024 vp de alto. Por debajo de 768, el sidebar hace scroll como último recurso.

### 5. Overlay · Panel de acción (sobre el sidebar)
- **Contenedor:**
  - Cubre todo el sidebar (`position:absolute; inset:0`, z 5).
  - Fondo `#0B0C0D`, columna con **gap 1**. El fondo oscuro asoma entre los bloques y hace de líneas.
  - Esquinas **cuadradas** (radio 0) en todo el panel.
- **Cabecera** (alto 64, columnas `[flexible][64]`, gap 1):
  - **Bloque de texto** (fondo `#1D1F23`, padding horizontal 14, gap 4):
    - Línea 1: eyebrow en 10 fp peso 600 tracking 0.14 em `#8C8F96`, y al lado subtítulo en 11 fp `#6E7178` con elipsis.
    - Línea 2: título en Barlow Condensed 700 a 22 fp blanco.
  - **Botón ✕:** 64 × 64, fondo `#1D1F23` (pulsado `#2E3036`), glifo de 17 fp `#C4C6CA`.
- **Cuerpo, tipo A, filas de jugador** (flexible, columna con **gap 5** entre jugadores):
  - Cada jugador es una fila flexible de alto máximo 160 con 8 botones, o 96 con 1 botón. Columnas `[58 dorsal][botones]`, gap 1.
  - **Columna del dorsal:** dorsal en Barlow Condensed 700 a 30 fp blanco, y apellido en 10 fp peso 600 blanco al 80 % con elipsis.
    - El fondo **alterna** para distinguir jugadores: 1º, 3º y 5º en `#2A2D34`; 2º y 4º en `#1D1F23`.
  - **Rejilla de botones:** 4 columnas iguales, filas de 44 vp como mínimo que se reparten el alto, gap 1.
  - **Botón:** sin radio ni borde, con etiqueta en Barlow Condensed 700 a 19 fp y subetiqueta en 9 fp peso 600 al 75 % de opacidad, gap 2.
    - Neutro: fondo `#25272C` (en las filas 1ª, 3ª y 5ª, `#2E3139`) y texto `#ECEBE8`.
    - Anota: fondo `#0A7E3A` y texto blanco.
    - Falla: fondo `#B02A2D` y texto blanco.
    - Pulsado: brillo ×1.3.
- **Cuerpo, tipo B, botones grandes** (flexible, rejilla de N columnas, gap 1):
  - Cada botón lleva una etiqueta en Barlow Condensed 700 a 52 fp y una subetiqueta a 13 fp peso 600 al 80 % de opacidad, gap 6.
- **Pie opcional:** alto 56, botones repartidos a partes iguales con gap 1, texto a 14 fp peso 700, color neutro.

**Contenido según el estado**

| Estado | Eyebrow | Título | Subtítulo | Cuerpo | Pie |
|---|---|---|---|---|---|
| Toque en cancha, mitad **ataque** | `ATAQUE` | zona (`Zona`, `Media distancia`, `Triple esquina`, `Triple`) | `Tiro de 2 · 4,3 m del aro` | A: 5 jugadores × 8 botones | — |
| Toque en cancha, mitad **defensa** | `DEFENSA` | `Defensa`-zona (`Zona`, `Media distancia`, `Triple`…, `Campo contrario`) | `5,1 m de su aro` | A: 5 × 8, iguales | — |
| Tras **Anota** | `CANASTA · #3 Serrano` | `¿Asistencia?` | `+2 · Zona` | A: los otros 4 jugadores × [AS «Asistencia»] | `Sin asistencia` |
| Tras **Falla** (o último TL fallado) | `TIRO FALLADO · #3 Serrano` / `TL FALLADO · …` | `¿Rebote ofensivo?` | `T3 · Triple` / `Último tiro libre` | A: 5 × [RO «Rebote ofensivo»] | `Rebote rival` |
| Tras **Falta recibida** | `FALTA RECIBIDA · #3 Serrano` | `¿Tiros libres?` | `Cuántos lanza` | B: `1` «tiro», `2` «tiros», `3` «tiros» (neutros) | `Sin tiros libres` |
| Lanzando TL | `TIROS LIBRES · #3 Serrano` | `Tiro libre 1 de 2` | `Primer lanzamiento` / `Anteriores: anotado, fallado` | B: `+1` «Anotado» (verde) · `✕` «Fallado» (rojo) | — |

Los **8 botones por jugador** son **idénticos en ataque y en defensa**, por memoria muscular. Siempre están en el mismo orden:

| Fila | Columna 1 | Columna 2 | Columna 3 | Columna 4 |
|---|---|---|---|---|
| 1 | `+2`/`+3` «Anota» (verde) | `T2`/`T3` «Falla» (rojo) | `RO` «Reb. of.» | `RD` «Reb. def.» |
| 2 | `BP` «Pérdida» | `BR` «Robo» | `FR` «Falta rec.» | `FC` «Falta» |

- **+2 o +3:** sale según la zona tocada.
- **En la mitad de defensa:** Anota y Falla son siempre **+3/T3** y se guardan como triple desde **«Campo propio»**.

### 6. Overlay · Cambios (sobre el sidebar)
- **Contenedor:** cubre todo el sidebar (z 6), fondo `#1D1F23`, padding de 14 12 12, columna con gap 12.
- **Cabecera:**
  - Eyebrow «CAMBIOS» y título «Sustitución» en Barlow Condensed 700 a 26 fp.
  - Subtítulo en 12 fp `#A4A7AD`, que cambia según la selección:
    - «Elige quién sale y quién entra»;
    - «Sale #3 Serrano · elige quién entra»;
    - «Entra #5 Medina · elige quién sale».
  - Botón ✕ de 44×44, radio 8, estilo fantasma.
- **Sección «EN PISTA»:** etiqueta igual que los eyebrows y rejilla de **5 columnas**, gap 6.
- **Sección «BANQUILLO»:** igual, con rejilla de **4 columnas**.
- **Tarjeta de jugador:**
  - Alto 76, radio 9, borde de 1.5 vp, fondo `#25272C`.
  - Contenido: dorsal en Barlow Condensed 700 a 24 fp blanco, apellido en 11 fp peso 600, y línea «2 FC · 12:34» en 10 fp `#8C8F96`.
  - **Seleccionado para salir** (en pista): fondo `rgba(255,107,107,0.16)` y borde `#FF6B6B`.
  - **Seleccionado para entrar** (banquillo): fondo verde al 22 % y borde `#0A7E3A`.
  - **Eliminado** (5 faltas): la línea pone «ELIMINADO» en `#FF6B6B`. En el banquillo la tarjeta va al 45 % de opacidad y no se puede elegir.
- **Botón «Hecho»:** abajo, alto 52, radio 8, fondo `#E9B949`, texto `#141414` a 14 fp peso 700.

---

## Interactions & Behavior

**Crono**
- Arranca y para con el botón ▶/❚❚ o con la **barra espaciadora** si hay teclado (salvo con el campo de edición abierto).
- Avanza en décimas. Los minutos solo suman a los 5 jugadores en pista. Al llegar a 0 se para.
- **Editar:**
  - Para el crono y muestra el campo con el valor actual (`4:37` o `4:37,5`), seleccionado.
  - Formatos válidos: `m:ss`, `m:ss,d` / `m:ss.d` y segundos `ss` o `ss,d`.
  - **Enter** u OK guarda; **Esc** o Cancelar cancela.
  - Si el formato no vale o supera el máximo del periodo, el borde se pone rojo y no se guarda.
- **Máximos:** 10:00 en los cuartos y 5:00 en las prórrogas.

**Cuarto ‹ ›**
- El rango va de 1 a 8 (4 cuartos y hasta 4 prórrogas).
- Al cambiar: el crono vuelve al máximo y se para, y se cierran el panel y la secuencia encadenada.
- **Al avanzar:**
  - Las faltas de equipo vuelven a 0 en los cuartos 1 a 4.
  - Los tiempos muertos vuelven a 0 al entrar en el 3º y en cada prórroga.
  - Disponibles: **2** en la primera mitad, **3** en la segunda y **1** por prórroga.
- **Canasta de ataque:** se invierte automáticamente al cruzar el descanso (del 2º al 3º, o al volver atrás).

**Posesión y ataque:** toggles. Cambiar el ataque **no cierra el panel**; recalcula ataque o defensa, zona y distancia del punto pendiente.

**Tiempos muertos:** tocar un círculo disponible lo gasta; tocar uno gastado lo devuelve.

**Botones del rival +1/+2/+3**
- Suman al marcador rival, restan +/- a los 5 en pista y quedan en el historial como «RIV».
- **No tocan** el panel ni el punto pendiente.

**Tocar la cancha**
- Solo cuenta si cae **dentro de la pista** (0 ≤ x ≤ 28 y 0 ≤ y ≤ 15). Fuera no hace nada.
- Calcula ataque o defensa según la mitad y el lado de ataque, y la zona y la distancia (ver §Lógica).
- Abre el panel en su estado base. Si ya había una secuencia o un cambio abiertos, los descarta: **tocar de nuevo siempre empieza una acción nueva**.

**Registrar una acción**
- Pulsar un botón del panel crea un evento (ver modelo) y lo **guarda al instante**.
- Después el panel se cierra o pasa a la pregunta encadenada:
  - **Anota** lleva a «¿Asistencia?». Al elegir jugador o «Sin asistencia», se cierra.
  - **Falla** lleva a «¿Rebote ofensivo?». Al elegir RO o «Rebote rival», se cierra. Los rebotes defensivos se apuntan tocando la defensa.
  - **Falta recibida** lleva a «¿Tiros libres?» (1, 2 o 3) y luego a cada TL con Anotado o Fallado.
    - Si se falla el **último**, pasa a «¿Rebote ofensivo?».
    - «Sin tiros libres» cierra.
  - **RO, RD, BP, BR y FC** se registran y cierran.
- La pregunta encadenada es **opcional**: ✕ la cierra y tocar la cancha empieza otra acción.
- El punto pendiente sigue marcado durante toda la secuencia.

**Deshacer (historial)**
- Elimina **ese evento concreto**, aunque no sea el último, y revierte sus efectos: stats del jugador, puntos, +/- de los que estaban en pista **en ese momento**, faltas de equipo y marcador rival.
- **No cierra el panel**, salvo que el evento deshecho sea el que originó la pregunta en pantalla. Por ejemplo, deshacer la canasta mientras se pregunta por la asistencia cierra la pregunta.

**Cambios**
- Se abre con el botón «Cambios» o tocando la cabecera de un jugador, que queda preseleccionado para salir. Cierra el panel de acción.
- Se elige un jugador en pista y otro del banquillo, en cualquier orden; volver a tocar uno lo deselecciona.
- Con los dos elegidos, el cambio se aplica al momento, se guarda en `subLog` (cuarto, crono, sale y entra) y la selección se limpia para encadenar otro cambio.
- «Hecho» o ✕ cierran.

**Qué cierra el panel y qué no**
- **Lo cierran:** cambiar de cuarto, abrir Cambios, ✕ y registrar una acción propia (o pasa al siguiente paso).
- **No lo cierran:** el crono, la posesión, el ataque, los tiempos muertos, los botones del rival y deshacer.

**Teclado:** espacio inicia o para el crono. Enter y Esc funcionan en la edición del crono.

---

## Lógica (para copiar tal cual)

**Zona de un punto** (en metros). `right` indica si el aro de referencia es el derecho.
```
bx    = right ? 26.425 : 1.575
dist  = hypot(x - bx, y - 7.5)
back  = right ? x < 14 : x > 14            // mitad contraria a ese aro
three = back || dist > 6.75 || y < 0.9 || y > 14.1
paint = (right ? x > 22.2 : x < 5.8) && 5.05 < y < 9.95
corner= !back && (y < 0.9 || y > 14.1) && (right ? x > 25.01 : x < 2.99)
zone  = back ? 'Campo propio' : paint ? 'Zona' : corner ? 'Triple esquina' : three ? 'Triple' : 'Media distancia'
```

**Toque**
```
def = attackRight ? x < 14 : x > 14
z   = zoneAt(x, y, def ? !attackRight : attackRight)
if def && z.zone == 'Campo propio' → 'Campo contrario'
```
- **Distancia en el subtítulo:** con 1 decimal y coma decimal, por ejemplo «4,3 m del aro» o «5,1 m de su aro».
- **Tiro desde la mitad de defensa:** se guarda como `three=true`, `zone='Campo propio'`, `def=false`.

**Stats derivadas**
- `PTS = 2·T2m + 3·T3m + TLm`.
- `RT = RO + RD`.
- **VAL** (valoración FIBA simplificada) `= PTS + RO + RD + AS + BR + FR − (T2 fallados + T3 fallados + TL fallados + BP + FC)`.
- **+/-:** cada evento con puntos (`pts − oppPts`) se suma a los 5 que estaban en pista **cuando ocurrió** (`event.court`).
- **Marcador local:** suma de los PTS de todos los jugadores. **Marcador rival:** `oppScore`.
- **Faltas de equipo:** las nuestras suben con FC; las del rival suben con FR.

**Texto y etiqueta de cada evento** (historial)
- **Tiros:** `+2` «Tiro de 2 anotado», `T2` «Tiro de 2 fallado», `+3` «Triple anotado», `T3` «Triple fallado».
- **Tiros libres:** `+1` «Tiro libre anotado», `TL` «Tiro libre fallado».
- **Stats:** `RO` «Rebote ofensivo», `RD` «Rebote defensivo», `AS` «Asistencia», `BR` «Robo», `BP` «Pérdida», `FR` «Falta recibida», `FC` «Falta cometida».
- **Rival:** `+N` «Rival anota», o «Rival · tiro libre» para +1.

## State Management
```ts
interface Player { id: string; num: number; first: string; last: string;
  min: number /*décimas*/; t2m; t2a; t3m; t3a; ftm; fta; ro; rd; as; br; bp; fc; fr; pm: number }
interface Loc { x: number; y: number; zone: string; three: boolean; def: boolean }   // metros, 2 decimales
interface GameEvent { id: number; pid: string | null /*null = rival*/; period: number; clock: number /*décimas restantes*/;
  delta: Partial<Record<StatKey, number>>; pts: number; oppPts: number; foul: boolean; oppFoul: boolean;
  loc: Loc | null; court: string[] /*ids en pista al registrar*/; kind: 'made'|'miss'|'stat'|'opp'; tag: string; text: string }
interface Pending { x; y; def: boolean; three: boolean; dist: number; zone: string }
type Chain =
  | { type: 'ast';   pid; loc; three; srcId }
  | { type: 'reb';   pid; loc; three?; fromShot: boolean; srcId }
  | { type: 'ftAsk'; pid; loc; srcId }
  | { type: 'ft';    pid; loc; n: 1|2|3; i: number; res: boolean[]; srcId }
interface GameState {
  running: boolean; clock: number /*6000 = 10:00*/; period: number /*1-8*/; poss: 'home'|'away';
  attackRight: boolean; players: Player[] /*12*/; court: string[] /*5 ids*/; oppScore: number;
  fouls: { home: number; away: number }; to: { home: number; away: number };
  pending: Pending | null; chain: Chain | null; subs: { out: string|null; inn: string|null } | null;
  subLog: { period; clock; out; inn }[]; events: GameEvent[] /*más reciente primero, máx. 400 en el prototipo*/;
  editing: boolean; editVal: string; editErr: boolean
}
```
- **Estado inicial:** 1er cuarto, 10:00, 0–0, posesión local, atacamos a la derecha, sin eventos, todas las stats a 0.
- **Plantilla de ejemplo:** #3 Álvaro Serrano, #7 Hugo Llorente, #11 Marc Ibáñez, #22 Diego Castells y #41 Iván Otero (titulares); en el banquillo, #5 Pablo Medina, #8 Rubén Cabrera, #13 Adrián Santana, #15 Jorge Quintana, #18 Samuel Déniz, #24 Kevin Suárez y #30 Nauzet Rodríguez.
- **Datos:** el prototipo no tiene backend. En la app, `events` y `subLog` son lo que se guarda; todo lo demás se puede recalcular a partir de ellos.

## Design Tokens
Están todos en **`tokens.json`**. Los principales:
- **Fondos:** app `#161719`, topbar `#0D0E10`, superficie `#1D1F23`, superficie elevada `#25272C`, divisor `#0B0C0D`.
- **Texto:** `#ECEBE8`, `#FFFFFF`, `#D5D6D9`, `#C4C6CA`, `#A4A7AD`, `#8C8F96` y `#6E7178`.
- **Acento** (crono, tiempos muertos, posesión, Hecho/OK): `#E9B949`, con texto encima `#141414`.
- **Anotado:** `#0A7E3A`. **Fallado:** `#B02A2D`. **Peligro y rival:** `#FF6B6B` y `#FF8A80`.
- **Club:** azul `#0A2B85` (franja, zona y escudo).
- **Cancha:** madera `#E0C9AE`, líneas `#F7F5EF`, aro `#CB5A1A`.
- **Radios:** 2, 4, 5, 6, 8, 9, 10 y 12. Los paneles superpuestos y el historial van en **0**.
- **Tipografía:** Barlow (UI) y Barlow Condensed (números y títulos). Tamaños usados: 8, 9, 10, 10.5, 11, 12, 13, 13.5, 14, 15, 16, 17, 19, 22, 23, 24, 26, 30, 34, 40 (más el marcador fluido de 36 a 64) y 52.
- **Sin sombras.** La separación entre bloques se hace con líneas de 1 vp y cambios de tono.

## Iconos
Todos son SVG en línea, sin librería:
- play y pausa;
- triángulos de posesión y ataque;
- deshacer y cambios ⇄ (estilo Lucide: trazo 2, extremos redondeados);
- glifos de texto ‹ › ✎ ✕.

Los paths están en las secciones de cada pantalla.

## Assets
- `assets/cbtelde.png`: escudo del CB Telde, que proporcionó el cliente. Va en la caja blanca de la topbar y sobre el círculo central blanco de la cancha.
- **Escudo de CB Gran Canaria:** en el prototipo se carga desde la web oficial (URL en §1c). En producción conviene guardarlo como recurso local y tener una alternativa con texto.
- **Fuentes:** Barlow y Barlow Condensed (Google Fonts, licencia OFL).

## Files
- `prototype/Live Game - Tablet Horizontal.dc.html`: el prototipo completo, con todo el marcado y la lógica (en el script final). Se abre en el navegador junto a `support.js`.
- `prototype/support.js`: lo necesario para que el prototipo funcione en el navegador; no hay que portarlo.
- `court.svg`: geometría FIBA de la cancha en metros, con capas, colores y rótulos de ejemplo. Sirve de referencia para Canvas o Path en ArkUI.
- `tokens.json`: colores, fuentes, radios y medidas de layout.
- `assets/cbtelde.png`: escudo del club.
