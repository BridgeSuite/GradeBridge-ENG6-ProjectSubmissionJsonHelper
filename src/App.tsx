import { useState, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Member {
  name: string
  student_id: string
}

interface FormState {
  team_id: string
  members: Member[]
  track: string
  entry_point: string
  channel_url: string
  channel_id: string
  read_key: string
  youtube_url: string
  notes: string
}

interface MemberErrors {
  name?: string
  student_id?: string
}

interface Errors {
  team_id?: string
  members?: MemberErrors[]
  track?: string
  entry_point?: string
  channel_url?: string
  channel_id?: string
  read_key?: string
  youtube_url?: string
}

// ── Initial state ─────────────────────────────────────────────────────────────

const BLANK_MEMBER: Member = { name: '', student_id: '' }

const INITIAL: FormState = {
  team_id: '',
  members: [{ ...BLANK_MEMBER }, { ...BLANK_MEMBER }],
  track: '',
  entry_point: '',
  channel_url: '',
  channel_id: '',
  read_key: '',
  youtube_url: '',
  notes: '',
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(f: FormState): Errors {
  const e: Errors = {}

  if (!f.team_id.trim()) {
    e.team_id = 'Required.'
  } else if (!/^\d{2,3}$/.test(f.team_id.trim())) {
    e.team_id = 'Enter 2–3 digits, e.g. 07 or 14.'
  }

  const memberErrs: MemberErrors[] = f.members.map(m => {
    const me: MemberErrors = {}
    if (!m.name.trim()) me.name = 'Required.'
    if (!m.student_id.trim()) {
      me.student_id = 'Required.'
    } else if (!/^\d{9}$/.test(m.student_id.trim())) {
      me.student_id = 'Must be exactly 9 digits.'
    }
    return me
  })
  if (memberErrs.some(me => me.name || me.student_id)) e.members = memberErrs

  if (!f.track) e.track = 'Select a track.'

  if (!f.entry_point.trim()) {
    e.entry_point = 'Required.'
  } else if (f.entry_point.includes('/') || f.entry_point.includes('\\')) {
    e.entry_point = 'Filename only — no path. E.g. main.m, not code/main.m.'
  } else if (!/\.(m|mlapp)$/.test(f.entry_point.trim())) {
    e.entry_point = 'Must end in .m or .mlapp'
  }

  if (!f.channel_url.trim()) {
    e.channel_url = 'Required.'
  } else {
    try {
      const url = new URL(f.channel_url.trim())
      if (!url.hostname.includes('thingspeak.com')) e.channel_url = 'Must be a thingspeak.com URL.'
    } catch {
      e.channel_url = 'Not a valid URL.'
    }
  }

  if (!f.channel_id.trim()) {
    e.channel_id = 'Required.'
  } else if (!/^\d+$/.test(f.channel_id.trim())) {
    e.channel_id = 'Must be a whole number.'
  }

  if (!f.read_key.trim()) e.read_key = 'Required.'

  if (!f.youtube_url.trim()) {
    e.youtube_url = 'Required.'
  } else {
    try {
      const url = new URL(f.youtube_url.trim())
      if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtu.be')) {
        e.youtube_url = 'Must be a YouTube URL.'
      }
    } catch {
      e.youtube_url = 'Not a valid URL.'
    }
  }

  return e
}

function hasErrors(e: Errors): boolean {
  return !!(
    e.team_id ||
    e.track ||
    e.entry_point ||
    e.channel_url ||
    e.channel_id ||
    e.read_key ||
    e.youtube_url ||
    e.members?.some(m => m.name || m.student_id)
  )
}

// ── JSON builder ──────────────────────────────────────────────────────────────

function buildOutput(f: FormState) {
  const channelIdRaw = f.channel_id.trim()
  const channelIdNum = /^\d+$/.test(channelIdRaw) ? parseInt(channelIdRaw, 10) : null
  return {
    team_id: f.team_id.trim() ? `T${f.team_id.trim()}` : 'T??',
    members: f.members.map(m => ({
      name: m.name.trim() || 'First Last',
      student_id: m.student_id.trim() || '9????????',
    })),
    track: f.track || '?',
    entry_point: f.entry_point.trim() || 'main.m',
    thingspeak: {
      channel_url: f.channel_url.trim() || 'https://thingspeak.com/channels/...',
      channel_id: channelIdNum ?? 0,
      read_key: f.read_key.trim() || '...',
    },
    youtube_url: f.youtube_url.trim() || 'https://www.youtube.com/watch?v=...',
    notes: f.notes.trim(),
  }
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const set = useCallback(
    (field: keyof Omit<FormState, 'members'>, value: string) => {
      setForm(prev => ({ ...prev, [field]: value }))
      if (touched) setErrors(prev => ({ ...prev, [field]: undefined }))
    },
    [touched],
  )

  const setMember = useCallback((idx: number, field: keyof Member, value: string) => {
    setForm(prev => {
      const members = [...prev.members]
      members[idx] = { ...members[idx], [field]: value }
      return { ...prev, members }
    })
  }, [])

  const addMember = useCallback(() => {
    setForm(prev =>
      prev.members.length < 4 ? { ...prev, members: [...prev.members, { ...BLANK_MEMBER }] } : prev,
    )
  }, [])

  const removeMember = useCallback((idx: number) => {
    setForm(prev =>
      prev.members.length > 1
        ? { ...prev, members: prev.members.filter((_, i) => i !== idx) }
        : prev,
    )
  }, [])

  // Auto-extract channel_id when channel_url changes
  const setChannelUrl = useCallback(
    (url: string) => {
      setForm(prev => {
        const match = url.match(/channels\/(\d+)/)
        const autoId = match ? match[1] : prev.channel_id
        return { ...prev, channel_url: url, channel_id: autoId }
      })
      if (touched) setErrors(prev => ({ ...prev, channel_url: undefined, channel_id: undefined }))
    },
    [touched],
  )

  const preview = JSON.stringify(buildOutput(form), null, 2)

  const handleDownload = () => {
    setTouched(true)
    const errs = validate(form)
    setErrors(errs)
    if (hasErrors(errs)) return

    const json = JSON.stringify(buildOutput(form), null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'submission.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  const fe = (field: keyof Errors) => errors[field] as string | undefined
  const me = (i: number, f: keyof MemberErrors) => errors.members?.[i]?.[f]

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <span style={s.brand}>VeriQAI</span>
          <span style={s.appTitle}>ECE Emerge — Submission Helper</span>
        </div>
      </header>

      <main style={s.main}>
        {/* Intro */}
        <div style={s.intro}>
          Fill in the form and click <strong>Download submission.json</strong>. The file is
          validated before download. Upload it to Gradescope alongside your{' '}
          <code style={s.code}>code/</code> folder and <code style={s.code}>report.pdf</code>.
        </div>

        <div className="layout" style={s.layout}>
          {/* ── Form column ── */}
          <div style={s.formCol}>

            {/* Team */}
            <Card title="Team">
              <Field label="Team ID" error={fe('team_id')}>
                <div style={s.prefixRow}>
                  <span style={s.prefix}>T</span>
                  <input
                    style={{ ...input(!!fe('team_id')), borderRadius: '0 6px 6px 0', borderLeft: 'none' }}
                    value={form.team_id}
                    onChange={e => set('team_id', e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="07"
                    inputMode="numeric"
                    maxLength={3}
                  />
                </div>
              </Field>

              <Field label="Track" error={fe('track')}>
                <div style={s.radioRow}>
                  {(['A', 'B'] as const).map(t => (
                    <label key={t} style={s.radioLabel}>
                      <input
                        type="radio"
                        name="track"
                        value={t}
                        checked={form.track === t}
                        onChange={() => set('track', t)}
                        style={{ marginRight: 6 }}
                      />
                      Track {t}
                    </label>
                  ))}
                </div>
                {fe('track') && <div style={s.err}>{fe('track')}</div>}
              </Field>
            </Card>

            {/* Members */}
            <Card title={`Team Members (${form.members.length} of 4)`}>
              {form.members.map((m, i) => (
                <div key={i} style={s.memberBox}>
                  <div style={s.memberHead}>
                    <span style={s.memberNum}>Member {i + 1}</span>
                    {form.members.length > 1 && (
                      <button style={s.removeBtn} onClick={() => removeMember(i)}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={s.memberFields}>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>Full name</label>
                      <input
                        style={input(!!me(i, 'name'))}
                        value={m.name}
                        onChange={e => setMember(i, 'name', e.target.value)}
                        placeholder="First Last"
                      />
                      {me(i, 'name') && <div style={s.err}>{me(i, 'name')}</div>}
                    </div>
                    <div style={{ width: 160, flexShrink: 0 }}>
                      <label style={s.label}>Student ID</label>
                      <input
                        style={input(!!me(i, 'student_id'))}
                        value={m.student_id}
                        onChange={e => setMember(i, 'student_id', e.target.value)}
                        placeholder="912345678"
                        maxLength={9}
                        inputMode="numeric"
                      />
                      {me(i, 'student_id') && <div style={s.err}>{me(i, 'student_id')}</div>}
                    </div>
                  </div>
                </div>
              ))}
              {form.members.length < 4 && (
                <button style={s.addBtn} onClick={addMember}>
                  + Add team member
                </button>
              )}
            </Card>

            {/* Code */}
            <Card title="Code">
              <Field
                label="Entry point"
                hint="Filename only — no path. Must be inside your code/ folder."
                error={fe('entry_point')}
              >
                <input
                  style={input(!!fe('entry_point'))}
                  value={form.entry_point}
                  onChange={e => set('entry_point', e.target.value)}
                  placeholder="main.m"
                />
              </Field>
            </Card>

            {/* ThingSpeak */}
            <Card title="ThingSpeak">
              <Field label="Channel URL" error={fe('channel_url')}>
                <input
                  style={input(!!fe('channel_url'))}
                  value={form.channel_url}
                  onChange={e => setChannelUrl(e.target.value)}
                  placeholder="https://thingspeak.com/channels/1234567"
                  type="url"
                />
              </Field>
              <Field
                label="Channel ID"
                hint="Filled automatically from the URL above. Check it matches your channel settings."
                error={fe('channel_id')}
              >
                <input
                  style={{ ...input(!!fe('channel_id')), width: 180 }}
                  value={form.channel_id}
                  onChange={e => set('channel_id', e.target.value)}
                  placeholder="1234567"
                  inputMode="numeric"
                />
              </Field>
              <Field
                label="Read API key"
                hint="Read-only key from your channel's API Keys tab. Not your write key."
                error={fe('read_key')}
              >
                <input
                  style={input(!!fe('read_key'))}
                  value={form.read_key}
                  onChange={e => set('read_key', e.target.value)}
                  placeholder="XXXXXXXXXXXXXXXX"
                />
              </Field>
            </Card>

            {/* Video */}
            <Card title="Video">
              <Field
                label="YouTube URL"
                hint="Must be Unlisted — not Private. Private videos cannot be graded."
                error={fe('youtube_url')}
              >
                <input
                  style={input(!!fe('youtube_url'))}
                  value={form.youtube_url}
                  onChange={e => set('youtube_url', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  type="url"
                />
              </Field>
            </Card>

            {/* Notes */}
            <Card title="Notes (optional)">
              <textarea
                style={s.textarea}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Anything you want the grader to know…"
                rows={3}
              />
            </Card>

            {/* Download */}
            <button style={s.downloadBtn} onClick={handleDownload}>
              Download submission.json
            </button>

            {downloaded && !hasErrors(errors) && (
              <div style={s.successBanner}>
                ✓ submission.json downloaded. Upload it to Gradescope along with your{' '}
                <code style={s.code}>code/</code> folder and <code style={s.code}>report.pdf</code>.
              </div>
            )}

            {touched && hasErrors(errors) && (
              <div style={s.errorBanner}>
                Some fields need attention — see the highlighted errors above.
              </div>
            )}
          </div>

          {/* ── Preview column ── */}
          <div className="preview-col" style={s.previewCol}>
            <div style={s.previewLabel}>Live preview</div>
            <pre style={s.previewPre}>{preview}</pre>
            <div style={s.previewNote}>
              This is exactly what will be downloaded. Placeholders ({`?`}) appear for empty required fields.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={s.card}>
      <div style={s.cardTitle}>{title}</div>
      {children}
    </div>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {hint && <div style={s.hint}>{hint}</div>}
      {children}
      {error && <div style={s.err}>{error}</div>}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const input = (hasErr: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '8px 10px',
  border: `1.5px solid ${hasErr ? '#e53e3e' : '#cbd5e0'}`,
  borderRadius: 6,
  fontSize: 14,
  fontFamily: 'inherit',
  backgroundColor: hasErr ? '#fff5f5' : '#fff',
  outline: 'none',
  color: '#2d3748',
})

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', backgroundColor: '#f7fafc', fontSize: 14 },

  header: { backgroundColor: '#1a202c', padding: '12px 24px' },
  headerInner: { display: 'flex', alignItems: 'baseline', gap: 14, maxWidth: 1140, margin: '0 auto' },
  brand: { fontWeight: 700, fontSize: 15, letterSpacing: 1, color: '#a0aec0' },
  appTitle: { fontSize: 15, fontWeight: 500, color: '#fff' },

  main: { maxWidth: 1140, margin: '0 auto', padding: '24px 16px' },

  intro: {
    backgroundColor: '#ebf8ff',
    border: '1px solid #bee3f8',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 24,
    lineHeight: 1.6,
    color: '#2b6cb0',
  },
  code: { fontFamily: 'monospace', backgroundColor: '#dbeafe', padding: '1px 4px', borderRadius: 3 },

  layout: { display: 'flex', gap: 24, alignItems: 'flex-start' },
  formCol: { flex: 1, minWidth: 0 },

  previewCol: { width: 360, flexShrink: 0, position: 'sticky', top: 16 },
  previewLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#718096',
    marginBottom: 8,
  },
  previewPre: {
    margin: 0,
    backgroundColor: '#1a202c',
    color: '#68d391',
    borderRadius: 8,
    padding: '14px 16px',
    fontSize: 12,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
    overflowY: 'auto',
    maxHeight: '70vh',
  },
  previewNote: {
    fontSize: 11,
    color: '#a0aec0',
    marginTop: 6,
    lineHeight: 1.5,
  },

  card: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: 14,
    color: '#2d3748',
    paddingBottom: 10,
    marginBottom: 14,
    borderBottom: '1px solid #edf2f7',
  },

  field: { marginBottom: 14 },
  label: { display: 'block', fontWeight: 600, fontSize: 12, color: '#4a5568', marginBottom: 3 },
  hint: { fontSize: 12, color: '#718096', marginBottom: 4, lineHeight: 1.4 },
  err: { fontSize: 12, color: '#e53e3e', marginTop: 4 },

  radioRow: { display: 'flex', gap: 24, marginTop: 4 },
  radioLabel: { display: 'flex', alignItems: 'center', fontSize: 14, cursor: 'pointer', fontWeight: 500 },

  memberBox: {
    border: '1px solid #edf2f7',
    borderRadius: 6,
    padding: '12px 14px',
    marginBottom: 10,
    backgroundColor: '#f7fafc',
  },
  memberHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  memberNum: { fontWeight: 600, fontSize: 12, color: '#4a5568' },
  memberFields: { display: 'flex', gap: 12, alignItems: 'flex-start' },

  removeBtn: {
    fontSize: 12,
    color: '#e53e3e',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
  },
  addBtn: {
    width: '100%',
    padding: '7px 0',
    fontSize: 13,
    color: '#3182ce',
    background: 'none',
    border: '1.5px dashed #90cdf4',
    borderRadius: 6,
    cursor: 'pointer',
    marginTop: 4,
  },

  textarea: {
    width: '100%',
    padding: '8px 10px',
    border: '1.5px solid #cbd5e0',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'vertical',
    color: '#2d3748',
  },

  downloadBtn: {
    width: '100%',
    padding: '13px 0',
    backgroundColor: '#2b6cb0',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },

  successBanner: {
    marginTop: 12,
    padding: '10px 14px',
    backgroundColor: '#f0fff4',
    border: '1px solid #9ae6b4',
    borderRadius: 6,
    color: '#276749',
    fontSize: 13,
    lineHeight: 1.5,
  },
  errorBanner: {
    marginTop: 12,
    padding: '10px 14px',
    backgroundColor: '#fff5f5',
    border: '1px solid #feb2b2',
    borderRadius: 6,
    color: '#c53030',
    fontSize: 13,
  },

  prefixRow: { display: 'flex', alignItems: 'stretch' },
  prefix: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    backgroundColor: '#edf2f7',
    border: '1.5px solid #cbd5e0',
    borderRight: 'none',
    borderRadius: '6px 0 0 6px',
    fontWeight: 700,
    fontSize: 15,
    color: '#4a5568',
    userSelect: 'none',
  },
}
