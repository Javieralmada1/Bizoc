'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Mode = 'signin' | 'signup'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // Campos de club (solo en signup)
  const [clubName, setClubName] = useState('')
  const [clubProvince, setClubProvince] = useState('')
  const [clubCity, setClubCity] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/dashboard')
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
        router.push('/dashboard')
      } else {
        // 1) sign up
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        // 2) sign in (para tener sesión activa)
        const { error: sErr } = await supabase.auth.signInWithPassword({ email, password })
        if (sErr) {
          setMsg('Cuenta creada. Revisa tu correo si pide verificación.')
          return
        }

        // 3) si completaron datos de club, creamos el club
        if (clubName.trim()) {
          const ins = await supabase.from('clubs').insert({
            name: clubName.trim(),
            province: clubProvince.trim() || null,
            city: clubCity.trim() || null,
          })
          if (ins.error) {
            // no bloquea el login; solo informamos
            console.warn('No se pudo crear el club al registrarse:', ins.error.message)
            setMsg(`Cuenta creada. No se pudo crear el club: ${ins.error.message}`)
          }
        }

        router.push('/dashboard')
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
      setLoading(true)
      setMsg(null)
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/login` })
      setMsg('Te enviamos un correo para resetear tu contraseña.')
    } catch (err: any) {
      setMsg(err?.message ?? 'No pudimos enviar el correo.')
    } finally {
      setLoading(false)
    }
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
                placeholder="tu@ejemplo.com"
                style={{ width:'100%', padding:'14px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
            </div>

            <div style={{ marginBottom: mode==='signup' ? 8 : 24 }}>
              <label style={{ display:'block', color:'#e5e7eb', marginBottom:8 }}>Contraseña</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width:'100%', padding:'14px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
            </div>

            {/* Campos extra: datos de club (solo en signup) */}
            {mode==='signup' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom:10, color:'#9ca3af', fontSize:14 }}>Datos del club (opcional, se puede editar luego)</div>
                <div style={{ display:'grid', gap:10 }}>
                  <input className="input" placeholder="Nombre del club" value={clubName} onChange={e=>setClubName(e.target.value)}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
                  <input className="input" placeholder="Provincia" value={clubProvince} onChange={e=>setClubProvince(e.target.value)}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
                  <input className="input" placeholder="Ciudad" value={clubCity} onChange={e=>setClubCity(e.target.value)}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width:'100%', padding:16, borderRadius:12, border:'none',
                background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #9333ea)',
                color:'white', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer'
              }}>
              {mode==='signin' ? (loading ? 'Entrando...' : 'Entrar') : (loading ? 'Creando...' : 'Registrarme')}
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
        </div>
      </div>
    </div>
  )
}
