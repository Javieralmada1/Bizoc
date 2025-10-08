// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error(
    'Faltan envs de Supabase. Revisa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local'
  )
}

/**
 * Cliente de servidor con service role.
 * Usar SOLO en rutas de API / acciones de servidor.
 */
const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
})

export default supabaseAdmin
