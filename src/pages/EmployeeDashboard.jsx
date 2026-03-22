import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { theme, statusColor, statusBg, statusBorder } from '../theme'

export default function EmployeeDashboard({ profile }) {
  const [allowance, setAllowance] = useState(null)
  const [requests, setRequests] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [leaveType, setLeaveType] = useState('holiday')
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

  const daysUsed = requests
  .filter(r => r.status === 'approved' && r.leave_type === 'holiday')
  .reduce((sum, r) => sum + r.days_requested, 0)

const unpaidDaysUsed = requests
  .filter(r => r.status === 'approved' && r.leave_type === 'unpaid')
  .reduce((sum, r) => sum + r.days_requested, 0)
  const daysRemaining = allowance ? allowance.total_days - daysUsed : null

  async function submitRequest(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const days = countDays(startDate, endDate)
    if (days <= 0) { setMessage('End date must be after start date.'); setLoading(false); return }
    if (leaveType === 'holiday' && daysRemaining !== null && days > daysRemaining) {
  setMessage(`You only have ${daysRemaining} holiday days remaining.`); setLoading(false); return
}
if (leaveType === 'unpaid' && allowance && days > allowance.unpaid_days) {
  setMessage(`You only have ${allowance.unpaid_days} unpaid leave days allowed.`); setLoading(false); return
}
    const { error } = await supabase.from('holiday_requests').insert({
  employee_id: profile.id, start_date: startDate,
  end_date: endDate, days_requested: days, reason,
  leave_type: leaveType
})
    if (error) setMessage(error.message)
    else {
      setMessage('Request submitted successfully!')
      setStartDate(''); setEndDate(''); setReason('')
      fetchData()
    }
    setLoading(false)
  }

  async function cancelRequest(id) {
    await supabase.from('holiday_requests').delete().eq('id', id)
    fetchData()
  }

  function getInitials(name) {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background, fontFamily: theme.font.sans }}>

      <div style={{
        background: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}`,
        padding: '0 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 60,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: theme.colors.primary,
            borderRadius: theme.radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: theme.colors.text }}>Holiday Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, background: theme.colors.borderLight,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.full, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary,
          }}>{getInitials(profile.full_name)}</div>
          <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>{profile.full_name}</span>
          <button onClick={() => supabase.auth.signOut()} style={{
            padding: '6px 14px', background: 'white',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.full, fontSize: 13,
            color: theme.colors.textSecondary, fontWeight: 500,
          }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>My holidays</h1>
          <p style={{ color: theme.colors.textSecondary, marginTop: 3, fontSize: 14 }}>
            {currentYear} overview
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Holiday remaining', 
  value: daysRemaining !== null ? daysRemaining : '—',
  color: daysRemaining !== null && daysRemaining < 5 ? theme.colors.danger : theme.colors.success },
{ label: 'Holiday entitlement', 
  value: allowance ? allowance.total_days : '—', 
  color: theme.colors.text },
{ label: 'Unpaid leave remaining', 
  value: allowance ? allowance.unpaid_days - unpaidDaysUsed : '—', 
  color: '#7c3aed' },
          ].map((s, i) => (
            <div key={i} style={{
              background: theme.colors.surface, borderRadius: theme.radius.lg,
              padding: '20px 24px', border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadow.sm,
            }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: theme.colors.surface, borderRadius: theme.radius.lg,
          padding: 24, marginBottom: 24, border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadow.sm,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>Request holiday</h2>
          <form onSubmit={submitRequest}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Start date</label>
                <input style={inputStyle} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>End date</label>
                <input style={inputStyle} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
  <label style={labelStyle}>Leave type</label>
  <div style={{ display: 'flex', gap: 10 }}>
    {['holiday', 'unpaid'].map(type => (
      <button key={type} type="button"
        onClick={() => setLeaveType(type)}
        style={{
          padding: '8px 20px', borderRadius: theme.radius.full,
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          border: `1px solid ${leaveType === type ? theme.colors.text : theme.colors.border}`,
          background: leaveType === type ? theme.colors.text : 'white',
          color: leaveType === type ? 'white' : theme.colors.textSecondary,
        }}>
        {type === 'holiday' ? 'Holiday' : 'Unpaid leave'}
      </button>
    ))}
  </div>
</div>
<div style={{ marginBottom: 16 }}>
  <label style={labelStyle}>Reason (optional)</label>
  <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2}
    placeholder={leaveType === 'unpaid' ? 'e.g. Personal matter' : 'e.g. Summer holiday'}
    value={reason} onChange={e => setReason(e.target.value)} />
</div>
            <button style={{
              padding: '10px 24px', background: theme.colors.primary,
              color: 'white', border: 'none', borderRadius: theme.radius.md,
              fontSize: 13, fontWeight: 600,
            }}>Submit request</button>
            {message && (
              <span style={{ marginLeft: 14, fontSize: 13, color: theme.colors.success }}>{message}</span>
            )}
          </form>
        </div>

        <div style={{
          background: theme.colors.surface, borderRadius: theme.radius.lg,
          border: `1px solid ${theme.colors.border}`, overflow: 'hidden',
          boxShadow: theme.shadow.sm,
        }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.colors.border}`, background: '#fafafa' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>My requests</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Start', 'End', 'Days', 'Type', 'Reason', 'Status', ''].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '28px 20px', color: theme.colors.textMuted, fontSize: 14 }}>
                  No requests yet.
                </td></tr>
              )}
              {requests.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                  <td style={tdStyle}>{r.start_date}</td>
                  <td style={tdStyle}>{r.end_date}</td>
                  <td style={tdStyle}>{r.days_requested}</td>
                  <td style={tdStyle}>
  <span style={{
    padding: '3px 10px', borderRadius: theme.radius.full,
    fontSize: 12, fontWeight: 500,
    color: r.leave_type === 'unpaid' ? '#7c3aed' : '#1d4ed8',
    background: r.leave_type === 'unpaid' ? '#f5f3ff' : '#eff6ff',
    border: `1px solid ${r.leave_type === 'unpaid' ? '#ddd6fe' : '#bfdbfe'}`,
  }}>{r.leave_type === 'unpaid' ? 'Unpaid' : 'Holiday'}</span>
</td>
                  <td style={{ ...tdStyle, color: theme.colors.textSecondary }}>{r.reason || '—'}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '3px 10px', borderRadius: theme.radius.full,
                      fontSize: 12, fontWeight: 500,
                      color: statusColor[r.status],
                      background: statusBg[r.status],
                      border: `1px solid ${statusBorder[r.status]}`,
                    }}>{r.status}</span>
                  </td>
                  <td style={tdStyle}>
                    {r.status === 'pending' && (
                      <button onClick={() => cancelRequest(r.id)} style={{
                        padding: '4px 12px', background: theme.colors.dangerLight,
                        color: theme.colors.danger,
                        border: `1px solid ${theme.colors.dangerBorder}`,
                        borderRadius: theme.radius.full, fontSize: 12, fontWeight: 500,
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

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }
const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb',
  borderRadius: '8px', fontSize: 14, outline: 'none', background: '#fff', color: '#111827',
}
const thStyle = {
  textAlign: 'left', padding: '10px 20px', fontSize: 11, fontWeight: 600,
  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #e5e7eb',
}
const tdStyle = { padding: '12px 20px', fontSize: 13, color: '#111827' }