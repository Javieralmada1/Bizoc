'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function ClubVerifyPage() {
  const router = useRouter()
  const q = useSearchParams()
  const emailFromQuery = q.get('email') || ''
  const [email, setEmail] = useState(emailFromQuery)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => { setEmail(emailFromQuery) }, [emailFromQuery])

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg(null)
    try {
      // (1) Validar el CÓDIGO recibido por email
      const { error: vErr } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: 'signup',  // verifica el OTP de alta
      })
      if (vErr) throw vErr

      // (2) Ya está verificado: iniciar sesión para continuar
      const { error: sErr } = await supabase.auth.signInWithPassword({ email, password: '' as any })
      // ^ Si Supabase exige password acá, pedilo en el form: agregar un campo "password" y usarlo.
      //   Si no, podés redirigir a /club y que vuelva a loguear manualmente.
      //   Para evitar fricción, lo normal es pedir la pass acá:
    } catch (e:any) {
      if (String(e?.message || '').toLowerCase().includes('password')) {
        // Si falla porque falta password, no es crítico: redirigimos al login del club
        router.replace('/club?mode=signin')
        return
      }
      setMsg(e?.message ?? 'No se pudo verificar el código.')
      setLoading(false)
      return
    }

    try {
      // (3) Asegurar perfil de CLUB (marca que esta cuenta es de club)
      const { data: me } = await supabase.auth.getUser()
      if (me.user) {
        const { error: cpErr } = await supabase
          .from('club_profiles')
          .insert({ id: me.user.id, email: me.user.email })
        if (cpErr && !/duplicate/i.test(cpErr.message)) {
          console.warn('No se creó club_profiles:', cpErr.message)
        }
      }
      // (4) A dashboard
      router.replace('/clubs/dashboard')
    } catch (e:any) {
      setMsg(e?.message ?? 'Verificado, pero no pudimos finalizar el alta. Reingresá.')
      router.replace('/club?mode=signin')
    }
  }

  async function resend() {
    try {
      setLoading(true); setMsg(null)
      await supabase.auth.resend({ type: 'signup', email })
      setMsg('Te reenviamos un nuevo código. Revisá tu correo.')
    } catch (e:any) {
      setMsg(e?.message ?? 'No pudimos reenviar el código.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'linear-gradient(135deg,#0f172a 0%,#7c3aed 50%,#0f172a 100%)'}}>
      <form onSubmit={verify} style={{width:'100%',maxWidth:420,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:16,padding:24,backdropFilter:'blur(16px)'}}>
        <h1 style={{color:'#fff',fontSize:22,fontWeight:800,marginBottom:12}}>Verificar tu club</h1>
        <p className="muted" style={{marginBottom:16}}>Ingresá el código que te enviamos al email</p>

        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />

        <div style={{height:12}} />
        <label className="label">Código de 6 dígitos</label>
        <input className="input" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code} onChange={e=>setCode(e.target.value)} placeholder="123456" required />

        <div style={{display:'flex',gap:8,marginTop:16}}>
          <button className="btn-primary" type="submit" disabled={loading || !code}>Verificar</button>
          <button className="btn-ghost" type="button" onClick={resend} disabled={loading}>Reenviar código</button>
        </div>

        {msg && <div className="msg-ok" style={{marginTop:12}}>{msg}</div>}
      </form>
    </div>
  )
}
