import { createClient } from '@supabase/supabase-js'

// Este cliente usa la clave de Service Role (secreta) para acceso elevado
// en el backend (Server-Side).

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default supabaseAdmin