import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
}

export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await authHeader() },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
