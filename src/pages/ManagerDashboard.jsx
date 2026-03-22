import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { theme, statusColor, statusBg, statusBorder } from '../theme'

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
    const { data: alws } = await supabase
  .from('holiday_allowances').select('*').eq('year', currentYear)
const map = {}
alws?.forEach(a => { map[a.employee_id] = { total: a.total_days, unpaid: a.unpaid_days } })
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

  async function setAllowance(employeeId, days, unpaidDays) {
  await supabase.from('holiday_allowances').upsert(
    { employee_id: employeeId, year: currentYear, total_days: parseInt(days), unpaid_days: parseInt(unpaidDays) },
    { onConflict: 'employee_id,year' }
  )
  fetchAll()
}

  function getDaysUsed(employeeId) {
    return requests
      .filter(r => r.employee_id === employeeId && r.status === 'approved')
      .reduce((sum, r) => sum + r.days_requested, 0)
  }

  function getDaysRemaining(employeeId) {
  const total = allowances[employeeId]?.total ?? null
  if (total === null) return null
  return total - getDaysUsed(employeeId)
}

  function getInitials(name) {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const tabs = [
    { id: 'requests', label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { id: 'employees', label: 'Allowances' },
    { id: 'overview', label: 'Overview' },
  ]

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
          <span style={{ fontWeight: 600, fontSize: 14 }}>Holiday Manager</span>
          <span style={{
            marginLeft: 4, padding: '2px 8px', background: theme.colors.borderLight,
            color: theme.colors.textSecondary, borderRadius: theme.radius.full,
            fontSize: 11, fontWeight: 600, border: `1px solid ${theme.colors.border}`,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Dashboard</h1>
          <p style={{ color: theme.colors.textSecondary, marginTop: 3, fontSize: 14 }}>
            Manage your team's holidays for {currentYear}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Pending', value: pendingCount, color: theme.colors.warning },
            { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: theme.colors.success },
            { label: 'Employees', value: employees.length, color: theme.colors.text },
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

        <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: `1px solid ${theme.colors.border}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 18px', border: 'none', background: 'none',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              color: tab === t.id ? theme.colors.text : theme.colors.textMuted,
              borderBottom: tab === t.id ? `2px solid ${theme.colors.text}` : '2px solid transparent',
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{
          background: theme.colors.surface, borderRadius: theme.radius.lg,
          border: `1px solid ${theme.colors.border}`, overflow: 'hidden',
          boxShadow: theme.shadow.sm,
        }}>
          {tab === 'requests' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Employee', 'Start', 'End', 'Days', 'Type', 'Reason', 'Status', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '28px 20px', color: theme.colors.textMuted, fontSize: 14 }}>
                    No requests yet.
                  </td></tr>
                )}
                {requests.map(r => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, background: theme.colors.borderLight,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.radius.full, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 600, color: theme.colors.textSecondary,
                          flexShrink: 0,
                        }}>{getInitials(r.full_name)}</div>
                        {r.full_name}
                      </div>
                    </td>
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
                        padding: '3px 10px', borderRadius: theme.radius.full, fontSize: 12, fontWeight: 500,
                        color: statusColor[r.status], background: statusBg[r.status],
                        border: `1px solid ${statusBorder[r.status]}`,
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
          )}

          {tab === 'employees' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Name', 'Email', `Holiday days (${currentYear})`, `Unpaid days (${currentYear})`].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: '28px 20px', color: theme.colors.textMuted, fontSize: 14 }}>
                    No employees yet.
                  </td></tr>
                )}
                {employees.map(emp => (
  <EmployeeRow key={emp.id} emp={emp}
    current={allowances[emp.id]?.total ?? ''}
    currentUnpaid={allowances[emp.id]?.unpaid ?? ''}
    onSave={setAllowance}
    getInitials={getInitials} />
))}
              </tbody>
            </table>
          )}

          {tab === 'overview' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Name', 'Holiday entitled', 'Holiday used', 'Holiday remaining', 'Unpaid entitled', 'Pending'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '28px 20px', color: theme.colors.textMuted, fontSize: 14 }}>
                    No employees yet.
                  </td></tr>
                )}
                {employees.map(emp => {
                  const total = allowances[emp.id]?.total ?? null
                  const used = getDaysUsed(emp.id)
                  const remaining = getDaysRemaining(emp.id)
                  const pending = requests.filter(r => r.employee_id === emp.id && r.status === 'pending').length
                  return (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 26, height: 26, background: theme.colors.borderLight,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.radius.full, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 600, color: theme.colors.textSecondary,
                            flexShrink: 0,
                          }}>{getInitials(emp.full_name)}</div>
                          {emp.full_name}
                        </div>
                      </td>
                      <td style={tdStyle}>
  {allowances[emp.id]?.unpaid != null
    ? <span style={{
        padding: '3px 10px', borderRadius: theme.radius.full, fontSize: 12, fontWeight: 500,
        color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe',
      }}>{allowances[emp.id].unpaid} days</span>
    : <span style={{ color: theme.colors.textMuted }}>—</span>
  }
</td>
                      <td style={tdStyle}>{used}</td>
                      <td style={tdStyle}>
                        {remaining !== null ? (
                          <span style={{
                            padding: '3px 10px', borderRadius: theme.radius.full, fontSize: 12, fontWeight: 500,
                            color: remaining < 5 ? theme.colors.danger : theme.colors.success,
                            background: remaining < 5 ? theme.colors.dangerLight : theme.colors.successLight,
                            border: `1px solid ${remaining < 5 ? theme.colors.dangerBorder : theme.colors.successBorder}`,
                          }}>{remaining} days</span>
                        ) : <span style={{ color: theme.colors.textMuted }}>—</span>}
                      </td>
                      <td style={tdStyle}>
                        {pending > 0
                          ? <span style={{
                              padding: '3px 10px', borderRadius: theme.radius.full, fontSize: 12, fontWeight: 500,
                              color: theme.colors.warning, background: theme.colors.warningLight,
                              border: `1px solid ${theme.colors.warningBorder}`,
                            }}>{pending} pending</span>
                          : <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>None</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function EmployeeRow({ emp, current, currentUnpaid, onSave, getInitials }) {
  const [days, setDays] = useState(current)
  const [unpaidDays, setUnpaidDays] = useState(currentUnpaid)
  return (
    <tr style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
      <td style={{ ...tdStyle, fontWeight: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, background: theme.colors.borderLight,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.full, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 600, color: theme.colors.textSecondary, flexShrink: 0,
          }}>{getInitials(emp.full_name)}</div>
          {emp.full_name}
        </div>
      </td>
      <td style={{ ...tdStyle, color: theme.colors.textSecondary }}>{emp.email}</td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="number" min="0" max="365" value={days}
            onChange={e => setDays(e.target.value)}
            style={{
              width: 72, padding: '7px 10px', border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md, fontSize: 13, outline: 'none', background: '#fff',
            }} />
          <span style={{ fontSize: 13, color: theme.colors.textMuted }}>days</span>
          <button onClick={() => onSave(emp.id, days, unpaidDays)} style={{
            padding: '7px 14px', background: theme.colors.primary,
            color: 'white', border: 'none', borderRadius: theme.radius.md,
            fontSize: 12, fontWeight: 600,
          }}>Save</button>
        </div>
      </td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="number" min="0" max="365" value={unpaidDays}
            onChange={e => setUnpaidDays(e.target.value)}
            style={{
              width: 72, padding: '7px 10px', border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md, fontSize: 13, outline: 'none', background: '#fff',
            }} />
          <span style={{ fontSize: 13, color: theme.colors.textMuted }}>days</span>
          <button onClick={() => onSave(emp.id, days, unpaidDays)} style={{
            padding: '7px 14px', background: '#7c3aed',
            color: 'white', border: 'none', borderRadius: theme.radius.md,
            fontSize: 12, fontWeight: 600,
          }}>Save</button>
        </div>
      </td>
    </tr>
  )
}

const thStyle = {
  textAlign: 'left', padding: '10px 20px', fontSize: 11, fontWeight: 600,
  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #e5e7eb',
}
const tdStyle = { padding: '12px 20px', fontSize: 13, color: '#111827' }
const approveBtn = {
  padding: '5px 12px', background: '#ecfdf5', color: '#059669',
  border: '1px solid #a7f3d0', borderRadius: '999px', fontSize: 12, fontWeight: 600,
}
const rejectBtn = {
  padding: '5px 12px', background: '#fef2f2', color: '#dc2626',
  border: '1px solid #fecaca', borderRadius: '999px', fontSize: 12, fontWeight: 500,
}
const cancelBtn = {
  padding: '5px 12px', background: '#f9fafb', color: '#6b7280',
  border: '1px solid #e5e7eb', borderRadius: '999px', fontSize: 12, fontWeight: 500,
}