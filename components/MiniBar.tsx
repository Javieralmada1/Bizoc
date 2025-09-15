// components/MiniBar.tsx
'use client'
export default function MiniBar({ data }: { data: number[] }) {
  // data: 7 números (por ej. partidos por día)
  const w = 280, h = 60, pad = 8
  const max = Math.max(1, ...data)
  const bw = (w - pad * 2) / data.length
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Partidos últimos días">
      <rect x="0" y="0" width={w} height={h} fill="transparent" />
      {data.map((v, i) => {
        const bh = (v / max) * (h - pad * 2)
        return (
          <rect key={i}
            x={pad + i * bw + 3}
            y={h - pad - bh}
            width={bw - 6}
            height={bh}
            rx="4"
            fill="url(#g)" />
        )
      })}
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed"/>
          <stop offset="100%" stopColor="#3b82f6"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
