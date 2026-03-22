import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { theme } from '../theme'

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
        email, password,
        options: { data: { full_name: fullName } }
      })
      if (error) setMessage(error.message)
      else setMessage('Account created! You can now log in.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: theme.colors.background,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, background: theme.colors.primary,
            borderRadius: theme.radius.md, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 14,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.text }}>Holiday Manager</h1>
          <p style={{ color: theme.colors.textSecondary, marginTop: 4, fontSize: 14 }}>
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <div style={{
          background: theme.colors.surface, borderRadius: theme.radius.xl,
          padding: 32, border: `1px solid ${theme.colors.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Full name</label>
                <input style={inputStyle} placeholder="Jane Smith"
                  value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" placeholder="jane@company.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password</label>
              <input style={inputStyle} type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button style={{
              width: '100%', padding: '11px',
              background: loading ? theme.colors.textMuted : theme.colors.primary,
              color: 'white', border: 'none', borderRadius: theme.radius.md,
              fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {message && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: theme.radius.md,
              fontSize: 13, background: '#f0fdf4', color: '#065f46',
              border: '1px solid #a7f3d0',
            }}>{message}</div>
          )}

          <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: theme.colors.textSecondary }}>
            {isLogin ? "Don't have an account? " : 'Already registered? '}
            <span onClick={() => setIsLogin(!isLogin)} style={{
              color: theme.colors.primary, cursor: 'pointer', fontWeight: 500,
            }}>
              {isLogin ? 'Register' : 'Sign in'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5,
}
const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb',
  borderRadius: '8px', fontSize: 14, outline: 'none', background: '#fff',
  color: '#111827',
}