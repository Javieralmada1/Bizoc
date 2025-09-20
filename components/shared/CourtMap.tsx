// components/CourtMap.tsx
'use client'
import { useMemo } from 'react'

type Cam = { id: string; name: string; x: number; y: number }
export default function CourtMap({
  width = 420,
  height = 240,
  cameras = [],
  editable = false,
  onChange,
}: {
  width?: number
  height?: number
  cameras: Cam[]
  editable?: boolean
  onChange?: (cams: Cam[]) => void
}) {
  // Constrain 0..100
  const clamp = (n: number) => Math.min(100, Math.max(0, n))

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!editable || !onChange || cameras.length === 0) return
    const rect = (e.target as SVGElement).closest('svg')!.getBoundingClientRect()
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100)
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100)
    // Mueve la primera cámara; podés mejorar con selección
    const next = [...cameras]
    next[0] = { ...next[0], x, y }
    onChange(next)
  }

  const camNodes = useMemo(() => (
    cameras.map((c) => {
      const cx = (c.x / 100) * width
      const cy = (c.y / 100) * height
      return (
        <g key={c.id} transform={`translate(${cx},${cy})`}>
          <circle r="8" fill="#10b981" stroke="#052e2b" strokeWidth="2" />
          <text x="10" y="4" fontSize="12" fill="#fff">{c.name}</text>
        </g>
      )
    })
  ), [cameras, width, height])

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onClick={handleClick}
      style={{ borderRadius: 12, background: '#0b1220', cursor: editable ? 'crosshair' : 'default' }}
    >
      {/* “Cancha” */}
      <rect x="12" y="12" width={width-24} height={height-24}
            rx="12" fill="#0f172a" stroke="rgba(255,255,255,0.1)" />
      {/* Líneas */}
      <line x1={width/2} y1={12} x2={width/2} y2={height-12} stroke="rgba(255,255,255,0.15)" />
      <rect x={width/2-60} y={height/2-40} width="120" height="80" rx="10"
            stroke="rgba(255,255,255,0.15)" fill="transparent" />
      {/* Cámaras */}
      {camNodes}
    </svg>
  )
}
