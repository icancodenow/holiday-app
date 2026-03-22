import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ManagerDashboard({ profile }) {
  const [requests, setRequests] = useState([])
  const [employees, setEmployees] = useState([])
  const [allowances, setAllowances] = useState({})
  const [tab, setTab] = useState('requests')
  const currentYear = new Date().getFullYear()

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data: reqs } = await supabase
      .rpc('get_all_requests')
      .order('created_at', { ascending: false })
    setRequests(reqs || [])

    const { data: emps } = await supabase.rpc('get_all_profiles')
    setEmployees(emps?.filter(e => e.role === 'employee') || [])

    const { data: alws } = await supabase
      .from('holiday_allowances')
      .select('*')
      .eq('year', currentYear)
    const map = {}
    alws?.forEach(a => { map[a.employee_id] = a.total_days })
    setAllowances(map)
  }

  async function updateStatus(id, status) {
    await supabase.from('holiday_requests').update({ status }).eq('id', id)
    fetchAll()
  }

  async function cancelRequest(id, status) {
    await supabase.from('holiday_requests').delete().eq('id', id)
    fetchAll()
  }

  async function setAllowance(employeeId, days) {
    await supabase.from('holiday_allowances').upsert(
      { employee_id: employeeId, year: currentYear, total_days: parseInt(days) },
      { onConflict: 'employee_id,year' }
    )
    fetchAll()
  }

  async function handleLogout() { await supabase.auth.signOut() }

  function getDaysUsed(employeeId) {
    return requests
      .filter(r => r.employee_id === employeeId && r.status === 'approved')
      .reduce((sum, r) => sum + r.days_requested, 0)
  }

  function getDaysRemaining(employeeId) {
    const total = allowances[employeeId] ?? null
    if (total === null) return null
    return total - getDaysUsed(employeeId)
  }

  const s = {
    page: { minHeight: '100vh', background: '#f5f5f5', padding: 32 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
    title: { margin: 0, fontSize: 22, fontWeight: 600 },
    logout: { padding: '8px 16px', background: 'white', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' },
    tabs: { display: 'flex', gap: 8, marginBottom: 24 },
    tab: (active) => ({ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500, background: active ? '#2563eb' : 'white', color: active ? 'white' : '#555' }),
    card: { background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: 13, color: '#888', borderBottom: '1px solid #eee' },
    td: { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid #f0f0f0' },
    approve: { padding: '5px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 6, fontSize: 13 },
    reject: { padding: '5px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
    cancel: { padding: '5px 12px', background: 'white', color: '#888', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
    input: { width: 70, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 },
    save: { padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', marginLeft: 8, fontSize: 13 },
  }

  const statusColor = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' }
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Manager dashboard — {profile.full_name}</h1>
        <button style={s.logout} onClick={handleLogout}>Log out</button>
      </div>

      <div style={s.tabs}>
        <button style={s.tab(tab === 'requests')} onClick={() => setTab('requests')}>
          Holiday requests {pendingCount > 0 && `(${pendingCount} pending)`}
        </button>
        <button style={s.tab(tab === 'employees')} onClick={() => setTab('employees')}>
          Employees & allowances
        </button>
        <button style={s.tab(tab === 'overview')} onClick={() => setTab('overview')}>
          Holiday overview
        </button>
      </div>

      {tab === 'requests' && (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Employee</th>
                <th style={s.th}>Start</th>
                <th style={s.th}>End</th>
                <th style={s.th}>Days</th>
                <th style={s.th}>Reason</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr><td style={s.td} colSpan={7}>No requests yet.</td></tr>
              )}
              {requests.map(r => (
                <tr key={r.id}>
                  <td style={s.td}>{r.full_name}</td>
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
                    {r.status === 'pending' && <>
                      <button style={s.approve} onClick={() => updateStatus(r.id, 'approved')}>Approve</button>
                      <button style={{ ...s.reject, marginLeft: 6 }} onClick={() => updateStatus(r.id, 'rejected')}>Reject</button>
                    </>}
                    {(r.status === 'approved' || r.status === 'rejected') &&
                      <button style={s.cancel} onClick={() => cancelRequest(r.id, r.status)}>Cancel</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'employees' && (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Name</th>
                <th style={s.th}>Email</th>
                <th style={s.th}>Allowance ({currentYear} days)</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td style={s.td} colSpan={3}>No employees registered yet.</td></tr>
              )}
              {employees.map(emp => (
                <EmployeeRow key={emp.id} emp={emp} current={allowances[emp.id] ?? ''} onSave={setAllowance} styles={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'overview' && (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Name</th>
                <th style={s.th}>Entitled days</th>
                <th style={s.th}>Days used</th>
                <th style={s.th}>Days remaining</th>
                <th style={s.th}>Pending requests</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td style={s.td} colSpan={5}>No employees registered yet.</td></tr>
              )}
              {employees.map(emp => {
                const total = allowances[emp.id] ?? null
                const used = getDaysUsed(emp.id)
                const remaining = getDaysRemaining(emp.id)
                const pending = requests.filter(r => r.employee_id === emp.id && r.status === 'pending').length
                return (
                  <tr key={emp.id}>
                    <td style={s.td}>{emp.full_name}</td>
                    <td style={s.td}>{total ?? '—'}</td>
                    <td style={s.td}>{used}</td>
                    <td style={s.td}>
                      <span style={{ color: remaining !== null ? (remaining < 5 ? '#ef4444' : '#10b981') : '#888', fontWeight: 500 }}>
                        {remaining !== null ? remaining : '—'}
                      </span>
                    </td>
                    <td style={s.td}>
                      {pending > 0
                        ? <span style={{ color: '#f59e0b', fontWeight: 500 }}>{pending} pending</span>
                        : <span style={{ color: '#aaa' }}>None</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function EmployeeRow({ emp, current, onSave, styles: s }) {
  const [days, setDays] = useState(current)
  return (
    <tr>
      <td style={s.td}>{emp.full_name}</td>
      <td style={s.td}>{emp.email}</td>
      <td style={s.td}>
        <input style={s.input} type="number" min="0" max="365" value={days}
          onChange={e => setDays(e.target.value)} />
        <button style={s.save} onClick={() => onSave(emp.id, days)}>Save</button>
      </td>
    </tr>
  )
}