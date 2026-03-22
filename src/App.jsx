import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './pages/Auth'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ManagerDashboard from './pages/ManagerDashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      if (!data) throw new Error('No profile found')
      setProfile(data)
    } catch (err) {
      console.error('Profile fetch error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading your profile...</div>
  )

  if (error) return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <p style={{ color: '#ef4444', marginBottom: 16 }}>
        Something went wrong: <strong>{error}</strong>
      </p>
      <button onClick={handleLogout}
        style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: 8, border: '1px solid #ddd' }}>
        Log out and try again
      </button>
    </div>
  )

  if (!session) return <Auth />
  if (profile?.role === 'manager') return <ManagerDashboard profile={profile} />
  return <EmployeeDashboard profile={profile} />
}