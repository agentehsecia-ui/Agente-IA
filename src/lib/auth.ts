import { createBrowserClient } from './supabase'
import { Perfil } from './types'

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createBrowserClient()
  await supabase.auth.signOut()
}

export async function getSession() {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getPerfil(): Promise<Perfil | null> {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return data
}
