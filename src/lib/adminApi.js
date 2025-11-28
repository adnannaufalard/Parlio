import { supabase } from './supabaseClient'

const ADMIN_FUNCTION_URL = import.meta.env.VITE_ADMIN_FUNCTION_URL || ''

async function callApi(method, body) {
  // get current session access token
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token

  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (apikey) headers['apikey'] = apikey

  const res = await fetch(ADMIN_FUNCTION_URL, {
    method,
    headers,
    body: JSON.stringify(body),
  })

  const text = await res.text()
  let json
  try { json = text ? JSON.parse(text) : null } catch { json = { message: text } }

  if (!res.ok) {
    const errMsg = json?.error || json?.message || res.statusText || 'Request failed'
    throw new Error(errMsg)
  }

  return json
}

async function createUser({ full_name, email, password, role }) {
  return callApi('POST', { full_name, email, password, role })
}

async function updateUser({ id, full_name, email, role }) {
  return callApi('PUT', { id, full_name, email, role })
}

async function deleteUser({ id }) {
  return callApi('DELETE', { id })
}

export { createUser, updateUser, deleteUser }
