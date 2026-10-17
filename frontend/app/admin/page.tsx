'use client'

import { FormEvent, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Eye,
  FileText,
  Leaf,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_CIVICFIX_API || 'http://127.0.0.1:5000'
const TOKEN_KEY = 'civicfix_admin_token' 

type Account = {
  id: number
  name: string
  email: string
  role: string
}

type AdminReport = {
  id: number
  user_id: number | null
  category: string
  location: string
  description: string
  ai_description: string
  priority: string
  priority_reason: string
  evidence_feedback: string
  photo_filename: string | null
  status: string
  created_at: string
  reporter_name?: string | null
  reporter_email?: string | null
}

const STATUSES = ['Submitted', 'In Progress', 'Resolved', 'Rejected']

function formatDate(value: string) {
  if (!value) return '—'
  const date = new Date(value.replace(' ', 'T') + (value.endsWith('Z') ? '' : 'Z'))
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
}

export default function AdminPage() {
  const [token, setToken] = useState('')
  const [account, setAccount] = useState<Account | null>(null)
  const [reports, setReports] = useState<AdminReport[]>([])
  const [checking, setChecking] = useState(true)
  const [loadingReports, setLoadingReports] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [photoUrl, setPhotoUrl] = useState('')

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)

    if (!savedToken) {
      setChecking(false)
      return
    }

    let cancelled = false

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok || !result.success) throw new Error('Session expired.')

        if (result.user.role !== 'admin') {
          localStorage.removeItem(TOKEN_KEY)
          throw new Error('This account does not have administrator access.')
        }

        if (!cancelled) {
          setAccount(result.user as Account)
          setToken(savedToken)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not verify the account.')
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!token) {
      setReports([])
      return
    }

    let cancelled = false
    setLoadingReports(true)
    setError('')

    fetch(`${API}/api/admin/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Could not load reports.')
        }
        if (!cancelled) setReports(result.reports as AdminReport[])
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load reports.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingReports(false)
      })

    return () => { cancelled = true }
  }, [token])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Login failed.')
      }

      if (result.user.role !== 'admin') {
        throw new Error('This account is not an administrator account.')
      }

      localStorage.setItem(TOKEN_KEY, result.token)
      setAccount(result.user as Account)
      setToken(result.token)
      setSuccess('Administrator login successful.')
      setLoginPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in.')
    } finally {
      setLoginLoading(false)
      setChecking(false)
    }
  }

  async function updateStatus(reportId: number, status: string) {
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API}/api/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Could not update report status.')
      }

      setReports((current) =>
        current.map((item) =>
          item.id === reportId ? { ...item, status: result.report.status } : item
        )
      )
      setSuccess(`Report CF-${String(reportId).padStart(5, '0')} updated to ${status}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update report status.')
    }
  }

  async function viewPhoto(report: AdminReport) {
    setError('')

    if (!report.photo_filename) {
      setError('This report does not have a stored photo.')
      return
    }

    try {
      const response = await fetch(`${API}/api/reports/${report.id}/photo`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.message || 'Could not load this photo.')
      }

      const blob = await response.blob()
      if (photoUrl) URL.revokeObjectURL(photoUrl)
      setPhotoUrl(URL.createObjectURL(blob))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load photo.')
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl('')
    setToken('')
    setAccount(null)
    setReports([])
    setLoginPassword('')
    setError('')
    setSuccess('')
    window.location.replace('/')
  }

  const filteredReports = reports.filter((report) => {
    const searchable = [
      report.id,
      report.category,
      report.location,
      report.description,
      report.ai_description,
      report.reporter_name || '',
      report.reporter_email || '',
    ].join(' ').toLowerCase()

    return searchable.includes(search.toLowerCase()) &&
      (statusFilter === 'All' || report.status === statusFilter)
  })

  const inProgress = reports.filter((report) => report.status === 'In Progress').length
  const resolved = reports.filter((report) => report.status === 'Resolved').length
  const submitted = reports.filter((report) => report.status === 'Submitted').length

  if (checking) {
    return (
      <main className="adm-screen adm-centered">
        <div className="adm-loader" />
        <p>Checking administrator access…</p>
        <AdminStyles />
      </main>
    )
  }

  if (!account || !token) {
    return (
      <main className="adm-screen adm-centered">
        <section className="adm-login-card">
          <a className="adm-back-link" href="/">
            <ArrowLeft size={16} /> Back to CivicFix AI
          </a>

          <div className="adm-logo"><ShieldCheck size={26} /></div>
          <span className="adm-eyebrow">RESTRICTED AREA</span>
          <h1>Administrator login</h1>
          <p className="adm-muted">
            Sign in with the administrator credentials configured in your backend
            environment file.
          </p>

          <form className="adm-login-form" onSubmit={handleLogin}>
            <label>
              Admin email
              <input
                type="email"
                required
                autoComplete="username"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="admin@example.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Admin password"
              />
            </label>

            {error && <p className="adm-message adm-error" role="alert">{error}</p>}

            <button className="adm-primary adm-full" disabled={loginLoading}>
              {loginLoading ? 'Verifying…' : 'Log in as administrator'}
            </button>
          </form>
          <p className="adm-footnote">Only accounts with the admin role can access this panel.</p>
        </section>
        <AdminStyles />
      </main>
    )
  }

  return (
    <main className="adm-screen">
      <header className="adm-header">
        <a href="/" className="adm-brand">
          <span className="adm-brand-mark"><Leaf size={20} /></span>
          CivicFix <em>AI</em>
          <span className="adm-badge">ADMIN</span>
        </a>

        <div className="adm-header-right">
          <span className="adm-admin-email">{account.email}</span>
          <button className="adm-secondary adm-logout" onClick={logout}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </header>

      <section className="adm-content">
        <div className="adm-page-heading">
          <div>
            <span className="adm-eyebrow">ADMINISTRATION</span>
            <h1>Report management</h1>
            <p>Review submitted civic reports and update their current status.</p>
          </div>
          <button className="adm-secondary" onClick={() => window.location.reload()}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {error && <p className="adm-message adm-error" role="alert">{error}</p>}
        {success && <p className="adm-message adm-success"><Check size={16} /> {success}</p>}

        <div className="adm-stats">
          <article><span>Total reports</span><strong>{reports.length}</strong><FileText size={20} /></article>
          <article><span>Submitted</span><strong>{submitted}</strong><Users size={20} /></article>
          <article><span>In progress</span><strong>{inProgress}</strong><RefreshCw size={20} /></article>
          <article><span>Resolved</span><strong>{resolved}</strong><Check size={20} /></article>
        </div>

        <section className="adm-table-card">
          <div className="adm-toolbar">
            <label className="adm-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by report, location, or user"
              />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="All">All statuses</option>
              {STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>

          {loadingReports ? (
            <div className="adm-empty"><div className="adm-loader" /> Loading reports…</div>
          ) : filteredReports.length === 0 ? (
            <div className="adm-empty">
              <FileText size={29} />
              <h3>No reports found</h3>
              <p>Reports from registered users will appear here when submitted.</p>
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Reporter</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Created</th>
                    <th>Photo</th>
                    <th>Update status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <strong>CF-{String(report.id).padStart(5, '0')}</strong>
                        <span className="adm-subcell">{report.category}</span>
                        <span className="adm-description">
  {(() => {
    const description = report.description || report.ai_description || ''
    return description.length > 140
      ? `${description.slice(0, 140).trimEnd()}…`
      : description
  })()}
</span>

<details className="adm-description-details">
  <summary>View full complaint</summary>
  <div className="adm-full-description">
    {report.description || report.ai_description || 'No description available.'}
  </div>
</details>
                      </td>
                      <td>
                        <strong>{report.reporter_name || 'Legacy report'}</strong>
                        <span className="adm-subcell">{report.reporter_email || 'No linked owner'}</span>
                      </td>
                      <td>{report.location}</td>
                      <td>
                        <span className={`adm-priority ${report.priority.toLowerCase()}`}>
                          {report.priority}
                        </span>
                      </td>
                      <td>{formatDate(report.created_at)}</td>
                      <td>
                        {report.photo_filename ? (
                          <button className="adm-view-photo" onClick={() => viewPhoto(report)}>
                            <Eye size={15} /> View
                          </button>
                        ) : (
                          <span className="adm-no-photo">No photo</span>
                        )}
                      </td>
                      <td>
                        <select
                          className="adm-status-select"
                          value={report.status}
                          onChange={(event) => updateStatus(report.id, event.target.value)}
                        >
                          {STATUSES.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="adm-table-footer">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </section>

        <p className="adm-disclaimer">
          CivicFix AI is a demonstration application. Updating a report here changes its
          local database status; it does not send the report to municipal authorities.
        </p>
      </section>

      {photoUrl && (
        <div className="adm-photo-backdrop" onMouseDown={() => {
          URL.revokeObjectURL(photoUrl)
          setPhotoUrl('')
        }}>
          <div className="adm-photo-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button
              className="adm-photo-close"
              aria-label="Close photo"
              onClick={() => {
                URL.revokeObjectURL(photoUrl)
                setPhotoUrl('')
              }}
            >
              <X size={20} />
            </button>
            <img src={photoUrl} alt="Report evidence" />
          </div>
        </div>
      )}

      <AdminStyles />
    </main>
  )
}

function AdminStyles() {
  return (
    <style jsx global>{`
      .adm-screen { min-height: 100vh; background: #f5f8f6; color: #12382d; font-family: Arial, Helvetica, sans-serif; }
      .adm-centered { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 26px; box-sizing: border-box; }
      .adm-loader { width: 25px; height: 25px; border: 3px solid #dae9e0; border-top-color: #218d6b; border-radius: 50%; animation: adm-spin .8s linear infinite; }
      @keyframes adm-spin { to { transform: rotate(360deg); } }
      .adm-login-card { position: relative; box-sizing: border-box; width: 100%; max-width: 440px; background: #fff; border: 1px solid #dfebe4; border-radius: 22px; padding: 33px; box-shadow: 0 22px 65px #11392b0e; }
      .adm-back-link { display: inline-flex; gap: 7px; align-items: center; margin-bottom: 30px; color: #688076; text-decoration: none; font-size: 12px; font-weight: 700; }
      .adm-logo, .adm-brand-mark { display: inline-grid; place-items: center; width: 47px; height: 47px; border-radius: 14px; background: #0d3b2f; color: white; }
      .adm-eyebrow { display: block; color: #218d6b; font-size: 10px; font-weight: 800; letter-spacing: 1.7px; margin-top: 17px; }
      .adm-login-card h1 { margin: 10px 0; font-size: 30px; letter-spacing: -1px; }
      .adm-muted, .adm-page-heading p { color: #788b81; font-size: 13px; line-height: 1.7; }
      .adm-login-form { display: flex; flex-direction: column; gap: 16px; margin-top: 22px; }
      .adm-login-form label { display: flex; flex-direction: column; gap: 8px; color: #576d63; font-size: 12px; font-weight: 700; }
      .adm-login-form input, .adm-toolbar input, .adm-toolbar select { box-sizing: border-box; padding: 12px; border: 1px solid #dce8e0; border-radius: 9px; color: #153b30; font: inherit; font-size: 13px; outline: none; background: white; min-width: 0; }
      .adm-login-form input:focus, .adm-toolbar input:focus, .adm-toolbar select:focus { border-color: #218d6b; }
      .adm-primary, .adm-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; padding: 0 15px; border-radius: 9px; border: 1px solid transparent; font-size: 12px; font-weight: 800; cursor: pointer; text-decoration: none; }
      .adm-primary { background: #0d3b2f; color: white; }
      .adm-primary:disabled { opacity: .6; cursor: not-allowed; }
      .adm-full { width: 100%; min-height: 48px; }
      .adm-secondary { color: #254e40; border-color: #dce8e0; background: white; }
      .adm-footnote { color: #82948a; font-size: 11px; line-height: 1.7; margin: 20px 0 0; text-align: center; }
      .adm-header { position: sticky; top: 0; z-index: 10; background: white; border-bottom: 1px solid #e2ebe5; padding: 14px 4%; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
      .adm-brand { display: flex; align-items: center; gap: 10px; color: #0d3b2f; text-decoration: none; font-size: 21px; font-weight: 800; }
      .adm-brand em { color: #218d6b; font-style: normal; }
      .adm-brand-mark { width: 38px; height: 38px; border-radius: 12px; }
      .adm-badge { font-size: 9px; letter-spacing: 1px; border-radius: 999px; padding: 6px 8px; background: #e4f5eb; color: #218d6b; }
      .adm-header-right { display: flex; align-items: center; gap: 14px; }
      .adm-admin-email { color: #6d8076; font-size: 12px; }
      .adm-content { max-width: 1500px; padding: 40px 4% 55px; margin: auto; }
      .adm-page-heading { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 27px; }
      .adm-page-heading .adm-eyebrow { margin-top: 0; }
      .adm-page-heading h1 { font-size: clamp(30px, 4vw, 43px); margin: 10px 0 8px; letter-spacing: -1.5px; }
      .adm-page-heading p { margin: 0; }
      .adm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
      .adm-stats article { display: grid; grid-template-columns: 1fr auto; gap: 10px; border: 1px solid #dfebe4; border-radius: 15px; padding: 21px; background: white; }
      .adm-stats article span { color: #768a80; font-size: 12px; }
      .adm-stats article strong { grid-column: 1; font-size: 32px; letter-spacing: -1px; }
      .adm-stats article svg { grid-column: 2; grid-row: 1 / span 2; align-self: center; color: #218d6b; }
      .adm-table-card { background: white; border: 1px solid #dfeae3; border-radius: 16px; overflow: hidden; }
      .adm-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 15px; padding: 15px; background: #fafcfb; border-bottom: 1px solid #e2ebe5; }
      .adm-search { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
      .adm-search > span { font-size: 25px; color: #80968b; line-height: 1; }
      .adm-toolbar input { border: 0; background: transparent; flex: 1; }
      .adm-table-wrap { width: 100%; overflow-x: auto; }
      .adm-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; }
      .adm-table th { padding: 15px 12px; background: #fff; color: #7b8d84; font-size: 10px; text-transform: uppercase; letter-spacing: .6px; white-space: nowrap; }
      .adm-table td { border-top: 1px solid #edf2ee; padding: 15px 12px; color: #536a60; vertical-align: top; min-width: 85px; }
      .adm-table td:first-child { min-width: 210px; max-width: 270px; }
      .adm-table td:nth-child(2) { min-width: 145px; }
      .adm-table td strong { display: block; color: #173c30; font-size: 12px; }
      .adm-subcell { display: block; margin-top: 5px; color: #74887e; font-size: 11px; overflow-wrap: anywhere; }
      .adm-description {
  display: block;
  margin-top: 10px;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  overflow-wrap: anywhere;
  word-break: normal;
  max-height: none;
  height: auto;
  line-height: 1.6;
  -webkit-line-clamp: unset;
  -webkit-box-orient: initial;
  .adm-description-details {
  margin-top: 8px;
}

.adm-description-details summary {
  display: inline-block;
  color: #218d6b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  list-style: none;
}

.adm-description-details summary::-webkit-details-marker {
  display: none;
}

.adm-description-details summary::after {
  content: " ▾";
}

.adm-description-details[open] summary::after {
  content: " ▴";
}

.adm-full-description {
  margin-top: 8px;
  color: #536a60;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
}
      .adm-priority { display: inline-flex; padding: 6px 8px; border-radius: 7px; font-size: 10px; font-weight: 800; background: #eef4ef; color: #657a70; }
      .adm-priority.high { color: #ae4738; background: #fff0ed; }
      .adm-priority.medium { color: #9b6b20; background: #fff6e4; }
      .adm-priority.low { color: #287457; background: #eaf7ee; }
      .adm-status-select { max-width: 135px; border: 1px solid #dce8e0; border-radius: 8px; padding: 9px 8px; color: #36574a; background: #fff; font-size: 11px; }
      .adm-view-photo { display: inline-flex; align-items: center; gap: 5px; background: #edf7f0; border: 1px solid #d9ebdf; color: #218d6b; font-weight: 800; border-radius: 7px; padding: 8px; cursor: pointer; font-size: 11px; }
      .adm-no-photo { color: #9aa79f; font-size: 11px; }
      .adm-table-footer { border-top: 1px solid #edf2ee; padding: 13px 17px; color: #84958b; font-size: 11px; }
      .adm-empty { min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #82948a; font-size: 13px; }
      .adm-empty h3 { margin: 0; color: #173c30; }
      .adm-empty p { margin: 0; }
      .adm-message { display: flex; align-items: center; gap: 8px; padding: 11px 13px; border-radius: 9px; font-size: 12px; line-height: 1.5; margin: 0 0 18px; overflow-wrap: anywhere; }
      .adm-error { color: #a33737; background: #fff0ef; border: 1px solid #f2d6d3; }
      .adm-success { color: #20724f; background: #eaf7ee; border: 1px solid #d0ead8; }
      .adm-disclaimer { font-size: 11px; line-height: 1.7; color: #86968d; margin-top: 19px; }
      .adm-photo-backdrop { position: fixed; inset: 0; z-index: 50; padding: 25px; display: flex; align-items: center; justify-content: center; background: #071d17cc; }
      .adm-photo-modal { position: relative; max-width: 92vw; max-height: 88vh; background: #fff; border-radius: 14px; padding: 12px; }
      .adm-photo-modal img { display: block; max-width: 88vw; max-height: 82vh; object-fit: contain; border-radius: 8px; }
      .adm-photo-close { position: absolute; right: 18px; top: 18px; z-index: 2; background: #fff; border: 0; color: #153b30; border-radius: 50%; width: 37px; height: 37px; display: grid; place-items: center; cursor: pointer; box-shadow: 0 1px 10px #0002; }
      @media (max-width: 750px) {
        .adm-header { padding: 13px 5%; }
        .adm-admin-email { display: none; }
        .adm-content { padding: 28px 4% 40px; }
        .adm-page-heading { align-items: flex-start; flex-direction: column; }
        .adm-stats { grid-template-columns: repeat(2, 1fr); }
        .adm-toolbar { align-items: stretch; flex-direction: column; }
        .adm-toolbar select { width: 100%; }
      }
    `}</style>
  )
}