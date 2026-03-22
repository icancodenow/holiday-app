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
      .filter(r => r.employee_id === employeeId && r.status === 'approved' && r.leave_type === 'holiday')
      .reduce((sum, r) => sum + r.days_requested, 0)
  }

  function getUnpaidDaysUsed(employeeId) {
    return requests
      .filter(r => r.employee_id === employeeId && r.status === 'approved' && r.leave_type === 'unpaid')
      .reduce((sum, r) => sum + r.days_requested, 0)
  }

  function getDaysRemaining(employeeId) {
    const total = allowances[employeeId]?.total ?? null
    if (total === null) return null
    return total - getDaysUsed(employeeId)
  }

  function getUnpaidRemaining(employeeId) {
    const total = allowances[employeeId]?.unpaid ?? null
    if (total === null) return null
    return total - getUnpaidDaysUsed(employeeId)
  }

  function getInitials(name) {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const navItems = [
    {
      id: 'requests', label: 'Requests', badge: pendingCount > 0 ? pendingCount : null,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    },
    {
      id: 'employees', label: 'Allowances', badge: null,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
    },
    {
      id: 'overview', label: 'Overview', badge: null,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    },
  ]

  const tabTitles = {
    requests: { title: 'Holiday requests', sub: `${pendingCount > 0 ? `${pendingCount} pending review` : 'All requests'}` },
    employees: { title: 'Allowances', sub: `Set holiday and unpaid leave days per employee for ${currentYear}` },
    overview: { title: 'Team overview', sub: `Holiday and unpaid leave status for all employees — ${currentYear}` },
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background, fontFamily: theme.font.sans, display: 'flex', flexDirection: 'column' }}>

      <div style={{
        background: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}`,
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, background: theme.colors.primary,
            borderRadius: theme.radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Holiday Manager</span>
          <span style={{
            marginLeft: 4, padding: '2px 8px', background: theme.colors.borderLight,
            color: theme.colors.textSecondary, borderRadius: theme.radius.full,
            fontSize: 10, fontWeight: 600, border: `1px solid ${theme.colors.border}`,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, background: theme.colors.borderLight,
            border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.full,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 600, color: theme.colors.textSecondary,
          }}>{getInitials(profile.full_name)}</div>
          <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>{profile.full_name}</span>
          <button onClick={() => supabase.auth.signOut()} style={{
            padding: '5px 12px', background: 'white', border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.full, fontSize: 12,
            color: theme.colors.textSecondary, fontWeight: 500,
          }}>Sign out</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>

        <div style={{
          width: 220, background: theme.colors.surface,
          borderRight: `1px solid ${theme.colors.border}`,
          padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: theme.colors.textMuted,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '6px 12px', marginBottom: 4,
          }}>Navigation</div>

          {navItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: theme.radius.md,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: tab === item.id ? theme.colors.borderLight : 'transparent',
              color: tab === item.id ? theme.colors.text : theme.colors.textSecondary,
              textAlign: 'left', width: '100%',
            }}>
              {item.icon}
              {item.label}
              {item.badge && (
                <span style={{
                  marginLeft: 'auto', background: theme.colors.primary, color: 'white',
                  fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: theme.radius.full,
                }}>{item.badge}</span>
              )}
            </button>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${theme.colors.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{
                background: theme.colors.background, border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md, padding: '10px 12px',
              }}>
                <div style={{ fontSize: 10, color: theme.colors.textMuted, fontWeight: 500, marginBottom: 3 }}>Pending</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: theme.colors.warning }}>{pendingCount}</div>
              </div>
              <div style={{
                background: theme.colors.background, border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md, padding: '10px 12px',
              }}>
                <div style={{ fontSize: 10, color: theme.colors.textMuted, fontWeight: 500, marginBottom: 3 }}>Staff</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: theme.colors.text }}>{employees.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>

          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.colors.text }}>{tabTitles[tab].title}</h2>
            <p style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>{tabTitles[tab].sub}</p>
          </div>

          {tab === 'requests' && (
            <div style={{
              background: theme.colors.surface, border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.lg, overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    {['Employee', 'Dates', 'Days', 'Type', 'Status', 'Actions'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
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
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, background: theme.colors.borderLight,
                            border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.full,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary, flexShrink: 0,
                          }}>{getInitials(r.full_name)}</div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{r.full_name}</div>
                            <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 13 }}>{r.start_date} – {r.end_date}</div>
                        <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{currentYear}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{r.days_requested}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '3px 9px', borderRadius: theme.radius.full, fontSize: 11, fontWeight: 500,
                          color: r.leave_type === 'unpaid' ? '#7c3aed' : '#1d4ed8',
                          background: r.leave_type === 'unpaid' ? '#f5f3ff' : '#eff6ff',
                          border: `1px solid ${r.leave_type === 'unpaid' ? '#ddd6fe' : '#bfdbfe'}`,
                        }}>{r.leave_type === 'unpaid' ? 'Unpaid' : 'Holiday'}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '3px 9px', borderRadius: theme.radius.full, fontSize: 11, fontWeight: 500,
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
            </div>
          )}

          {tab === 'employees' && (
            <div style={{
              background: theme.colors.surface, border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.lg, overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={thStyle}>Employee</th>
                    <th style={thStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, background: '#111827', borderRadius: 2 }}></div>
                        Holiday days
                      </div>
                    </th>
                    <th style={thStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, background: '#7c3aed', borderRadius: 2 }}></div>
                        Unpaid days
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: '32px 20px', color: theme.colors.textMuted, fontSize: 14 }}>
                      No employees yet.
                    </td></tr>
                  )}
                  {employees.map(emp => (
                    <EmployeeRow
                      key={emp.id} emp={emp}
                      current={allowances[emp.id]?.total ?? ''}
                      currentUnpaid={allowances[emp.id]?.unpaid ?? ''}
                      onSave={setAllowance}
                      getInitials={getInitials}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {employees.length === 0 && (
                <div style={{
                  background: theme.colors.surface, border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.lg, padding: '32px 20px',
                  color: theme.colors.textMuted, fontSize: 14,
                }}>No employees yet.</div>
              )}
              {employees.map(emp => {
                const total = allowances[emp.id]?.total ?? null
                const unpaidTotal = allowances[emp.id]?.unpaid ?? null
                const used = getDaysUsed(emp.id)
                const unpaidUsed = getUnpaidDaysUsed(emp.id)
                const remaining = getDaysRemaining(emp.id)
                const unpaidRemaining = getUnpaidRemaining(emp.id)
                const pending = requests.filter(r => r.employee_id === emp.id && r.status === 'pending').length
                const holidayPct = total ? Math.min(100, Math.round((used / total) * 100)) : 0
                const unpaidPct = unpaidTotal ? Math.min(100, Math.round((unpaidUsed / unpaidTotal) * 100)) : 0

                return (
                  <div key={emp.id} style={{
                    background: theme.colors.surface, border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.lg, padding: '16px 20px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, background: theme.colors.borderLight,
                          border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.full,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary,
                        }}>{getInitials(emp.full_name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{emp.full_name}</div>
                          <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{emp.email}</div>
                        </div>
                      </div>
                      {pending > 0
                        ? <span style={{
                            padding: '3px 10px', borderRadius: theme.radius.full, fontSize: 11, fontWeight: 500,
                            color: theme.colors.warning, background: theme.colors.warningLight,
                            border: `1px solid ${theme.colors.warningBorder}`,
                          }}>{pending} pending</span>
                        : <span style={{
                            padding: '3px 10px', borderRadius: theme.radius.full, fontSize: 11,
                            color: theme.colors.textMuted, background: theme.colors.borderLight,
                            border: `1px solid ${theme.colors.border}`,
                          }}>No pending</span>
                      }
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: theme.colors.text }}>Holiday</span>
                          <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            {total !== null ? `${used} / ${total} used` : 'Not set'}
                          </span>
                        </div>
                        <div style={{ height: 6, background: theme.colors.borderLight, borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
                          <div style={{
                            height: '100%', borderRadius: 999,
                            width: `${holidayPct}%`,
                            background: remaining !== null && remaining < 5 ? theme.colors.danger : theme.colors.primary,
                          }}></div>
                        </div>
                        <div style={{
                          fontSize: 11, marginTop: 4, fontWeight: 500,
                          color: remaining === null ? theme.colors.textMuted
                            : remaining < 5 ? theme.colors.danger : theme.colors.success,
                        }}>
                          {remaining !== null ? `${remaining} days remaining` : 'Not assigned'}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: theme.colors.text }}>Unpaid</span>
                          <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            {unpaidTotal !== null ? `${unpaidUsed} / ${unpaidTotal} used` : 'Not set'}
                          </span>
                        </div>
                        <div style={{ height: 6, background: theme.colors.borderLight, borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
                          <div style={{
                            height: '100%', borderRadius: 999,
                            width: `${unpaidPct}%`,
                            background: '#7c3aed',
                          }}></div>
                        </div>
                        <div style={{
                          fontSize: 11, marginTop: 4, fontWeight: 500,
                          color: unpaidRemaining === null ? theme.colors.textMuted : '#7c3aed',
                        }}>
                          {unpaidRemaining !== null ? `${unpaidRemaining} days remaining` : 'Not assigned'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function EmployeeRow({ emp, current, currentUnpaid, onSave, getInitials }) {
  const [days, setDays] = useState(current)
  const [unpaidDays, setUnpaidDays] = useState(currentUnpaid)
  const [savedHoliday, setSavedHoliday] = useState(false)
  const [savedUnpaid, setSavedUnpaid] = useState(false)

  async function handleSaveHoliday() {
    await onSave(emp.id, days, unpaidDays)
    setSavedHoliday(true)
    setTimeout(() => setSavedHoliday(false), 1000)
  }

  async function handleSaveUnpaid() {
    await onSave(emp.id, days, unpaidDays)
    setSavedUnpaid(true)
    setTimeout(() => setSavedUnpaid(false), 1000)
  }

  return (
    <tr style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: theme.colors.borderLight,
            border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.full,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary, flexShrink: 0,
          }}>{getInitials(emp.full_name)}</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{emp.full_name}</div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{emp.email}</div>
          </div>
        </div>
      </td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="number" min="0" max="365" value={days}
            onChange={e => setDays(e.target.value)}
            style={{
              width: 72, padding: '7px 10px', border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md, fontSize: 13, outline: 'none', background: '#fff',
            }} />
          <span style={{ fontSize: 12, color: theme.colors.textMuted }}>days</span>
          <div>
            <button onClick={handleSaveHoliday} style={{
              padding: '6px 14px', background: theme.colors.primary,
              color: 'white', border: 'none', borderRadius: theme.radius.md,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Save</button>
            {savedHoliday && (
              <div style={{ fontSize: 11, color: theme.colors.success, marginTop: 3, fontWeight: 500 }}>Saved!</div>
            )}
          </div>
        </div>
      </td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="number" min="0" max="365" value={unpaidDays}
            onChange={e => setUnpaidDays(e.target.value)}
            style={{
              width: 72, padding: '7px 10px', border: `1px solid #ddd6fe`,
              borderRadius: theme.radius.md, fontSize: 13, outline: 'none', background: '#faf5ff',
            }} />
          <span style={{ fontSize: 12, color: theme.colors.textMuted }}>days</span>
          <div>
            <button onClick={handleSaveUnpaid} style={{
              padding: '6px 14px', background: '#7c3aed',
              color: 'white', border: 'none', borderRadius: theme.radius.md,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Save</button>
            {savedUnpaid && (
              <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 3, fontWeight: 500 }}>Saved!</div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

const thStyle = {
  textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600,
  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #e5e7eb',
}
const tdStyle = { padding: '14px 16px', fontSize: 13, color: '#111827' }
const approveBtn = {
  padding: '5px 10px', background: '#ecfdf5', color: '#059669',
  border: '1px solid #a7f3d0', borderRadius: '999px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
}
const rejectBtn = {
  padding: '5px 10px', background: '#fef2f2', color: '#dc2626',
  border: '1px solid #fecaca', borderRadius: '999px', fontSize: 11, fontWeight: 500, cursor: 'pointer',
}
const cancelBtn = {
  padding: '5px 10px', background: '#f9fafb', color: '#6b7280',
  border: '1px solid #e5e7eb', borderRadius: '999px', fontSize: 11, fontWeight: 500, cursor: 'pointer',
}