import { useRef } from 'react'
import { asset } from '../asset'
import type { GameApi } from '../game/useGame'

export function Court({ game }: { game: GameApi }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { vm, courtTap } = game
  const mark = vm.mark

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const m = pt.matrixTransform(ctm.inverse())
    courtTap(m.x, m.y)
  }

  return (
    <div className="court-wrap">
      <svg
        ref={svgRef}
        className="court"
        viewBox="-2.4 -2.4 32.8 19.8"
        preserveAspectRatio="xMidYMid meet"
        onClick={onClick}
      >
        <defs>
          <filter id="lgStreak" x="-40" y="-40" width="108" height="95" filterUnits="userSpaceOnUse">
            <feTurbulence type="fractalNoise" baseFrequency="0.05 2.4" numOctaves="3" seed="5" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.33  0 0 0 0 0.14  2.2 0 0 0 -0.95" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <filter id="lgStreakLight" x="-40" y="-40" width="108" height="95" filterUnits="userSpaceOnUse">
            <feTurbulence type="fractalNoise" baseFrequency="0.07 3.1" numOctaves="3" seed="19" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.97  0 0 0 0 0.9  2.2 0 0 0 -1.0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <filter id="lgGrain" x="-40" y="-40" width="108" height="95" filterUnits="userSpaceOnUse">
            <feTurbulence type="fractalNoise" baseFrequency="0.4 26" numOctaves="3" seed="7" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.25  0 0 0 0 0.10  1.6 0 0 0 -0.62" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <radialGradient id="lgGloss" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.26" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lgVarnish" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.10" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#5a3410" stopOpacity="0.06" />
          </linearGradient>
          <radialGradient id="lgSheen" cx="50%" cy="45%" r="65%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.10" />
            <stop offset="1" stopColor="#3a2410" stopOpacity="0.16" />
          </radialGradient>
        </defs>
        <g style={{ pointerEvents: 'none' }}>
          <rect x="-40" y="-40" width="108" height="95" fill="hsl(32 44% 78%)" />
          <rect x="-40" y="-40" width="108" height="95" filter="url(#lgStreak)" opacity="0.24" />
          <rect x="-40" y="-40" width="108" height="95" filter="url(#lgStreakLight)" opacity="0.26" />
          <rect x="-40" y="-40" width="108" height="95" filter="url(#lgGrain)" opacity="0.12" />
          <rect x="-1.2" y="-1.2" width="30.4" height="17.4" fill="#0A2B85" />
          <rect x="0" y="0" width="28" height="15" fill="hsl(32 44% 78%)" />
          <rect x="0" y="0" width="28" height="15" filter="url(#lgStreak)" opacity="0.24" />
          <rect x="0" y="0" width="28" height="15" filter="url(#lgStreakLight)" opacity="0.26" />
          <rect x="0" y="0" width="28" height="15" filter="url(#lgGrain)" opacity="0.12" />
        </g>
        <g fill="#0A2B85" opacity="0.9" style={{ pointerEvents: 'none' }}>
          <rect x="0" y="5.05" width="5.8" height="4.9" />
          <rect x="22.2" y="5.05" width="5.8" height="4.9" />
        </g>
        <g style={{ pointerEvents: 'none' }}>
          <circle cx="14" cy="7.5" r="1.8" fill="#ffffff" />
          <image
            href={asset('cbtelde.png')}
            x="12.38"
            y="5.88"
            width="3.24"
            height="3.24"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
        <rect x="0" y="0" width="28" height="15" fill="url(#lgSheen)" style={{ pointerEvents: 'none' }} />
        <g style={{ pointerEvents: 'none', mixBlendMode: 'screen' }}>
          <rect x="0" y="0" width="28" height="15" fill="url(#lgVarnish)" />
          <ellipse cx="7" cy="3.6" rx="5.5" ry="2.2" fill="url(#lgGloss)" />
          <ellipse cx="21" cy="3.6" rx="5.5" ry="2.2" fill="url(#lgGloss)" />
          <ellipse cx="7" cy="11.4" rx="5.5" ry="2.2" fill="url(#lgGloss)" opacity="0.6" />
          <ellipse cx="21" cy="11.4" rx="5.5" ry="2.2" fill="url(#lgGloss)" opacity="0.6" />
          <ellipse cx="14" cy="7.5" rx="3.5" ry="1.6" fill="url(#lgGloss)" opacity="0.7" />
        </g>
        <g fill="none" stroke="#F7F5EF" strokeWidth="0.05" strokeLinecap="butt">
          <rect x="0" y="0" width="28" height="15" />
          <line x1="14" y1="0" x2="14" y2="15" />
          <rect x="0" y="5.05" width="5.8" height="4.9" />
          <rect x="22.2" y="5.05" width="5.8" height="4.9" />
          <path d="M5.8 5.7 A1.8 1.8 0 0 1 5.8 9.3" />
          <path d="M5.8 5.7 A1.8 1.8 0 0 0 5.8 9.3" strokeDasharray="0.3 0.24" />
          <path d="M22.2 5.7 A1.8 1.8 0 0 0 22.2 9.3" />
          <path d="M22.2 5.7 A1.8 1.8 0 0 1 22.2 9.3" strokeDasharray="0.3 0.24" />
          <path d="M0 0.9 L2.99 0.9 A6.75 6.75 0 0 1 2.99 14.1 L0 14.1" />
          <path d="M28 0.9 L25.01 0.9 A6.75 6.75 0 0 0 25.01 14.1 L28 14.1" />
          <path d="M1.2 6.25 L1.575 6.25 A1.25 1.25 0 0 1 1.575 8.75 L1.2 8.75" />
          <path d="M26.8 6.25 L26.425 6.25 A1.25 1.25 0 0 0 26.425 8.75 L26.8 8.75" />
          <line x1="8.325" y1="-0.15" x2="8.325" y2="0" />
          <line x1="19.675" y1="-0.15" x2="19.675" y2="0" />
        </g>
        <g stroke="#F7F5EF" strokeWidth="0.07">
          <line x1="1.2" y1="6.6" x2="1.2" y2="8.4" />
          <line x1="26.8" y1="6.6" x2="26.8" y2="8.4" />
        </g>
        <g fill="none" stroke="#CB5A1A" strokeWidth="0.05">
          <line x1="1.2" y1="7.5" x2="1.35" y2="7.5" />
          <circle cx="1.575" cy="7.5" r="0.225" />
          <line x1="26.8" y1="7.5" x2="26.65" y2="7.5" />
          <circle cx="26.425" cy="7.5" r="0.225" />
        </g>
        <g
          fontFamily="Barlow Condensed, sans-serif"
          fontWeight="700"
          fontSize="0.62"
          letterSpacing="0.12"
          style={{ pointerEvents: 'none' }}
        >
          <text x={vm.atkLabelX} y="-0.38" textAnchor={vm.atkAnchor} fill="#FFFFFF">
            ATAQUE
          </text>
          {vm.AR ? (
            <text x="26.8" y="-0.36" textAnchor="start" fill="#FFFFFF" fontSize="0.75">
              ›
            </text>
          ) : (
            <text x="1.2" y="-0.36" textAnchor="end" fill="#FFFFFF" fontSize="0.75">
              ‹
            </text>
          )}
          <text x={vm.defLabelX} y="-0.38" textAnchor={vm.defAnchor} fill="rgba(255,255,255,0.6)">
            DEFENSA
          </text>
        </g>
        <rect x={vm.dimX} y="-40" width="54" height="95" fill="rgba(40,24,8,0.08)" style={{ pointerEvents: 'none' }} />
        {mark ? (
          <>
            <circle
              cx={mark.x}
              cy={mark.y}
              r="0.5"
              fill="rgba(10,43,133,0.22)"
              stroke="#0A2B85"
              strokeWidth="0.08"
              style={{ pointerEvents: 'none' }}
            />
            <circle cx={mark.x} cy={mark.y} r="0.12" fill="#0A2B85" style={{ pointerEvents: 'none' }} />
          </>
        ) : null}
      </svg>
    </div>
  )
}
