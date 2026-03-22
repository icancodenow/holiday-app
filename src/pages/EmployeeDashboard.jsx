import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

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
      event: '*',
      schema: 'public',
      table: 'holiday_requests',
      filter: `employee_id=eq.${profile.id}`
    }, () => {
      fetchData()
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])

  async function fetchData() {
    const { data: allowanceData } = await supabase
      .from('holiday_allowances')
      .select('*')
      .eq('employee_id', profile.id)
      .eq('year', currentYear)
      .single()
    setAllowance(allowanceData)

    const { data: requestData } = await supabase
      .from('holiday_requests')
      .select('*')
      .eq('employee_id', profile.id)
      .order('created_at', { ascending: false })
    setRequests(requestData || [])
  }

  function countDays(start, end) {
    const s = new Date(start), e = new Date(end)
    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1
  }

  const daysUsed = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.days_requested, 0)

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
      employee_id: profile.id,
      start_date: startDate,
      end_date: endDate,
      days_requested: days,
      reason
    })
    if (error) setMessage(error.message)
    else { setMessage('Request submitted!'); setStartDate(''); setEndDate(''); setReason(''); fetchData() }
    setLoading(false)
  }
   async function cancelRequest(id) {
  await supabase.from('holiday_requests').delete().eq('id', id)
  fetchData()
}
  async function handleLogout() { await supabase.auth.signOut() }

  const s = {
    page: { minHeight: '100vh', background: '#f5f5f5', padding: 32 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
    title: { margin: 0, fontSize: 22, fontWeight: 600 },
    logout: { padding: '8px 16px', background: 'white', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 },
    card: { background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    cardLabel: { fontSize: 13, color: '#888', marginBottom: 6 },
    cardValue: { fontSize: 32, fontWeight: 700 },
    form: { background: 'white', padding: 28, borderRadius: 12, marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    formTitle: { margin: '0 0 18px', fontSize: 17, fontWeight: 600 },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
    input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', marginBottom: 12 },
    button: { padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 },
    message: { marginTop: 12, fontSize: 14, color: '#0369a1' },
    table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: 13, color: '#888', borderBottom: '1px solid #eee' },
    td: { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid #f0f0f0' },
  }

  const statusColor = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Hi, {profile.full_name} 👋</h1>
        <button style={s.logout} onClick={handleLogout}>Log out</button>
      </div>

      <div style={s.grid}>
        <div style={s.card}>
          <div style={s.cardLabel}>Total allowance ({currentYear})</div>
          <div style={s.cardValue}>{allowance ? allowance.total_days : '—'}</div>
        </div>
        <div style={s.card}>
          <div style={s.cardLabel}>Days used</div>
          <div style={s.cardValue}>{daysUsed}</div>
        </div>
        <div style={s.card}>
          <div style={s.cardLabel}>Days remaining</div>
          <div style={{ ...s.cardValue, color: daysRemaining < 5 ? '#ef4444' : '#10b981' }}>
            {daysRemaining !== null ? daysRemaining : '—'}
          </div>
        </div>
      </div>

      <div style={s.form}>
        <h2 style={s.formTitle}>Request holiday</h2>
        <form onSubmit={submitRequest}>
          <div style={s.row}>
            <div>
              <div style={{ fontSize: 13, marginBottom: 4, color: '#555' }}>Start date</div>
              <input style={s.input} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
              <div style={{ fontSize: 13, marginBottom: 4, color: '#555' }}>End date</div>
              <input style={s.input} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>
          <textarea style={s.textarea} placeholder="Reason (optional)" value={reason}
            onChange={e => setReason(e.target.value)} rows={3} />
          <button style={s.button} disabled={loading}>{loading ? 'Submitting...' : 'Submit request'}</button>
          {message && <div style={s.message}>{message}</div>}
        </form>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Start</th><th style={s.th}>End</th>
            <th style={s.th}>Days</th><th style={s.th}>Reason</th><th style={s.th}>Status</th>
<th style={s.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 && (
            <tr><td style={s.td} colSpan={5}>No requests yet.</td></tr>
          )}
          {requests.map(r => (
            <tr key={r.id}>
              <td style={s.td}>{r.start_date}</td>
              <td style={s.td}>{r.end_date}</td>
              <td style={s.td}>{r.days_requested}</td>
              <td style={s.td}>{r.reason || '—'}</td>
              <td style={s.td}>
  <span style={{ color: statusColor[r.status], fontWeight: 500, textTransform: 'capitalize' }}>
    {r.status}
  </span>
</td>
<td style={s.td}>
  {r.status === 'pending' &&
    <button onClick={() => cancelRequest(r.id)}
      style={{ padding: '5px 12px', background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
      Cancel
    </button>
  }
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}