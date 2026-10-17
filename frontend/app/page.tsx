'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  Clock3,
  FileCheck2,
  FileText,
  Leaf,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
  UserRound,
  Menu,
} from 'lucide-react'
const LocationPicker = dynamic(
  () => import('./locationpicker'),
  { ssr: false }
)

const API = process.env.NEXT_PUBLIC_CIVICFIX_API || 'http://127.0.0.1:5000'
const TOKEN_KEY = 'civicfix_token'

type AuthMode = 'login' | 'signup'

type Account = {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
}

type AIAnalysis = {
  category: string
  description: string
  priority: string
  priority_reason: string
  evidence_feedback: string
}

type CivicReport = {
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
}

const categories = [
  'Roads & Potholes',
  'Waste & Garbage',
  'Streetlights',
  'Drainage & Water',
  'Other',
]

function dateLabel(value: string) {
  if (!value) return '—'
  const date = new Date(value.replace(' ', 'T') + (value.endsWith('Z') ? '' : 'Z'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function StatusBadge({ status }: { status: string }) {
  const className = status.toLowerCase().replace(/\s+/g, '-')
  return <span className={`cf-status ${className}`}>{status}</span>
}

function Header({
  account,
  onOpenAuth,
  onLogout,
}: {
  account: Account | null
  onOpenAuth: (mode: AuthMode) => void
  onLogout: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="cf-header">
      <div className="cf-header-inner">
        <a className="cf-brand" href="#home" aria-label="CivicFix AI home">
          <span className="cf-brand-mark"><Leaf size={21} /></span>
          <span>CivicFix <em>AI</em></span>
        </a>

        <nav className={`cf-nav ${menuOpen ? 'open' : ''}`}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#reports" onClick={() => setMenuOpen(false)}>My Reports</a>
          {account?.role === 'admin' && (
            <a href="/admin" onClick={() => setMenuOpen(false)}>Admin Panel</a>
          )}
        </nav>

        <div className="cf-header-actions">
          {account ? (
            <>
              <span className="cf-account-name" title={account.email}>
                <UserRound size={16} /> {account.name}
              </span>
              <button className="cf-button cf-button-dark cf-button-sm" onClick={onLogout}>
                <LogOut size={15} /> Log out
              </button>
            </>
          ) : (
            <>
              <button className="cf-login-link" onClick={() => onOpenAuth('login')}>
                Log in
              </button>
              <button className="cf-button cf-button-dark cf-button-sm" onClick={() => onOpenAuth('signup')}>
                Sign up <ArrowUpRight size={15} />
              </button>
            </>
          )}
          <button
            className="cf-menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            <Menu size={21} />
          </button>
        </div>
      </div>
    </header>
  )
}

function AuthModal({
  mode,
  onClose,
  onAuthenticated,
  onChangeMode,
}: {
  mode: AuthMode
  onClose: () => void
  onAuthenticated: (token: string, account: Account) => void
  onChangeMode: (mode: AuthMode) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API}/api/auth/${mode === 'signup' ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'signup'
            ? { name, email, password }
            : { email, password }
        ),
      })

      const result = await response.json()

      if (!response.ok || !result.success || !result.token || !result.user) {
        throw new Error(result.message || 'Authentication failed.')
      }

      onAuthenticated(result.token, result.user as Account)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to CivicFix AI backend.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cf-modal-backdrop" onMouseDown={onClose}>
      <section
        className="cf-auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cf-auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="cf-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="cf-auth-logo"><Leaf size={24} /></div>
        <span className="cf-eyebrow">CIVICFIX AI ACCOUNT</span>
        <h2 id="cf-auth-title">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="cf-muted">
          {mode === 'signup'
            ? 'Create an account to submit and track your civic reports.'
            : 'Log in to view your reports and submit a new issue.'}
        </p>

        <form onSubmit={submit} className="cf-auth-form">
          {mode === 'signup' && (
            <label>
              Full name
              <input
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your name"
              />
            </label>
          )}

          <label>
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              minLength={mode === 'signup' ? 8 : undefined}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
            />
          </label>

          {error && <p className="cf-error" role="alert">{error}</p>}

          <button className="cf-button cf-button-green cf-button-full" disabled={loading}>
            {loading
              ? 'Please wait…'
              : mode === 'signup'
                ? 'Create account'
                : 'Log in'}
            <ArrowRight size={17} />
          </button>
        </form>
{mode === 'login' && (
  <a href="/admin" className="cf-admin-login-link">
    <ShieldCheck size={18} />
    <span>Administrator? Admin Login</span>
    <ArrowRight size={17} />
  </a>
)}
        <p className="cf-auth-switch">
          {mode === 'signup' ? 'Already have an account?' : 'New to CivicFix AI?'}{' '}
          <button onClick={() => onChangeMode(mode === 'signup' ? 'login' : 'signup')}>
            {mode === 'signup' ? 'Log in' : 'Create account'}
          </button>
        </p>

        <p className="cf-security-note">
          <ShieldCheck size={15} />
          Your reports are linked to your account.
        </p>
      </section>
    </div>
  )
}

function ReportForm({
  token,
  onSaved,
  onOpenAuth,
}: {
  token: string
  onSaved: () => void
  onOpenAuth: (mode: AuthMode) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [category, setCategory] = useState('Roads & Potholes')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [reviewed, setReviewed] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function selectFile(selected?: File) {
    if (!selected) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setError('Choose a JPG, PNG, or WEBP image.')
      return
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError('Photo must be 10 MB or smaller.')
      return
    }

    if (preview) URL.revokeObjectURL(preview)

    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setAnalysis(null)
    setDescription('')
    setReviewed(false)
    setError('')
  }

  async function analyzePhoto() {
    if (!file || !location.trim()) {
      setError('Please select a photo and enter the issue location.')
      return
    }

    setAnalyzing(true)
    setError('')
    setAnalysis(null)

    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch(`${API}/api/analyze-image`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
  },
  body: formData,
})
      const result = await response.json()

      if (!response.ok || !result.success || !result.analysis) {
        throw new Error(result.message || 'Gemma could not analyze the photo.')
      }

      const ai = result.analysis as AIAnalysis
      const mappedCategories: Record<string, string> = {
        'Roads & Potholes': 'Roads & Potholes',
        Garbage: 'Waste & Garbage',
        Streetlights: 'Streetlights',
        Drainage: 'Drainage & Water',
        'Water Supply': 'Drainage & Water',
        Other: 'Other',
      }

      setAnalysis(ai)
      setCategory(mappedCategories[ai.category] || 'Other')
      setDescription(ai.description)
      setReviewed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not analyze the photo.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function saveReport() {
    if (!token) {
      onOpenAuth('login')
      return
    }

    if (!file || !analysis || !location.trim() || !description.trim()) {
      setError('Please provide the photo, location, AI analysis, and description.')
      return
    }

    if (!reviewed) {
      setError('Please confirm that you have reviewed the report details.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('report', JSON.stringify({
        category,
        location: location.trim(),
        description: description.trim(),
        ai_description: analysis.description,
        priority: analysis.priority,
        priority_reason: analysis.priority_reason,
        evidence_feedback: analysis.evidence_feedback,
      }))

      const response = await fetch(`${API}/api/reports`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Could not save the report.')
      }

      setSubmitted(true)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the report.')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview('')
    setCategory('Roads & Potholes')
    setLocation('')
    setDescription('')
    setAnalysis(null)
    setReviewed(false)
    setSubmitted(false)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className="cf-report-section" id="report">
      <div className="cf-section-intro">
  <span className="cf-eyebrow">START A REPORT</span>

  <h2>
    Turn a concern into <em>action.</em>
  </h2>

  <p>
    Share what you see. Gemma AI will help you turn it into
    a clear, useful civic report.
  </p>

  <div className="cf-feature-list">
    <div className="cf-feature">
      <span className="cf-feature-icon">
        <Camera size={22} />
      </span>
      <div className="cf-feature-copy">
        <h3>Report with Photo</h3>
        <p>Capture the issue and add location details.</p>
      </div>
    </div>

    <div className="cf-feature">
      <span className="cf-feature-icon">
        <Sparkles size={22} />
      </span>
      <div className="cf-feature-copy">
        <h3>AI-Powered Analysis</h3>
        <p>Get category, description and priority suggestions.</p>
      </div>
    </div>

    <div className="cf-feature">
      <span className="cf-feature-icon">
        <ShieldCheck size={22} />
      </span>
      <div className="cf-feature-copy">
        <h3>Track &amp; Make an Impact</h3>
        <p>Your reports are reviewed by our team and help bring real change.</p>
      </div>
    </div>
  </div>

  <div className="cf-privacy">
    <ShieldCheck size={20} />
    <span>
      AI suggestions are reviewed by you before submission.
    </span>
  </div>
<div className="cf-support-cards">
  <div className="cf-support-card">
    <span className="cf-support-icon">
      <MapPin size={20} />
    </span>
    <div>
      <h3>Pin the Exact Location</h3>
      <p>Use GPS or move the map pin to identify the affected spot.</p>
    </div>
  </div>

  <div className="cf-support-card">
    <span className="cf-support-icon">
      <FileCheck2 size={20} />
    </span>
    <div>
      <h3>Professional Complaint</h3>
      <p>Gemma helps turn visible evidence into a formal complaint draft.</p>
    </div>
  </div>

  <div className="cf-support-card">
    <span className="cf-support-icon">
      <Clock3 size={20} />
    </span>
    <div>
      <h3>Track Your Report</h3>
      <p>Check your saved reports and their latest status in My Reports.</p>
    </div>
  </div>
  <div className="cf-support-card">
  <span className="cf-support-icon">
    <ShieldCheck size={20} />
  </span>
  <div>
    <h3>You Stay in Control</h3>
    <p>Review and edit AI-generated complaint details before submitting.</p>
  </div>
</div>

<div className="cf-support-card">
  <span className="cf-support-icon">
    <FileText size={20} />
  </span>
  <div>
    <h3>Your Reports, One Place</h3>
    <p>Find your saved reports and check their latest status in My Reports.</p>
  </div>
</div>
</div>
  
</div>

      <div className="cf-panel">
        {submitted ? (
          <div className="cf-success-state">
            <span className="cf-success-icon"><Check size={30} /></span>
            <h3>Your report has been saved!</h3>
            <p>Your report and photo were saved to the local CivicFix AI database and uploads folder.</p>
            <button className="cf-button cf-button-dark" onClick={resetForm}>
              Create another report <Plus size={17} />
            </button>
          </div>
        ) : (
          <>
            <div className="cf-panel-heading">
              <div>
                <span className="cf-step">REPORT DETAILS</span>
                <h3>Upload your issue</h3>
              </div>
              <span className="cf-local-pill">Gemma AI</span>
            </div>

            <div
              className={`cf-upload ${preview ? 'has-preview' : ''}`}
              role="button"
              tabIndex={0}
              aria-label="Select issue photo"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  inputRef.current?.click()
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                selectFile(event.dataTransfer.files[0])
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                hidden
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => selectFile(event.target.files?.[0])}
              />

              {preview ? (
                <>
                  <img src={preview} alt="Selected issue" className="cf-preview-image" />
                  <button
                    type="button"
                    className="cf-remove-photo"
                    aria-label="Remove photo"
                    onClick={(event) => {
                      event.stopPropagation()
                      if (preview) URL.revokeObjectURL(preview)
                      setFile(null)
                      setPreview('')
                      setAnalysis(null)
                      setDescription('')
                      setReviewed(false)
                      setError('')
                      if (inputRef.current) inputRef.current.value = ''
                    }}
                  >
                    <X size={17} />
                  </button>
                  <span className="cf-preview-name">{file?.name}</span>
                </>
              ) : (
                <>
                  <span className="cf-upload-icon"><Upload size={24} /></span>
                  <strong>Drop your photo here, or <u>browse</u></strong>
                  <span>JPG, PNG or WEBP · maximum 10 MB</span>
                </>
              )}
            </div>

            <div className="cf-form-grid">
              <label>
                Issue category
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  {categories.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>

              <label>
                Location or address
                <input
                  required
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="e.g. Kondhwa, Pune"
                />
              </label>
            </div>
<div className="cf-map-field">
  <div className="cf-map-field-heading">
    <strong>Pin the issue location</strong>
    <span>
      Use GPS or tap the map to select where the issue is located.
    </span>
  </div>

  <LocationPicker
  onLocationSelect={(latitude, longitude, address) => {
    const coordinates =
      `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

    setLocation(
      address
        ? `${address} | GPS: ${coordinates}`
        : `GPS coordinates: ${coordinates}`
    )
  }}
/>
</div>
            <label className="cf-full-field">
              Description
              <textarea
                rows={3}
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value)
                  setReviewed(false)
                }}
                placeholder="Gemma's suggested description will appear here. You can edit it."
              />
            </label>

            {analysis && (
              <div className="cf-analysis">
                <div className="cf-analysis-title"><Sparkles size={19} /> Gemma AI Analysis</div>
                <p><strong>Suggested category:</strong> {analysis.category}</p>
                <p><strong>Priority:</strong> <span className={`cf-priority ${analysis.priority.toLowerCase()}`}>{analysis.priority}</span></p>
                <p><strong>Why this priority?</strong> {analysis.priority_reason}</p>
                <p><strong>Visible evidence:</strong> {analysis.evidence_feedback}</p>
              </div>
            )}

            <label className="cf-review-check">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)}
              />
              <span>I reviewed the details and understand that AI output is a suggestion.</span>
            </label>

            {error && <p className="cf-error" role="alert">{error}</p>}

            <button
              type="button"
              className="cf-button cf-button-green cf-button-full"
              onClick={analyzePhoto}
              disabled={!file || !location.trim() || analyzing || saving}
            >
              {analyzing ? 'Analyzing photo…' : 'Analyze Photo with Gemma'}
              <Sparkles size={17} />
            </button>

            {analysis && (
              <button
                type="button"
                className="cf-button cf-button-dark cf-button-full"
                onClick={saveReport}
                disabled={saving || analyzing || !description.trim() || !location.trim() || !reviewed}
              >
                {saving ? 'Saving report and photo…' : 'Save Reviewed Report'}
                <FileCheck2 size={17} />
              </button>
            )}

            <p className="cf-form-note">
              <ShieldCheck size={15} /> Sign-in required. Your report is saved to your account.
            </p>
          </>
        )}
      </div>
    </section>
  )
}

export default function Page() {
  const [token, setToken] = useState('')
  const [account, setAccount] = useState<Account | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [reports, setReports] = useState<CivicReport[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [loadingReports, setLoadingReports] = useState(false)
  const [reportError, setReportError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)

    if (!savedToken) return

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok || !result.success) throw new Error('Session expired')
        setToken(savedToken)
        setAccount(result.user as Account)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
      })
  }, [])

  useEffect(() => {
    if (!token) {
      setReports([])
      return
    }

    let cancelled = false
    setLoadingReports(true)
    setReportError('')

    fetch(`${API}/api/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Could not load your reports.')
        }
        if (!cancelled) setReports(result.reports as CivicReport[])
      })
      .catch((err) => {
        if (!cancelled) {
          setReportError(err instanceof Error ? err.message : 'Could not load reports.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingReports(false)
      })

    return () => { cancelled = true }
  }, [token, refreshKey])

  function handleAuthenticated(newToken: string, newAccount: Account) {
  localStorage.setItem(TOKEN_KEY, newToken)
  setToken(newToken)
  setAccount(newAccount)
  setRefreshKey((value) => value + 1)

  // Return to the top of the landing page after successful login/signup.
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setAccount(null)
    setReports([])
    setReportError('')
  }

  const filteredReports = reports.filter((report) => {
    const text = `${report.category} ${report.location} ${report.description} ${report.ai_description} ${report.id}`.toLowerCase()
    const matchesSearch = text.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || report.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const inProgress = reports.filter((item) => item.status === 'In Progress').length
  const resolved = reports.filter((item) => item.status === 'Resolved').length
  const resolutionRate = reports.length
    ? Math.round((resolved / reports.length) * 100)
    : 0

  return (
    <div className="cf-app" id="home">
      <Header
        account={account}
        onOpenAuth={setAuthMode}
        onLogout={logout}
      />

      <main>
        <section className="cf-hero">
          <div className="cf-hero-copy">
            <span className="cf-eyebrow"><Sparkles size={14} /> BUILT FOR BETTER NEIGHBORHOODS</span>
            <h1>Make your city <em>better,</em> one report at a time.</h1>
            <p>
              Document issues in your neighborhood. CivicFix AI uses Gemma to help
              turn a photo and a few details into a clear civic report.
            </p>
            <div className="cf-hero-actions">
              <a className="cf-button cf-button-green" href={account ? '#report' : undefined}
                onClick={!account ? () => setAuthMode('login') : undefined}>
                Report an issue <ArrowUpRight size={17} />
              </a>
              <a className="cf-button cf-button-light" href="#how">
                See how it works <ArrowRight size={17} />
              </a>
            </div>
            <div className="cf-trust-line">
              <ShieldCheck size={19} /> AI suggestions are reviewed by you before submission.
            </div>
          </div>

          <div className="cf-hero-card">
            <div className="cf-hero-card-icon"><MapPin size={23} /></div>
            <span className="cf-card-kicker">FROM OBSERVATION TO ACTION</span>
            <h2>Better neighborhoods begin with clear reports.</h2>
            <div className="cf-demo-line"><span /> Photo evidence</div>
            <div className="cf-demo-line"><span /> Gemma AI assistance</div>
            <div className="cf-demo-line"><span /> Review and submit</div>
            <div className="cf-card-foot">
              <Sparkles size={16} /> Powered by local CivicFix AI backend
            </div>
          </div>
        </section>

        <section className="cf-how-section" id="how">
          <div className="cf-section-top">
            <span className="cf-eyebrow">HOW IT WORKS</span>
            <h2>From street-level <em>to city-level.</em></h2>
            <p>Three steps to record an issue and track your submission.</p>
          </div>

          <div className="cf-steps-grid">
            <article className="cf-step-card">
              <span className="cf-step-number">01</span>
              <Camera size={23} />
              <h3>Capture the issue</h3>
              <p>Take a clear photo and enter the location.</p>
            </article>
            <article className="cf-step-card featured">
              <span className="cf-step-number">02</span>
              <Sparkles size={23} />
              <h3>Get AI assistance</h3>
              <p>Gemma suggests a category, description, and priority.</p>
            </article>
            <article className="cf-step-card">
              <span className="cf-step-number">03</span>
              <FileCheck2 size={23} />
              <h3>Review and submit</h3>
              <p>Your report and photo are saved to your account.</p>
            </article>
          </div>
        </section>

        {account ? (
          <ReportForm
            token={token}
            onSaved={() => setRefreshKey((value) => value + 1)}
            onOpenAuth={setAuthMode}
          />
        ) : (
          <section className="cf-login-gate" id="report">
            <div className="cf-gate-icon"><ShieldCheck size={27} /></div>
            <span className="cf-eyebrow">ACCOUNT REQUIRED</span>
            <h2>Log in before submitting a report.</h2>
            <p>Create an account or log in first. Your reports will then be linked to your account so only you can see them in My Reports.</p>
            <div className="cf-hero-actions">
              <button className="cf-button cf-button-green" onClick={() => setAuthMode('login')}>
                <LogIn size={17} /> Log in
              </button>
              <button className="cf-button cf-button-dark" onClick={() => setAuthMode('signup')}>
                Create account <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}

        <section className="cf-dashboard-section" id="reports">
          <div className="cf-dashboard-heading">
            <div>
              <span className="cf-eyebrow">YOUR ACTIVITY</span>
              <h2>Keep an eye on <em>what matters.</em></h2>
              <p>
                {account
                  ? `Reports belonging to ${account.name}.`
                  : 'Log in to view the reports saved to your account.'}
              </p>
            </div>
            {account && (
              <a className="cf-button cf-button-dark" href="#report">
                <Plus size={17} /> New report
              </a>
            )}
          </div>

          {account ? (
            <>
              <div className="cf-stats-grid">
                <div className="cf-stat-card">
                  <span>Total reports</span>
                  <strong>{reports.length}</strong>
                  <small><FileText size={14} /> Your saved reports</small>
                </div>
                <div className="cf-stat-card">
                  <span>In progress</span>
                  <strong>{inProgress}</strong>
                  <small><Clock3 size={14} /> Being reviewed</small>
                </div>
                <div className="cf-stat-card">
                  <span>Resolved</span>
                  <strong>{resolved}</strong>
                  <small><Check size={14} /> {resolutionRate}% resolution rate</small>
                </div>
              </div>

              <div className="cf-report-list">
                <div className="cf-list-toolbar">
                  <label className="cf-search">
                    <Search size={17} />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search your reports"
                    />
                  </label>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="All">All statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {loadingReports ? (
                  <div className="cf-empty"><span className="cf-spinner" /> Loading your reports…</div>
                ) : reportError ? (
                  <div className="cf-empty cf-error">{reportError}</div>
                ) : filteredReports.length === 0 ? (
                  <div className="cf-empty">
                    <FileText size={27} />
                    <h3>No reports found</h3>
                    <p>Your submitted reports will appear here. Start by creating a report above.</p>
                    <a href="#report" className="cf-text-link">Create a report <ArrowRight size={15} /></a>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <article className="cf-report-row" key={report.id}>
                      <div className="cf-report-file"><FileText size={20} /></div>
                      <div className="cf-report-info">
                     <strong>{report.category}</strong>

<p
  className="cf-report-preview"
  title={report.description || report.ai_description || ''}
>
  {(() => {
    const text = report.description || report.ai_description || ''
    return text.length > 180
      ? `${text.slice(0, 180).trimEnd()}…`
      : text
  })()}
</p>
                        <span>
                          CF-{String(report.id).padStart(5, '0')} · {report.category} · {report.location}
                        </span>
                        <small>
                          Priority: {report.priority}
                          {report.photo_filename ? ' · Photo saved' : ''}
                        </small>
                      </div>
                      <StatusBadge status={report.status} />
                      <span className="cf-report-date">{dateLabel(report.created_at)}</span>
                    </article>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="cf-empty cf-empty-logged-out">
              <UserRound size={28} />
              <h3>Your reports, your account.</h3>
              <p>Sign in to see the reports you have submitted. Other users' reports are not shown here.</p>
              <button className="cf-button cf-button-dark" onClick={() => setAuthMode('login')}>
                Log in to My Reports <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="cf-footer">
        <div className="cf-brand">
          <span className="cf-brand-mark"><Leaf size={20} /></span>
          <span>CivicFix <em>AI</em></span>
        </div>
        <p>Built for communities that care.</p>
        <span className="cf-footer-note">
          Demonstration project. Reports are not automatically sent to municipal authorities.
        </span>
      </footer>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onAuthenticated={handleAuthenticated}
          onChangeMode={setAuthMode}
        />
      )}

      <style jsx global>{`
  :root {
    --cf-green: #218d6b;
    --cf-dark: #0d3b2f;
    --cf-ink: #14342b;
    --cf-muted: #73857e;
    --cf-border: #e0ebe5;
    --cf-pale: #f3f8f4;
  }

  html {
    scroll-behavior: smooth;
    scroll-padding-top: 90px;
  }

  body {
    margin: 0;
    background: #fff;
    color: var(--cf-ink);
  }

  .cf-app {
    min-height: 100vh;
    font-family: Arial, Helvetica, sans-serif;
  }

  /* HEADER */
  .cf-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.98);
    border-bottom: 1px solid #e0ebe5;
    box-shadow: 0 3px 14px rgba(13, 59, 47, 0.04);
    backdrop-filter: blur(14px);
  }

  .cf-header-inner {
    box-sizing: border-box;
    width: 100%;
    max-width: 1530px;
    min-height: 66px;
    margin: 0 auto;
    padding: 12px 4.5%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 24px;
  }

  .cf-header-inner > .cf-brand {
    justify-self: start;
  }

  .cf-brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: var(--cf-dark);
    text-decoration: none;
    font-weight: 800;
    font-size: 24px;
    letter-spacing: -0.8px;
    white-space: nowrap;
  }

  .cf-brand em {
    color: var(--cf-green);
    font-style: normal;
  }

  .cf-brand-mark {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    border-radius: 12px;
    background: var(--cf-dark);
    color: white;
  }

  /* CENTERED NAVIGATION */
  .cf-nav {
    display: flex;
    justify-self: center;
    align-items: center;
    gap: 16px;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .cf-nav a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    box-sizing: border-box;
    padding: 0 17px;
    border: 1px solid var(--cf-dark);
    border-radius: 10px;
    background: var(--cf-dark);
    color: #ffffff;
    text-decoration: none;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 700;
    transition:
      background 0.2s ease,
      border-color 0.2s ease,
      transform 0.2s ease;
  }

  .cf-nav a:hover {
    background: #185441;
    border-color: #185441;
    color: #ffffff;
    transform: translateY(-1px);
  }

  .cf-nav a:focus-visible,
  .cf-button:focus-visible,
  .cf-menu-button:focus-visible {
    outline: 3px solid #81c9aa;
    outline-offset: 3px;
  }

  /* RIGHT SIDE ACCOUNT ACTIONS */
  .cf-header-actions {
    display: flex;
    align-items: center;
    justify-self: end;
    gap: 12px;
  }

 .cf-account-name {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  box-sizing: border-box;
  padding: 0 16px;
  border: 1px solid var(--cf-dark);
  border-radius: 10px;
  background: var(--cf-dark);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.cf-account-name:hover {
  background-color: #185441;
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(13, 59, 47, 0.22);
}

  .cf-account-name svg {
    flex-shrink: 0;
    color: #ffffff;
  }

  .cf-login-link {
    border: 0;
    background: transparent;
    color: #64776f;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .cf-login-link:hover {
    color: var(--cf-green);
  }

  /* GENERAL BUTTONS */
  .cf-button {
    border: 0;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 42px;
    padding: 0 16px;
    text-decoration: none;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.15s, background 0.15s;
    font-family: inherit;
  }

  .cf-button:hover {
    transform: translateY(-1px);
  }

  .cf-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  .cf-button-dark {
    color: white;
    background: var(--cf-dark);
  }

  .cf-button-green {
    color: white;
    background: var(--cf-green);
  }

  .cf-button-light {
    color: var(--cf-dark);
    background: white;
    border: 1px solid var(--cf-border);
  }

  .cf-button-sm {
    min-height: 42px;
    padding: 0 16px;
    border-radius: 10px;
  }

  .cf-button-full {
    width: 100%;
    margin-top: 12px;
  }

  .cf-menu-button {
    display: none;
    background: transparent;
    border: 0;
    color: var(--cf-dark);
  }

  /* HERO */
  .cf-hero {
    padding: 74px 7% 82px;
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 8%;
    align-items: center;
    background: linear-gradient(120deg, #f4f9f5, #fbfdfb);
  }

  .cf-hero-copy {
    max-width: 670px;
  }

  .cf-eyebrow {
    color: var(--cf-green);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.7px;
  }

  .cf-hero h1 {
    font-size: clamp(42px, 5vw, 72px);
    line-height: 1.06;
    letter-spacing: -3px;
    font-weight: 600;
    margin: 22px 0;
  }

  .cf-hero h1 em,
  /* CivicFix AI — report introduction panel */
.cf-section-intro {
  box-sizing: border-box;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 30px 26px 0;
  border: 1px solid #d8eee3;
  border-radius: 24px;
  background: linear-gradient(155deg, #f9fdf9, #eff8f2 75%, #e3f4ea);
  box-shadow: 0 18px 45px rgba(13, 59, 47, 0.05);
}

.cf-feature-list {
  display: flex;
  flex-direction: column;
  gap: 19px;
  margin-top: 25px;
}

.cf-feature {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: start;
  gap: 13px;
}

.cf-feature-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #d8f1e5;
  color: #168662;
}

.cf-feature-copy h3 {
  margin: 3px 0 5px;
  color: #0d3b2f;
  font-size: 15px;
  line-height: 1.35;
}

.cf-feature-copy p {
  margin: 0;
  color: #6e8278;
  font-size: 12px;
  line-height: 1.55;
}

.cf-section-intro .cf-privacy {
  padding-top: 15px;
  border-top: 1px solid #dcece3;
  margin-top: 24px;
}

.cf-report-illustration {
  display: block;
  width: calc(100% + 52px);
  max-width: none;
  height: 300px;
  flex: 1 0 280px;
  min-height: 280px;
  margin: auto -26px 0;
  object-fit: cover;
  object-position: center 65%;
}

@media (max-width: 680px) {
  .cf-section-intro {
    padding: 24px 20px 0;
    border-radius: 18px;
  }

  .cf-feature-list {
    gap: 15px;
  }

  .cf-report-illustration {
    width: calc(100% + 40px);
    height: 190px;
    min-height: 190px;
    flex: 0 0 190px;
    margin-right: -20px;
    margin-left: -20px;
    object-position: center 65%;
  }
}
  .cf-section-intro h2 em,
  .cf-dashboard-heading h2 em,
  .cf-section-top h2 em {
    font-style: normal;
    color: var(--cf-green);
  }

  .cf-hero-copy > p {
    max-width: 560px;
    font-size: 18px;
    line-height: 1.75;
    color: var(--cf-muted);
  }

  .cf-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 26px;
  }

  .cf-trust-line {
    display: flex;
    gap: 9px;
    align-items: center;
    color: #63796f;
    margin-top: 28px;
    font-size: 13px;
  }

  .cf-trust-line svg {
    color: var(--cf-green);
    flex-shrink: 0;
  }

  .cf-hero-card {
    max-width: 460px;
    width: 100%;
    justify-self: center;
    padding: 36px;
    border: 1px solid #deebe3;
    border-radius: 26px;
    background: white;
    box-shadow: 0 25px 70px rgba(13, 59, 47, 0.08);
  }

  .cf-hero-card-icon {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    color: white;
    background: var(--cf-dark);
    border-radius: 17px;
    margin-bottom: 24px;
  }

  .cf-card-kicker {
    color: var(--cf-green);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
  }

  .cf-hero-card h2 {
    font-size: 27px;
    line-height: 1.25;
    margin: 12px 0 26px;
    letter-spacing: -0.8px;
  }

  .cf-demo-line {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 0;
    border-top: 1px solid #edf2ee;
    color: #536a60;
    font-size: 14px;
  }

  .cf-demo-line span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--cf-green);
  }

  .cf-card-foot {
    margin-top: 21px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--cf-green);
    font-size: 12px;
  }

  /* HOW IT WORKS */
  .cf-how-section,
  .cf-dashboard-section {
    padding: 76px 7%;
  }

  .cf-section-top {
    text-align: center;
    max-width: 700px;
    margin: 0 auto 40px;
  }

  .cf-section-top h2,
  .cf-dashboard-heading h2 {
    font-size: clamp(32px, 4vw, 49px);
    line-height: 1.13;
    letter-spacing: -1.8px;
    margin: 15px 0;
  }

  .cf-section-top p,
  .cf-dashboard-heading p {
    color: var(--cf-muted);
    line-height: 1.7;
  }

  .cf-steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    max-width: 1200px;
    margin: auto;
  }

  .cf-step-card {
    padding: 28px;
    border: 1px solid var(--cf-border);
    border-radius: 18px;
    background: #fff;
  }

  .cf-step-card > svg {
    color: var(--cf-green);
    margin-top: 25px;
  }

  .cf-step-number {
    float: right;
    color: #9bb2a7;
    font-weight: 800;
    letter-spacing: 1px;
    font-size: 13px;
  }

  .cf-step-card h3 {
    margin: 20px 0 8px;
    font-size: 20px;
  }

  .cf-step-card p {
    margin: 0;
    color: var(--cf-muted);
    line-height: 1.7;
    font-size: 14px;
  }

  .cf-step-card.featured {
    background: #f2f8f3;
    border-color: #d5e9dd;
  }

  /* REPORT SECTION */
  .cf-report-section {
    padding: 76px 7%;
    display: grid;
    grid-template-columns: 0.8fr 1.2fr;
    gap: 7%;
    background: var(--cf-pale);
    align-items: stretch;
  }

  .cf-section-intro h2 {
    font-size: clamp(36px, 4vw, 55px);
    line-height: 1.1;
    letter-spacing: -2px;
    margin: 18px 0;
  }

  .cf-section-intro > p {
    font-size: 17px;
    line-height: 1.75;
    color: var(--cf-muted);
  }

  .cf-privacy {
    display: flex;
    gap: 11px;
    align-items: flex-start;
    color: #6e8278;
    font-size: 13px;
    line-height: 1.6;
    margin-top: 32px;
  }

  .cf-privacy svg {
    color: var(--cf-green);
    flex-shrink: 0;
  }

  .cf-panel {
    min-width: 0;
    border: 1px solid #deebe3;
    border-radius: 20px;
    padding: 30px;
    background: white;
    box-shadow: 0 17px 46px rgba(13, 59, 47, 0.06);
  }

  .cf-panel-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 22px;
  }

  .cf-panel-heading h3 {
    margin: 8px 0 0;
    font-size: 23px;
  }

  .cf-step {
    color: var(--cf-green);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.4px;
  }

  .cf-local-pill {
    font-size: 11px;
    padding: 8px 11px;
    background: #edf8f1;
    border-radius: 999px;
    color: var(--cf-green);
    font-weight: 800;
  }

  .cf-map-field {
    margin-top: 18px;
  }

  .cf-map-field-heading {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 12px;
    color: #5c7067;
    font-size: 12px;
  }

  .cf-map-field-heading strong {
    color: var(--cf-ink);
    font-size: 14px;
  }

  .cf-map-field-heading span {
    line-height: 1.5;
    font-weight: 400;
  }

  .cf-upload {
    position: relative;
    min-height: 190px;
    border: 1.5px dashed #bcd7c8;
    border-radius: 15px;
    background: #f8fbf8;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 11px;
    text-align: center;
    cursor: pointer;
    overflow: hidden;
  }

  .cf-upload-icon {
    display: grid;
    place-items: center;
    height: 48px;
    width: 48px;
    border-radius: 15px;
    background: #e3f2e8;
    color: var(--cf-green);
  }

  .cf-upload strong {
    font-size: 14px;
    color: var(--cf-ink);
  }

  .cf-upload > span:not(.cf-upload-icon):not(.cf-preview-name) {
    color: #7f9188;
    font-size: 12px;
  }

  .cf-upload.has-preview {
    min-height: 235px;
    padding: 10px;
  }

  .cf-preview-image {
    display: block;
    max-height: 300px;
    max-width: 100%;
    border-radius: 10px;
    object-fit: contain;
  }

  .cf-preview-name {
    font-size: 12px;
    color: var(--cf-muted);
    max-width: 85%;
    overflow-wrap: anywhere;
  }

  .cf-remove-photo {
    position: absolute;
    right: 12px;
    top: 12px;
    border: 0;
    background: #fff;
    color: #943c3c;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: 0 2px 12px #0001;
  }

  .cf-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-top: 20px;
  }

  .cf-auth-form label,
  .cf-form-grid label,
  .cf-full-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: #5c7067;
    font-size: 12px;
    font-weight: 700;
  }

  .cf-form-grid input,
  .cf-form-grid select,
  .cf-full-field textarea,
  .cf-auth-form input {
    box-sizing: border-box;
    width: 100%;
    border: 1px solid #dae7df;
    border-radius: 10px;
    background: white;
    padding: 12px 13px;
    color: var(--cf-ink);
    font: inherit;
    font-size: 14px;
    outline: none;
  }

  .cf-form-grid input:focus,
  .cf-form-grid select:focus,
  .cf-full-field textarea:focus,
  .cf-auth-form input:focus {
    border-color: var(--cf-green);
    box-shadow: 0 0 0 3px #218d6b18;
  }

  .cf-full-field {
    margin-top: 18px;
  }

  .cf-full-field textarea {
    resize: vertical;
    line-height: 1.5;
  }

  .cf-review-check {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    margin: 17px 0;
    font-size: 12px;
    line-height: 1.5;
    color: #70847a;
  }

  .cf-review-check input {
    accent-color: var(--cf-green);
    margin-top: 3px;
  }

  .cf-analysis {
    background: #f5faf6;
    border: 1px solid #dcece1;
    border-radius: 13px;
    padding: 17px;
    margin-top: 18px;
    color: #526a5f;
    font-size: 13px;
    line-height: 1.65;
    overflow-wrap: anywhere;
  }

  .cf-analysis p {
    margin: 8px 0 0;
  }

  .cf-analysis-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
    font-size: 15px;
    color: var(--cf-dark);
  }

  .cf-priority {
    font-weight: 800;
  }

  .cf-priority.high {
    color: #bf4e3c;
  }

  .cf-priority.medium {
    color: #b77921;
  }

  .cf-priority.low {
    color: var(--cf-green);
  }

  .cf-form-note {
    color: #7b8f84;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 7px;
    line-height: 1.5;
  }

  .cf-form-note svg {
    flex-shrink: 0;
  }

  .cf-error {
    color: #a33333 !important;
    background: #fff4f3;
    border: 1px solid #f0d1ce;
    padding: 10px 12px;
    border-radius: 9px;
    font-size: 13px;
    line-height: 1.5;
  }

  .cf-success-state {
    min-height: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .cf-success-icon {
    display: grid;
    place-items: center;
    width: 65px;
    height: 65px;
    border-radius: 50%;
    color: #fff;
    background: var(--cf-green);
    margin-bottom: 20px;
  }

  .cf-success-state h3 {
    font-size: 25px;
    margin: 0;
  }

  .cf-success-state p {
    max-width: 400px;
    color: var(--cf-muted);
    line-height: 1.7;
    font-size: 14px;
  }

  /* MY REPORTS */
  .cf-dashboard-section {
    background: #fff;
  }

  .cf-dashboard-heading {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
    margin-bottom: 28px;
  }

  .cf-dashboard-heading h2 {
    margin-bottom: 8px;
  }

  .cf-dashboard-heading p {
    margin: 0;
  }

  .cf-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 17px;
    margin-bottom: 24px;
  }

  .cf-stat-card {
    border: 1px solid var(--cf-border);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .cf-stat-card > span {
    color: #74877d;
    font-size: 13px;
  }

  .cf-stat-card > strong {
    font-size: 36px;
    letter-spacing: -1px;
    color: var(--cf-dark);
  }

  .cf-stat-card > small {
    display: flex;
    gap: 7px;
    align-items: center;
    font-size: 11px;
    color: var(--cf-green);
    font-weight: 700;
  }

  .cf-report-list {
    border: 1px solid var(--cf-border);
    border-radius: 16px;
    overflow: hidden;
  }

  .cf-list-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding: 14px 19px;
    border-bottom: 1px solid var(--cf-border);
    background: #fafcfb;
  }

  .cf-search {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    color: #92a49a;
  }

  .cf-search input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    font: inherit;
    color: var(--cf-ink);
  }

  .cf-list-toolbar select {
    border: 1px solid var(--cf-border);
    border-radius: 8px;
    padding: 10px;
    background: white;
    color: #5d7066;
    font: inherit;
    font-size: 12px;
  }

  .cf-report-row {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 15px;
    padding: 17px 20px;
    border-bottom: 1px solid #edf2ee;
  }

  .cf-report-row:last-child {
    border-bottom: 0;
  }

  .cf-report-file {
    width: 44px;
    height: 44px;
    border-radius: 11px;
    background: #e7f3eb;
    display: grid;
    place-items: center;
    color: #648e78;
  }

  .cf-report-info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cf-report-info strong {
    color: var(--cf-ink);
    font-size: 14px;
    line-height: 1.5;
    overflow-wrap: anywhere;
    display: -webkit-box;
   -webkit-line-clamp: 2;
   -webkit-box-orient: vertical;
    overflow: hidden;
   }

  .cf-report-info > span,
  .cf-report-info > small,
  .cf-report-date {
    color: #83948c;
    font-size: 11px;
    line-height: 1.5;
  }

  .cf-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 9px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 10px;
    white-space: nowrap;
  }

  .cf-status.submitted {
    color: #387e91;
    background: #eaf5f8;
  }

  .cf-status.in-progress {
    color: #98671d;
    background: #fff5df;
  }

  .cf-status.resolved {
    color: #267354;
    background: #e7f7ed;
  }

  .cf-status.rejected {
    color: #a34444;
    background: #fff0f0;
  }

  .cf-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 55px 20px;
    text-align: center;
    color: #84968c;
    gap: 11px;
  }

  .cf-empty h3 {
    color: var(--cf-ink);
    margin: 0;
  }

  .cf-empty p {
    max-width: 460px;
    margin: 0;
    font-size: 13px;
    line-height: 1.7;
  }

  .cf-empty-logged-out {
    border: 1px solid var(--cf-border);
    border-radius: 18px;
  }

  .cf-text-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--cf-green);
    text-decoration: none;
    font-weight: 800;
    font-size: 13px;
    margin-top: 8px;
  }

  .cf-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #dcebe1;
    border-top-color: var(--cf-green);
    border-radius: 50%;
    animation: cf-spin 0.8s linear infinite;
  }

  @keyframes cf-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .cf-login-gate {
    margin: 75px auto;
    max-width: 760px;
    text-align: center;
    padding: 45px 25px;
    border: 1px solid var(--cf-border);
    border-radius: 20px;
  }

  .cf-gate-icon {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border-radius: 18px;
    background: #e8f5ec;
    color: var(--cf-green);
    margin: 0 auto 17px;
  }

  .cf-login-gate h2 {
    margin: 15px 0;
    font-size: 32px;
    letter-spacing: -1px;
  }

  .cf-login-gate p {
    max-width: 600px;
    margin: auto;
    color: var(--cf-muted);
    line-height: 1.7;
    font-size: 14px;
  }

  .cf-login-gate .cf-hero-actions {
    justify-content: center;
  }

  /* FOOTER */
  .cf-footer {
    padding: 30px 7%;
    border-top: 1px solid var(--cf-border);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
  }

  .cf-footer .cf-brand {
    font-size: 19px;
  }

  .cf-footer .cf-brand-mark {
    width: 34px;
    height: 34px;
    border-radius: 11px;
  }

  .cf-footer p {
    font-size: 13px;
    color: var(--cf-muted);
  }

  .cf-footer-note {
    width: 100%;
    color: #899a91;
    font-size: 11px;
    line-height: 1.6;
  }

  /* AUTH MODAL */
  .cf-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow-y: auto;
    background: rgba(5, 28, 21, 0.57);
    backdrop-filter: blur(5px);
  }

  .cf-auth-modal {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    max-width: 450px;
    border-radius: 22px;
    background: white;
    padding: 32px;
    box-shadow: 0 25px 90px #00190e38;
  }

  .cf-modal-close {
    position: absolute;
    right: 17px;
    top: 17px;
    display: grid;
    place-items: center;
    border: 0;
    background: #f1f6f2;
    color: var(--cf-dark);
    border-radius: 9px;
    width: 35px;
    height: 35px;
    cursor: pointer;
  }

  .cf-auth-logo {
    display: grid;
    place-items: center;
    width: 50px;
    height: 50px;
    border-radius: 15px;
    background: var(--cf-dark);
    color: white;
    margin-bottom: 19px;
  }

  .cf-auth-modal h2 {
    margin: 10px 0;
    font-size: 29px;
    letter-spacing: -1px;
  }

  .cf-muted {
    color: var(--cf-muted);
    font-size: 13px;
    line-height: 1.6;
  }

  .cf-auth-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 24px;
  }

  .cf-auth-form input {
    margin-top: 1px;
  }

  .cf-auth-switch {
    text-align: center;
    font-size: 12px;
    color: var(--cf-muted);
    margin-top: 20px;
  }

  .cf-auth-switch button {
    border: 0;
    background: transparent;
    color: var(--cf-green);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .cf-security-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #82948a;
    font-size: 11px;
    margin-bottom: 0;
  }

  /* TABLET */
  @media (max-width: 1100px) {
    .cf-header-inner {
      gap: 14px;
      padding-left: 3%;
      padding-right: 3%;
    }

    .cf-brand {
      font-size: 21px;
      gap: 8px;
    }

    .cf-brand-mark {
      width: 38px;
      height: 38px;
    }

    .cf-nav {
      gap: 9px;
    }

    .cf-nav a {
      padding: 0 12px;
      font-size: 13px;
    }

    .cf-header-actions {
      gap: 9px;
    }

    .cf-account-name {
      padding: 0 12px;
    }

    .cf-hero {
      padding: 55px 5%;
      gap: 4%;
    }

    .cf-hero h1 {
      letter-spacing: -2px;
    }

    .cf-report-section {
      padding: 55px 5%;
      gap: 30px;
    }

    .cf-how-section,
    .cf-dashboard-section {
      padding: 58px 5%;
    }
  }

  @media (max-width: 900px) {
    .cf-header-inner {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
    }

    .cf-nav {
      grid-column: 1 / -1;
      grid-row: 2;
    }

    .cf-header-actions {
      grid-column: 2;
      grid-row: 1;
    }

    .cf-account-name {
      display: none;
    }

    .cf-hero {
      grid-template-columns: 1fr;
      gap: 38px;
    }

    .cf-hero-card {
      max-width: 560px;
    }

    .cf-report-section {
      grid-template-columns: 1fr;
      gap: 30px;
    }
  }

  /* MOBILE */
  @media (max-width: 680px) {
    .cf-header-inner {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 5%;
      min-height: 54px;
    }

    .cf-brand {
      font-size: 20px;
      gap: 8px;
    }

    .cf-brand-mark {
      width: 36px;
      height: 36px;
    }

    .cf-header-actions {
      gap: 10px;
    }

    .cf-login-link {
      font-size: 13px;
    }

    .cf-header-actions .cf-button {
      padding: 0 11px;
      min-height: 38px;
      font-size: 12px;
    }

    .cf-menu-button {
      display: grid;
      place-items: center;
      padding: 8px;
      cursor: pointer;
    }

    .cf-nav {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 101;
      padding: 16px 5% 20px;
      background: #ffffff;
      border: 0;
      border-bottom: 1px solid var(--cf-border);
      box-shadow: 0 12px 20px rgba(13, 59, 47, 0.08);
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .cf-nav.open {
      display: flex;
    }

    .cf-nav a {
      width: 100%;
      min-height: 42px;
      padding: 0 16px;
      justify-content: flex-start;
      border-radius: 10px;
    }

    .cf-hero {
      display: block;
      padding: 49px 6% 55px;
    }

    .cf-hero h1 {
      font-size: 46px;
      letter-spacing: -2px;
    }

    .cf-hero-copy > p {
      font-size: 15px;
    }

    .cf-hero-card {
      box-sizing: border-box;
      margin-top: 39px;
      padding: 25px;
    }

    .cf-steps-grid {
      grid-template-columns: 1fr;
    }

    .cf-how-section,
    .cf-dashboard-section {
      padding: 48px 6%;
    }

    .cf-report-section {
      display: flex;
      flex-direction: column;
      padding: 49px 6%;
    }

    .cf-section-intro h2 {
      font-size: 41px;
    }

    .cf-panel {
      box-sizing: border-box;
      width: 100%;
      padding: 19px;
    }

    .cf-form-grid {
      grid-template-columns: 1fr;
    }

    .cf-stats-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .cf-stat-card {
      padding: 18px;
    }

    .cf-stat-card > strong {
      font-size: 30px;
    }

    .cf-dashboard-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .cf-report-row {
      grid-template-columns: 40px minmax(0, 1fr);
      gap: 11px;
      padding: 15px;
    }

    .cf-report-file {
      width: 39px;
      height: 39px;
    }

    .cf-report-row .cf-status {
      grid-column: 2;
      justify-self: start;
    }

    .cf-report-date {
      grid-column: 2;
    }

    .cf-list-toolbar {
      padding: 12px;
      flex-wrap: wrap;
    }

    .cf-list-toolbar select {
      max-width: 100%;
    }

    .cf-auth-modal {
      padding: 25px 21px;
    }

    .cf-footer {
      padding: 25px 6%;
    }

    .cf-footer p {
      width: 100%;
      margin: 0;
    }
  }
/* CivicFix left panel — clean feature cards */
.cf-report-section {
align-items: stretch !important;
}

.cf-section-intro {
  box-sizing: border-box;
  min-width: 0;
  min-height: 0 !important;
  height: auto;
  padding: 30px 26px !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cf-section-intro > .cf-eyebrow,
.cf-section-intro > h2,
.cf-section-intro > p,
.cf-section-intro .cf-feature-list,
.cf-section-intro .cf-privacy {
  max-width: 100% !important;
}

.cf-section-intro .cf-feature-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 22px;
}

.cf-section-intro .cf-feature {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 13px;
  padding: 14px;
  border: 1px solid #dcece3;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.78);
}

.cf-section-intro .cf-feature-icon {
  width: 44px;
  height: 44px;
}

.cf-section-intro .cf-feature-copy h3 {
  margin: 0 0 5px;
  font-size: 15px;
  line-height: 1.4;
}

.cf-section-intro .cf-feature-copy p {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
}

.cf-section-intro .cf-privacy {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #dcece3;
}

@media (max-width: 680px) {
  .cf-section-intro {
    padding: 24px 20px !important;
  }

  .cf-section-intro .cf-feature {
    padding: 12px;
  }
}
.cf-support-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: auto;
  padding-top: 28px;
}

.cf-support-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 13px;
  padding: 15px;
  border: 1px solid #dcece3;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.82);
}

.cf-support-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #dff3e8;
  color: #168662;
}

.cf-support-card h3 {
  margin: 0 0 5px;
  color: #14342b;
  font-size: 14px;
  line-height: 1.4;
}

.cf-support-card p {
  margin: 0;
  color: #73857e;
  font-size: 12px;
  line-height: 1.55;
}

@media (max-width: 680px) {
  .cf-support-cards {
    margin-top: 24px;
    padding-top: 0;
  }
}
  .cf-admin-login-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
  min-height: 48px;
  margin-top: 14px;
  padding: 12px 16px;
  border: 1px solid #dce8e0;
  border-radius: 10px;
  background: #f5faf6;
  color: var(--cf-dark);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease,
    transform 0.2s ease;
}

.cf-admin-login-link:hover {
  background: #e7f5ec;
  border-color: var(--cf-green);
  transform: translateY(-1px);
}
`}
</style>
    </div>
  )
}