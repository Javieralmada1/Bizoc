// Server Component – estética + logo
import supabaseAdmin from '@/lib/supabaseAdmin'

type Stat = { label:string; value:string; hint?:string }

function KPI({ label, value, hint }: Stat) {
  return (
    <div className="bz-card pad bz-kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  )
}

function ActionCard({ title, desc, href }:{ title:string; desc:string; href:string }) {
  return (
    <a href={href} className="bz-card pad hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold">{title}</div>
          <div className="mt-1 text-[13px] text-[var(--muted)]">{desc}</div>
          <span className="mt-3 inline-flex text-[13px] font-semibold text-[var(--accent-600)]">Abrir →</span>
        </div>
        <span className="bz-pill bz-pill--accent">Acción</span>
      </div>
    </a>
  )
}

export default async function DashboardHome() {
  // 1) Datos básicos (igual que antes)
  const [{ data: courts }, { data: tournaments }] = await Promise.all([
    supabaseAdmin.from('courts').select('id'),
    supabaseAdmin.from('tournaments').select('id').eq('status','active'),
  ]).catch(()=>[{data:[]},{data:[]}] as const)

  // 2) Logo del club (no tocamos tu auth; obtenemos un club "activo" cualquiera)
  const { data: clubRow } = await supabaseAdmin
    .from('clubs')
    .select('id, name, logo_url, avatar_url, image_url')
    .limit(1)
    .maybeSingle()

  const clubName = clubRow?.name ?? 'Club de prueba'
  const logo =
    (clubRow?.logo_url as string) ||
    (clubRow?.avatar_url as string) ||
    (clubRow?.image_url as string) ||
    '/logo.svg' // fallback si no hay logo

  const stats: Stat[] = [
    { label:'Canchas totales', value:String(courts?.length ?? 0), hint:'0 activas' },
    { label:'Reservas hoy', value:'0', hint:'Programadas' },
    { label:'Ingresos mes', value:'$0', hint:'Período actual' },
    { label:'Torneos activos', value:String(tournaments?.length ?? 0), hint:'En progreso' },
  ]

  const steps = ['Agrega tus canchas','Configura los horarios','Conecta las cámaras','Recibe reservas']

  return (
    <div className="space-y-6">
      {/* Hero con logo visible y botón verde */}
      <section className="bz-surface bz-surface--soft px-6 py-5">
        <div className="bz-hero">
          <div className="bz-hero-left">
            <div
              className="bz-hero-logo"
              style={{ backgroundImage: `url(${logo})` }}
              aria-label="Logo del club"
              title={clubName}
            />
            <div>
              <div className="bz-sub">Panel</div>
              <h1 className="text-3xl font-extrabold tracking-tight">{clubName}</h1>
            </div>
          </div>
          <a href="/clubs/dashboard/settings" className="bz-btn bz-btn--primary">Personalizar</a>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(s => <KPI key={s.label} {...s} />)}
      </section>

      {/* Acciones */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ActionCard title="Gestionar canchas" desc="Agregar, editar y configurar tus canchas." href="/clubs/dashboard/courts" />
        <ActionCard title="Ver reservas" desc="Gestiona las reservas de tus canchas." href="/clubs/dashboard/reservations" />
        <ActionCard title="Sistema de cámaras" desc="Graba y asocia videos a los partidos." href="/clubs/dashboard/cameras" />
        <ActionCard title="Configurar horarios" desc="Define disponibilidad por cancha con semana tipo." href="/clubs/dashboard/schedules" />
      </section>

      {/* Checklist */}
      <section className="bz-surface p-5">
        <div className="mb-3 text-[15px] font-semibold">Primeros pasos</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((t,i)=>(
            <div key={t} className="bz-card px-3 py-2 flex items-center gap-3">
              <span className="bz-pill bz-pill--accent">{i+1}</span>
              <span className="text-[13px]">{t}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
