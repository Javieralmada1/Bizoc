// /lib/supabaseServer.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Exporta una función nombrada que crea el cliente de Supabase para Server Components/Actions.
export function createServerClient() {
  // Este cliente usa las cookies para la autenticación RLS.
  const supabase = createRouteHandlerClient({ cookies })
  return { supabase }
}