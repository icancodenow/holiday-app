import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { theme, statusColor, statusBg } from '../theme'

export default function ManagerDashboard({ profile }) {
  const [requests, setRequests] = useState([])
  const [employees, setEmployees] = useState([])
  const [allowances, setAllowances] = useState({})
  const [tab, setTab] = useState('requests')
  const currentYear = new Date().getFullYear()

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data: reqs } = await supabase.rpc('get_all_requests')
    setRequests(reqs || [])
    const { data: emps } = await supabase.rpc('get_all_profiles')
    setEmployees(emps?.filter(e => e.role === 'employee') || [])
    const { data: alws } = await supabase.from('holiday_allowances').select('*').eq('year', currentYear)
    const map = {}
    alws?.forEach(a => { map[a.employee_id] = a.total_days })
    setAllowances(map)
  }

  async function updateStatus(id, status) {
    await supabase.from('holiday_requests').update({ status }).eq('id', id)
    fetchAll()
  }

  async function cancelRequest(id) {
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
    return requests.filter(r => r.employee_id === employeeId && r.status === 'approved')
      .reduce((sum, r) => sum + r.days_requested, 0)
  }

  function getDaysRemaining(employeeId) {
    const total = allowances[employeeId] ?? null
    if (total === null) return null
    return total - getDaysUsed(employeeId)
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const tabs = [
    { id: 'requests', label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { id: 'employees', label: 'Allowances' },
    { id: 'overview', label: 'Overview' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background, fontFamily: theme.font.sans }}>

      {/* Nav */}
      <div style={{
        background: theme.colors.surface, borderBottom: `1px solid ${theme.colors.borderLight}`,
        padding: '0 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌴</span>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Holiday Manager</span>
          <span style={{
            marginLeft: 8, padding: '3px 10px', background: theme.colors.primaryLight,
            color: theme.colors.primary, borderRadius: theme.radius.full,
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: theme.colors.textSecondary }}>{profile.full_name}</span>
          <button onClick={handleLogout} style={{
            padding: '7px 16px', background: 'white',
            border: `1.5px solid ${theme.colors.border}`,
            borderRadius: theme.radius.full, fontSize: 13,
            cursor: 'pointer', fontWeight: 500, color: theme.colors.textSecondary,
          }}>Log out</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Dashboard</h1>
          <p style={{ color: theme.colors.textSecondary, marginTop: 4, fontSize: 14 }}>
            Manage your team's holiday requests for {currentYear}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: theme.colors.surface, padding: 4,
          borderRadius: theme.radius.lg, width: 'fit-content',
          border: `1px solid ${theme.colors.borderLight}`,
          boxShadow: theme.shadow.sm,
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 20px', borderRadius: theme.radius.md, border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
              background: tab === t.id ? theme.colors.primary : 'transparent',
              color: tab === t.id ? 'white' : theme.colors.textSecondary,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Requests tab */}
        {tab === 'requests' && (
          <div style={{
            background: theme.colors.surface, borderRadius: theme.radius.lg,
            boxShadow: theme.shadow.sm, border: `1px solid ${theme.colors.borderLight}`,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafaf9' }}>
                  {['Employee', 'Start', 'End', 'Days', 'Reason', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '12px 20px', fontSize: 12,
                      fontWeight: 600, color: theme.colors.textMuted,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: `1px solid ${theme.colors.borderLight}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '32px 20px', color: theme.colors.textMuted, fontSize: 14 }}>
                    No requests yet.
                  </td></tr>
                )}
                {requests.map(r => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{r.full_name}</td>
                    <td style={tdStyle}>{r.start_date}</td>
                    <td style={tdStyle}>{r.end_date}</td>
                    <td style={tdStyle}>{r.days_requested}</td>
                    <td style={{ ...tdStyle, color: theme.colors.textSecondary }}>{r.reason || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 10px', borderRadius: theme.radius.full,
                        fontSize: 12, fontWeight: 500,
                        color: statusColor[r.status], background: statusBg[r.status],
                      }}>{r.status}</span>
                    </td>
                    <td style={tdStyle}>
                      {r.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => updateStatus(r.id, 'approved')} style={approveBtn}>Approve</button>
                          <button onClick={() => updateStatus(r.id, 'rejected')} style={rejectBtn}>Reject</button>
                        </div>
                      )}
                      {(r.status === 'approved' || r.status === 'rejected') && (
                        <button onClick={() => cancelRequest(r.id)} style={cancelBtn}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Allowances tab */}
        {tab === 'employees' && (
          <div style={{
            background: theme.colors.surface, borderRadius: theme.radius.lg,
            boxShadow: theme.shadow.sm, border: `1px solid ${theme.colors.borderLight}`,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafaf9' }}>
                  {['Name', 'Email', `Allowance (${currentYear})`].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '12px 20px', fontSize: 12,
                      fontWeight: 600, color: theme.colors.textMuted,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: `1px solid ${theme.colors.borderLight}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: '32px 20px', color: theme.colors.textMuted, fontSize: 14 }}>
                    No employees yet.
                  </td></tr>
                )}
                {employees.map(emp => (
                  <EmployeeRow key={emp.id} emp={emp}
                    current={allowances[emp.id] ?? ''}
                    onSave={setAllowance} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Overview tab */}
        {tab === 'overview' && (
          <div style={{
            background: theme.colors.surface, borderRadius: theme.radius.lg,
            boxShadow: theme.shadow.sm, border: `1px solid ${theme.colors.borderLight}`,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafaf9' }}>
                  {['Name', 'Entitled', 'Used', 'Remaining', 'Pending'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '12px 20px', fontSize: 12,
                      fontWeight: 600, color: theme.colors.textMuted,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: `1px solid ${theme.colors.borderLight}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '32px 20px', color: theme.colors.textMuted, fontSize: 14 }}>
                    No employees yet.
                  </td></tr>
                )}
                {employees.map(emp => {
                  const total = allowances[emp.id] ?? null
                  const used = getDaysUsed(emp.id)
                  const remaining = getDaysRemaining(emp.id)
                  const pending = requests.filter(r => r.employee_id === emp.id && r.status === 'pending').length
                  return (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{emp.full_name}</td>
                      <td style={tdStyle}>{total ?? <span style={{ color: theme.colors.textMuted }}>Not set</span>}</td>
                      <td style={tdStyle}>{used}</td>
                      <td style={tdStyle}>
                        {remaining !== null ? (
                          <span style={{
                            padding: '4px 10px', borderRadius: theme.radius.full,
                            fontSize: 12, fontWeight: 600,
                            color: remaining < 5 ? theme.colors.danger : theme.colors.success,
                            background: remaining < 5 ? theme.colors.dangerLight : theme.colors.successLight,
                          }}>{remaining} days</span>
                        ) : <span style={{ color: theme.colors.textMuted }}>—</span>}
                      </td>
                      <td style={tdStyle}>
                        {pending > 0
                          ? <span style={{
                              padding: '4px 10px', borderRadius: theme.radius.full,
                              fontSize: 12, fontWeight: 500,
                              color: theme.colors.warning, background: theme.colors.warningLight,
                            }}>{pending} pending</span>
                          : <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>None</span>
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
    </div>
  )
}

function EmployeeRow({ emp, current, onSave }) {
  const [days, setDays] = useState(current)
  return (
    <tr style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
      <td style={{ ...tdStyle, fontWeight: 500 }}>{emp.full_name}</td>
      <td style={{ ...tdStyle, color: theme.colors.textSecondary }}>{emp.email}</td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="number" min="0" max="365" value={days}
            onChange={e => setDays(e.target.value)}
            style={{
              width: 80, padding: '7px 10px', border: `1.5px solid ${theme.colors.border}`,
              borderRadius: '8px', fontSize: 14, background: '#fffbf7', outline: 'none',
            }} />
          <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>days</span>
          <button onClick={() => onSave(emp.id, days)} style={{
            padding: '7px 16px', background: theme.colors.primary,
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>Save</button>
        </div>
      </td>
    </tr>
  )
}

const tdStyle = { padding: '14px 20px', fontSize: 14, color: '#1c1917' }
const approveBtn = {
  padding: '6px 14px', background: '#f0fdf4', color: '#16a34a',
  border: '1.5px solid #bbf7d0', borderRadius: '999px',
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
}
const rejectBtn = {
  padding: '6px 14px', background: '#fef2f2', color: '#dc2626',
  border: '1.5px solid #fecaca', borderRadius: '999px',
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
}
const cancelBtn = {
  padding: '6px 14px', background: 'white', color: '#78716c',
  border: '1.5px solid #e8e0d8', borderRadius: '999px',
  fontSize: 12, fontWeight: 500, cursor: 'pointer',
}