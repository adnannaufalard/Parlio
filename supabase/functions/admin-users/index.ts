// Setup type definitions for Supabase Functions runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '*'
  const headers = new Headers({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    // include 'apikey' so client can send it
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    'Access-Control-Allow-Credentials': 'true',
    // expose common response headers to browser
    'Access-Control-Expose-Headers': 'Content-Type, Authorization, apikey'
  })
  return headers
}

function jsonResponse(body: any, status = 200, req?: Request) {
  const headers = req ? corsHeaders(req) : new Headers()
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(body), { status, headers })
}

Deno.serve(async (req) => {
  try {
    const method = req.method.toUpperCase()

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(req) })
    }

    // Read body once and log for debugging
    let body: any = {}
    try {
      body = await req.json()
    } catch (e) {
      body = {}
    }
    console.log('admin-users called:', method, JSON.stringify(body))

    if (method === 'POST') {
      // Create user
      const { email, password, full_name, role } = body
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role }
      })

      console.log('createUser result:', JSON.stringify({ data, error }))
      if (error) return jsonResponse({ error: error.message || error }, 400, req)

      // Guard: ensure created user exists
      if (!data || !data.user || !data.user.id) {
        console.error('createUser produced no user:', JSON.stringify(data))
        return jsonResponse({ error: 'Failed to create user' }, 500, req)
      }

      // Insert into profiles - use upsert to avoid duplicate-key when a DB trigger
      // already created the profile (handle_new_user). Upsert will insert or update.
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({ id: data.user.id, full_name, email, role }, { onConflict: 'id' })

      console.log('profiles upsert result:', JSON.stringify({ profileData, profileError }))

      if (profileError) {
        return jsonResponse({ error: profileError.message || profileError }, 500, req)
      }

      return jsonResponse({ user: data.user, profile: profileData }, 200, req)
    }

    if (method === 'PUT') {
      // Update profile
      const { id, full_name, email, role } = body
      const { data: updateData, error } = await supabaseAdmin
        .from('profiles')
        .update({ full_name, email, role })
        .eq('id', id)

      console.log('profiles update result:', JSON.stringify({ updateData, error }))
      if (error) return jsonResponse({ error: error.message || error }, 400, req)
      return jsonResponse({ ok: true, updated: updateData }, 200, req)
    }

    if (method === 'DELETE') {
      const { id } = body
      // Delete profile row
      const { data: delProfile, error: pErr } = await supabaseAdmin.from('profiles').delete().eq('id', id)
      console.log('profiles delete result:', JSON.stringify({ delProfile, pErr }))
      if (pErr) return jsonResponse({ error: pErr.message || pErr }, 400, req)
      // Delete auth user
      const { data: delAuth, error: aErr } = await supabaseAdmin.auth.admin.deleteUser(id)
      console.log('deleteUser result:', JSON.stringify({ delAuth, aErr }))
      if (aErr) return jsonResponse({ error: aErr.message || aErr }, 400, req)
      return jsonResponse({ ok: true }, 200, req)
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, req)
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: (err as any).message || String(err) }, 500, req)
  }
})
