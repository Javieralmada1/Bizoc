'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function PlayerAuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // Campos de jugador (solo en signup)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('7ª')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        // Verificar si es jugador o club
        const { data: playerProfile } = await supabase
          .from('player_profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()
        
        if (playerProfile) {
          // Es jugador, redirigir al dashboard de jugador
          router.replace('/player/dashboard')
        } else {
          // No es jugador, pueden loguearse aquí
          // No hacer nada, dejar que use el formulario
        }
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
        
        // Verificar si es jugador
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: playerProfile } = await supabase
            .from('player_profiles')
            .select('id')
            .eq('id', user.id)
            .single()
          
          if (playerProfile) {
            router.push('/player/dashboard')
          } else {
            setMsg('Esta cuenta no es de jugador. ¿Eres un club? Ve a "Administrar Club".')
            await supabase.auth.signOut()
          }
        }
      } else {
        // Validaciones para signup
        if (!firstName.trim() || !lastName.trim()) {
          setMsg('Nombre y apellido son obligatorios')
          return
        }

        // 1) sign up
        const { error, data } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        // 2) sign in (para tener sesión activa)
        const { error: sErr } = await supabase.auth.signInWithPassword({ email, password })
        if (sErr) {
          setMsg('Cuenta creada. Revisa tu correo si pide verificación.')
          return
        }

        // 3) crear perfil de jugador
        if (data.user) {
          const profileData = {
            id: data.user.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim() || null,
            province: province.trim() || null,
            city: city.trim() || null,
            category: category
          }

          const { error: profileError } = await supabase
            .from('player_profiles')
            .insert(profileData)

          if (profileError) {
            console.warn('No se pudo crear el perfil:', profileError.message)
            setMsg(`Cuenta creada pero hubo un problema con el perfil: ${profileError.message}`)
            return
          }
        }

        router.push('/player/dashboard')
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
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/player` })
      setMsg('Te enviamos un correo para resetear tu contraseña.')
    } catch (err: any) {
      setMsg(err?.message ?? 'No pudimos enviar el correo.')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['1ª', '2ª', '3ª', '4ª', '5ª', '6ª', '7ª']

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #16a085 50%, #0f172a 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:500, padding:16 }}>
        <div style={{
          background:'rgba(255,255,255,0.08)', backdropFilter:'blur(20px)',
          border:'1px solid rgba(255,255,255,0.12)', borderRadius:24, padding:40,
          boxShadow:'0 25px 50px -12px rgba(0,0,0,0.4)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 60, height: 60, background: 'linear-gradient(135deg, #16a085, #10b981)',
              borderRadius: 16, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              🏸
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>
              Portal de Jugadores
            </h1>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>
              Tu perfil de pádel personalizado
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
                placeholder="tu@email.com"
                style={{ width:'100%', padding:'14px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
            </div>

            <div style={{ marginBottom: mode==='signup' ? 16 : 24 }}>
              <label style={{ display:'block', color:'#e5e7eb', marginBottom:8 }}>Contraseña</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width:'100%', padding:'14px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
            </div>

            {/* Campos extra: datos de jugador (solo en signup) */}
            {mode==='signup' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom:16, color:'#9ca3af', fontSize:14 }}>Datos personales</div>
                <div style={{ display:'grid', gap:12, gridTemplateColumns: '1fr 1fr' }}>
                  <input placeholder="Nombre *" value={firstName} onChange={e=>setFirstName(e.target.value)}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
                  <input placeholder="Apellido *" value={lastName} onChange={e=>setLastName(e.target.value)}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
                </div>
                <div style={{ display:'grid', gap:12, gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
                  <input placeholder="Teléfono" value={phone} onChange={e=>setPhone(e.target.value)}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
                  <select value={category} onChange={e=>setCategory(e.target.value)}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }}>
                    {categories.map(cat => <option key={cat} value={cat} style={{background:'#1f2937'}}>Categoría {cat}</option>)}
                  </select>
                </div>
                <div style={{ display:'grid', gap:12, gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
                  <input placeholder="Provincia" value={province} onChange={e=>setProvince(e.target.value)}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
                  <input placeholder="Ciudad" value={city} onChange={e=>setCity(e.target.value)}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white' }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width:'100%', padding:16, borderRadius:12, border:'none',
                background: loading ? 'rgba(22,160,133,0.5)' : 'linear-gradient(135deg, #16a085, #10b981)',
                color:'white', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer'
              }}>
              {mode==='signin' ? (loading ? 'Entrando...' : 'Acceder a mi Dashboard') : (loading ? 'Creando...' : 'Crear mi Perfil')}
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

          {/* Back to home */}
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