'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function ClubAuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // Campos de club (solo en signup)
  const [clubName, setClubName] = useState('')
  const [clubProvince, setClubProvince] = useState('')
  const [clubCity, setClubCity] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        // si ya es club => dashboard, si no => que inicie por /player
        const { data: clubProfile } = await supabase
          .from('club_profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()
        if (clubProfile) router.replace('/clubs/dashboard')
      }
    })
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        // en vez de consultar club_profiles desde el cliente, llamamos a la API server-side
        const resp = await fetch('/api/auth/is-club', { cache: 'no-store' })
        const json = await resp.json()
        if (!json.ok) {
          setMsg('Esta cuenta no es de club. Si sos jugador, entrá por /player.')
          await supabase.auth.signOut()
          return
        }
        router.push('/clubs/dashboard')
      } else {
        // SIGNUP: crear cuenta, enviar OTP y mandar a /club/verify
        const { error: signUpErr } = await supabase.auth.signUp({ email, password })
        if (signUpErr) throw signUpErr

        await supabase.auth.signOut()
        await supabase.auth.resend({ type: 'signup', email })
        router.push(`/club/verify?email=${encodeURIComponent(email)}&name=${encodeURIComponent(clubName)}&province=${encodeURIComponent(clubProvince)}&city=${encodeURIComponent(clubCity)}`)
      }
    } catch (err: any) {
      setMsg(err?.message ?? 'Error al autenticar')
    } finally {
      setLoading(false)
    }
  }

  async function onReset() {
    if (!email) return setMsg('Escribe tu email arriba y toca "Recuperar".')
    try {
      setLoading(true); setMsg(null)
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/club` })
      setMsg('Te enviamos un correo para resetear tu contraseña.')
    } catch (err: any) {
      setMsg(err?.message ?? 'No pudimos enviar el correo.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #7c3aed 50%, #0f172a 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:460, padding:16 }}>
        <div style={{
          background:'rgba(255,255,255,0.08)', backdropFilter:'blur(20px)',
          border:'1px solid rgba(255,255,255,0.12)', borderRadius:24, padding:40,
          boxShadow:'0 25px 50px -12px rgba(0,0,0,0.4)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 60, height: 60, background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              borderRadius: 16, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              🏢
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>
              Portal de Clubes
            </h1>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>
              Administra tu club de pádel
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            background:'rgba(255,255,255,0.05)', borderRadius:16, padding:6,
            display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:24
          }}>
            <button onClick={()=>{setMode('signin'); setMsg(null)}}
              style={{
                padding:'12px 16px', borderRadius:12, border:'none',
                background: mode==='signin'?'rgba(255,255,255,0.15)':'transparent',
                color: mode==='signin'?'white':'#9ca3af', fontWeight:600, cursor:'pointer'
              }}>
              Iniciar sesión
            </button>
            <button onClick={()=>{setMode('signup'); setMsg(null)}}
              style={{
                padding:'12px 16px', borderRadius:12, border:'none',
                background: mode==='signup'?'rgba(255,255,255,0.15)':'transparent',
                color: mode==='signup'?'white':'#9ca3af', fontWeight:600, cursor:'pointer'
              }}>
              Crear cuenta
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', color:'#e5e7eb', marginBottom:8 }}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                placeholder="admin@miclub.com"
                style={{ width:'100%', padding:'14px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
            </div>

            <div style={{ marginBottom: mode==='signup' ? 8 : 24 }}>
              <label style={{ display:'block', color:'#e5e7eb', marginBottom:8 }}>Contraseña</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width:'100%', padding:'14px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
            </div>

            {/* Datos de club opcionales en signup */}
            {mode==='signup' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom:10, color:'#9ca3af', fontSize:14 }}>Información del Club</div>
                <div style={{ display:'grid', gap:10 }}>
                  <input placeholder="Nombre del club *" value={clubName} onChange={e=>setClubName(e.target.value)}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
                  <input placeholder="Provincia" value={clubProvince} onChange={e=>setClubProvince(e.target.value)}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
                  <input placeholder="Ciudad" value={clubCity} onChange={e=>setClubCity(e.target.value)}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width:'100%', padding:16, borderRadius:12, border:'none',
                background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed, #9333ea)',
                color:'white', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer'
              }}>
              {mode==='signin' ? (loading ? 'Entrando...' : 'Acceder al Dashboard') : (loading ? 'Creando...' : 'Registrar Club')}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:16 }}>
            <button onClick={onReset} style={{ background:'none', border:'none', color:'#9ca3af', textDecoration:'underline', cursor:'pointer' }}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {msg && (
            <div style={{
              marginTop:16, padding:'10px 12px', borderRadius:12,
              background: msg.toLowerCase().includes('error') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
              border: `1px solid ${msg.toLowerCase().includes('error') ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
              color: msg.toLowerCase().includes('error') ? '#fca5a5' : '#86efac', fontSize:14, textAlign:'center'
            }}>
              {msg}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <a href="/" style={{ color: '#9ca3af', fontSize: 14, textDecoration: 'none' }}>
              ← Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}