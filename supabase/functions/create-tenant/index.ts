import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { record: user } = await req.json()

    // Extrair metadados do usuário
    const { full_name, tenant_name } = user.user_metadata
    
    if (!full_name || !tenant_name) {
      throw new Error('Missing user metadata: full_name or tenant_name')
    }
    
    // Conectar ao Supabase com privilégios de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Criar o tenant (barbearia)
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({ name: tenant_name })
      .select()
      .single()

    if (tenantError) throw tenantError
    if (!tenant) throw new Error('Failed to create tenant.')

    // 2. Criar o perfil do usuário, vinculando-o ao tenant
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        full_name: full_name,
        tenant_id: tenant.id,
      })

    if (profileError) throw profileError

    return new Response(
      JSON.stringify({ message: `Tenant ${tenant.id} and profile for user ${user.id} created.` }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
