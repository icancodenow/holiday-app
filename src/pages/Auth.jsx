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
      minHeight: '100vh',
      background: `linear-gradient(135deg, #fff7ed 0%, #fafaf9 50%, #fef3e2 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo / branding */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: theme.colors.primary,
            borderRadius: theme.radius.lg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            fontSize: 24,
          }}>🌴</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: theme.colors.text }}>Holiday Manager</h1>
          <p style={{ color: theme.colors.textSecondary, marginTop: 6, fontSize: 15 }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: theme.colors.surface,
          borderRadius: theme.radius.xl,
          padding: 36,
          boxShadow: theme.shadow.lg,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Full name</label>
                <input style={inputStyle} placeholder="Jane Smith"
                  value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" placeholder="jane@company.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password</label>
              <input style={inputStyle} type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button style={{
              width: '100%', padding: '13px',
              background: loading ? theme.colors.textMuted : theme.colors.primary,
              color: 'white', border: 'none',
              borderRadius: theme.radius.md,
              fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}>
              {loading ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>

          {message && (
            <div style={{
              marginTop: 16, padding: '12px 14px',
              background: theme.colors.primaryLight,
              borderRadius: theme.radius.sm,
              fontSize: 14, color: theme.colors.primary,
              border: `1px solid #fed7aa`,
            }}>{message}</div>
          )}

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: theme.colors.textSecondary }}>
            {isLogin ? "Don't have an account? " : 'Already registered? '}
            <span onClick={() => setIsLogin(!isLogin)} style={{
              color: theme.colors.primary, cursor: 'pointer', fontWeight: 500,
            }}>
              {isLogin ? 'Register' : 'Log in'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 500,
  color: '#57534e', marginBottom: 6,
}
const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e8e0d8',
  borderRadius: '10px', fontSize: 14,
  outline: 'none', background: '#fffbf7',
  transition: 'border-color 0.2s',
}