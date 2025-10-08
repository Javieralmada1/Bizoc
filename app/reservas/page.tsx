// app/reservas/page.tsx
'use client'
import dynamic from 'next/dynamic'

const ReservationSystemImproved = dynamic(
  () => import('@/components/clubs/ReservationSystemImproved'),
  { ssr: false }
)

export default function ReservasPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Reservar una cancha</h2>
      <ReservationSystemImproved />
    </section>
  )
}
