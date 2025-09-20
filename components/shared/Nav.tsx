'use client'
import Link from 'next/link'

export default function Nav() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <nav
        className="
          mx-auto mt-3 max-w-5xl px-4 py-2
          rounded-2xl backdrop-blur-md
          bg-black/30 border border-white/10
          flex items-center justify-between
        "
      >
        {/* Branding */}
        <div className="flex items-center gap-2">
          <Link href="/" className="brand">
            Beelup<span className="brand-dot">•</span>lite
          </Link>
        </div>

        {/* Si querés centrar el logo, cambiá justify-between por justify-center arriba
            y borrá este div vacío */}
        <div />
      </nav>
    </div>
  )
}
