import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { theme, statusColor, statusBg } from '../theme'

export default function EmployeeDashboard({ profile }) {
  const [allowance, setAllowance] = useState(null)
  const [requests, setRequests] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('request-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'holiday_requests',
        filter: `employee_id=eq.${profile.id}`
      }, () => fetchData())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchData() {
    const { data: allowanceData } = await supabase
      .from('holiday_allowances').select('*')
      .eq('employee_id', profile.id).eq('year', currentYear).single()
    setAllowance(allowanceData)
    const { data: requestData } = await supabase
      .from('holiday_requests').select('*')
      .eq('employee_id', profile.id).order('created_at', { ascending: false })
    setRequests(requestData || [])
  }

  function countDays(start, end) {
    const s = new Date(start), e = new Date(end)
    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1
  }

  const daysUsed = requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.days_requested, 0)
  const daysRemaining = allowance ? allowance.total_days - daysUsed : null

  async function submitRequest(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const days = countDays(startDate, endDate)
    if (days <= 0) { setMessage('End date must be after start date.'); setLoading(false); return }
    if (daysRemaining !== null && days > daysRemaining) {
      setMessage(`You only have ${daysRemaining} days remaining.`); setLoading(false); return
    }
    const { error } = await supabase.from('holiday_requests').insert({
      employee_id: profile.id, start_date: startDate,
      end_date: endDate, days_requested: days, reason
    })
    if (error) setMessage(error.message)
    else { setMessage('Request submitted successfully!'); setStartDate(''); setEndDate(''); setReason(''); fetchData() }
    setLoading(false)
  }

  async function cancelRequest(id) {
    await supabase.from('holiday_requests').delete().eq('id', id)
    fetchData()
  }

  async function handleLogout() { await supabase.auth.signOut() }

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background, fontFamily: theme.font.sans }}>

      {/* Top nav */}
      <div style={{
        background: theme.colors.surface, borderBottom: `1px solid ${theme.colors.borderLight}`,
        padding: '0 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌴</span>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Holiday Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: theme.colors.textSecondary }}>
            {profile.full_name}
          </span>
          <button onClick={handleLogout} style={{
            padding: '7px 16px', background: 'white',
            border: `1.5px solid ${theme.colors.border}`,
            borderRadius: theme.radius.full, fontSize: 13,
            cursor: 'pointer', fontWeight: 500, color: theme.colors.textSecondary,
          }}>Log out</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Hi, {profile.full_name} 👋</h1>
          <p style={{ color: theme.colors.textSecondary, marginTop: 4, fontSize: 14 }}>
            Here's your holiday summary for {currentYear}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total entitlement', value: allowance ? allowance.total_days : '—', color: theme.colors.text },
            { label: 'Days taken', value: daysUsed, color: theme.colors.text },
            { label: 'Days remaining', value: daysRemaining !== null ? daysRemaining : '—',
              color: daysRemaining !== null && daysRemaining < 5 ? theme.colors.danger : theme.colors.success },
          ].map((stat, i) => (
            <div key={i} style={{
              background: theme.colors.surface, borderRadius: theme.radius.lg,
              padding: '24px 28px', boxShadow: theme.shadow.sm,
              border: `1px solid ${theme.colors.borderLight}`,
            }}>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8, fontWeight: 500 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Request form */}
        <div style={{
          background: theme.colors.surface, borderRadius: theme.radius.lg,
          padding: 28, marginBottom: 28, boxShadow: theme.shadow.sm,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Request holiday</h2>
          <form onSubmit={submitRequest}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Start date</label>
                <input style={inputStyle} type="date" value={startDate}
                  onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>End date</label>
                <input style={inputStyle} type="date" value={endDate}
                  onChange={e => setEndDate(e.target.value)} required />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Reason (optional)</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3}
                placeholder="e.g. Family holiday" value={reason}
                onChange={e => setReason(e.target.value)} />
            </div>
            <button style={{
              padding: '11px 28px', background: theme.colors.primary,
              color: 'white', border: 'none', borderRadius: theme.radius.md,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Submit request</button>
            {message && (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: theme.radius.sm,
                fontSize: 13, background: theme.colors.primaryLight,
                color: theme.colors.primary, border: '1px solid #fed7aa',
              }}>{message}</div>
            )}
          </form>
        </div>

        {/* Requests table */}
        <div style={{
          background: theme.colors.surface, borderRadius: theme.radius.lg,
          boxShadow: theme.shadow.sm, border: `1px solid ${theme.colors.borderLight}`,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.colors.borderLight}` }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>My requests</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafaf9' }}>
                {['Start', 'End', 'Days', 'Reason', 'Status', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '11px 20px',
                    fontSize: 12, fontWeight: 600, color: theme.colors.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: `1px solid ${theme.colors.borderLight}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px 20px', color: theme.colors.textMuted, fontSize: 14 }}>
                  No requests yet.
                </td></tr>
              )}
              {requests.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                  <td style={tdStyle}>{r.start_date}</td>
                  <td style={tdStyle}>{r.end_date}</td>
                  <td style={tdStyle}>{r.days_requested}</td>
                  <td style={tdStyle}>{r.reason || '—'}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '4px 10px', borderRadius: theme.radius.full, fontSize: 12, fontWeight: 500,
                      color: statusColor[r.status], background: statusBg[r.status],
                    }}>{r.status}</span>
                  </td>
                  <td style={tdStyle}>
                    {r.status === 'pending' && (
                      <button onClick={() => cancelRequest(r.id)} style={{
                        padding: '5px 12px', background: 'white',
                        color: theme.colors.danger,
                        border: `1.5px solid ${theme.colors.danger}`,
                        borderRadius: theme.radius.full, fontSize: 12,
                        cursor: 'pointer', fontWeight: 500,
                      }}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#57534e', marginBottom: 6 }
const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #e8e0d8',
  borderRadius: '10px', fontSize: 14, outline: 'none', background: '#fffbf7',
}
const tdStyle = { padding: '13px 20px', fontSize: 14, color: '#1c1917' }