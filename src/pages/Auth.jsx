import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      })
      if (error) setMessage(error.message)
      else setMessage('Account created! You can now log in.')
    }
    setLoading(false)
  }

  const styles = {
    container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
    card: { background: 'white', padding: 40, borderRadius: 12, width: 360, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
    title: { margin: '0 0 24px', fontSize: 22, fontWeight: 600 },
    input: { width: '100%', padding: '10px 12px', marginBottom: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 15, boxSizing: 'border-box' },
    button: { width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontWeight: 500 },
    toggle: { marginTop: 16, textAlign: 'center', fontSize: 14, color: '#555' },
    link: { color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' },
    message: { marginTop: 12, padding: '10px 12px', background: '#f0f9ff', borderRadius: 8, fontSize: 14, color: '#0369a1' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{isLogin ? 'Log in' : 'Create account'}</h1>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input style={styles.input} placeholder="Full name" value={fullName}
              onChange={e => setFullName(e.target.value)} required />
          )}
          <input style={styles.input} type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required />
          <button style={styles.button} disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Log in' : 'Register'}
          </button>
        </form>
        {message && <div style={styles.message}>{message}</div>}
        <div style={styles.toggle}>
          {isLogin ? "Don't have an account? " : 'Already registered? '}
          <span style={styles.link} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register' : 'Log in'}
          </span>
        </div>
      </div>
    </div>
  )
}