
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ImpactNewspaper from '../components/ImpactNewspaper'
import { useLang } from '../context/LanguageContext'

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_CARDS = [
  {
    id: 1,
    ngo: 'Green Earth Foundation',
    ngoBadge: '🏆 Impact Leader',
    zone: 'Yamuna Bank, Delhi',
    domain: 'Pollution',
    domainIcon: '🌫️',
    domainColor: '#64748b',
    date: 'Apr 16, 2026 · 7:00 AM',
    volunteers: 12,
    hours: 3,
    score: 87,
    summary: 'A team of 12 volunteers transformed a heavily polluted riverbank into a clean and safe zone within 3 hours, removing over 400 kg of plastic waste.',
    beforeImg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    afterImg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    tags: ['River Cleanup', 'Plastic Removal', 'Community'],
    wasteKg: 420,
    featured: true,
  },
  {
    id: 2,
    ngo: 'LifeSave Trust',
    ngoBadge: '⭐ Verified NGO',
    zone: 'Dwarka Sector 12, Delhi',
    domain: 'Medical',
    domainIcon: '🏥',
    domainColor: '#ef4444',
    date: 'Apr 15, 2026 · 10:30 AM',
    volunteers: 8,
    hours: 5,
    score: 92,
    summary: 'Emergency medical camp served 340 residents in an underserved colony. Free medicines, blood pressure checks, and diabetes screening were provided.',
    beforeImg: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
    afterImg: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
    tags: ['Medical Camp', 'Free Healthcare', 'Screening'],
    wasteKg: 0,
    featured: false,
  },
  {
    id: 3,
    ngo: 'Food For All India',
    ngoBadge: '🌟 Community Hero',
    zone: 'Rohini Block C, Delhi',
    domain: 'Food Relief',
    domainIcon: '🍲',
    domainColor: '#f59e0b',
    date: 'Apr 14, 2026 · 12:00 PM',
    volunteers: 20,
    hours: 4,
    score: 78,
    summary: '1,200 hot meals distributed to daily wage workers and their families affected by the recent flooding. Zero food wastage achieved through smart pre-planning.',
    beforeImg: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80',
    afterImg: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
    tags: ['Meal Distribution', 'Flood Relief', '1200 Served'],
    wasteKg: 0,
    featured: false,
  },
  {
    id: 4,
    ngo: 'Shelter India',
    ngoBadge: '🏅 Rapid Response',
    zone: 'Mayur Vihar Phase 2',
    domain: 'Shelter',
    domainIcon: '🏠',
    domainColor: '#8b5cf6',
    date: 'Apr 13, 2026 · 6:00 AM',
    volunteers: 15,
    hours: 6,
    score: 83,
    summary: '45 temporary shelters erected for flood-displaced families in under 6 hours. Each unit equipped with bedding, water, and emergency supplies.',
    beforeImg: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600&q=80',
    afterImg: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&q=80',
    tags: ['Emergency Shelter', 'Flood Response', '45 Families'],
    wasteKg: 0,
    featured: false,
  },
  {
    id: 5,
    ngo: 'Clean Rivers India',
    ngoBadge: '🏆 Impact Leader',
    zone: 'Najafgarh Lake, Delhi',
    domain: 'Flood',
    domainIcon: '🌊',
    domainColor: '#0ea5e9',
    date: 'Apr 12, 2026 · 8:00 AM',
    volunteers: 30,
    hours: 8,
    score: 95,
    summary: 'Largest single-day cleanup in Delhi NCR history. 30 volunteers cleared 1.2 tonnes of debris from Najafgarh Lake, restoring natural water flow.',
    beforeImg: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=600&q=80',
    afterImg: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600&q=80',
    tags: ['Lake Restoration', 'Record Cleanup', '1.2T Debris'],
    wasteKg: 1200,
    featured: true,
  },
]

const WEEK_STATS = [
  { icon: '🌍', label: 'Zones Improved', value: 23, suffix: '' },
  { icon: '♻️', label: 'Waste Cleared', value: 1820, suffix: ' kg' },
  { icon: '🧑‍🤝‍🧑', label: 'Volunteers', value: 347, suffix: '' },
  { icon: '❤️', label: 'Lives Impacted', value: 4200, suffix: '+' },
]

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = Date.now()
        const tick = () => {
          const elapsed = Date.now() - start
          const progress = Math.min(elapsed / duration, 1)
          const ease = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(ease * target))
          if (progress < 1) requestAnimationFrame(tick)
          else setCount(target)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }) {
  const color = score >= 85 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444'
  const bg = score >= 85 ? 'rgba(34,197,94,0.12)' : score >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 99,
      background: bg, border: `1px solid ${color}40`,
      boxShadow: `0 0 12px ${color}30`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', animation: 'glow-dot 2s ease-in-out infinite' }} />
      <span style={{ color, fontWeight: 800, fontSize: 12 }}>Impact Score: {score}/100</span>
    </div>
  )
}

// ─── Before/After Slider ──────────────────────────────────────────────────────

function BeforeAfterSlider({ before, after }) {
  const [pos, setPos] = useState(50)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef(null)

  const updatePos = (clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const p = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setPos(p)
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={() => setDragging(true)}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onMouseMove={e => dragging && updatePos(e.clientX)}
      onTouchMove={e => updatePos(e.touches[0].clientX)}
      style={{ position: 'relative', width: '100%', height: 200, cursor: 'ew-resize', userSelect: 'none', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}
    >
      {/* After (base) */}
      <img src={after} alt="After" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

      {/* Before (clipped) — use percentage width, not px */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pos}%`, overflow: 'hidden' }}>
        <img src={before} alt="Before" style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: containerRef.current ? containerRef.current.offsetWidth + 'px' : '100%', maxWidth: 'none', objectFit: 'cover' }} />
      </div>

      {/* Divider */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 2, background: 'white', boxShadow: '0 0 8px rgba(0,0,0,0.4)', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 30, height: 30, borderRadius: '50%',
          background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#374151',
        }}>⇔</div>
      </div>

      {/* Labels */}
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, letterSpacing: 1, pointerEvents: 'none' }}>BEFORE</div>
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(16,185,129,0.85)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, letterSpacing: 1, pointerEvents: 'none' }}>AFTER</div>
    </div>
  )
}

// ─── Impact Card ──────────────────────────────────────────────────────────────

function ImpactCard({ card, index, onClick }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const handleShare = (e) => {
    e.stopPropagation()
    const text = `🌍 ${card.ngo} made an impact at ${card.zone}!\n"${card.summary}"\n\nImpact Score: ${card.score}/100 ✨\n\n#Prahar #SocialImpact`
    if (navigator.share) {
      navigator.share({ title: 'Impact Story', text })
    } else {
      navigator.clipboard.writeText(text)
      alert('Copied to clipboard! Share it anywhere 🚀')
    }
  }

  return (
    <div
      ref={ref}
      onClick={() => onClick(card)}
      style={{
        background: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
        border: '1px solid rgba(0,0,0,0.06)',
        cursor: 'pointer',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${index * 80}ms`,
        transitionProperty: 'opacity, transform, box-shadow',
        breakInside: 'avoid',
        marginBottom: 16,
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.13)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)' }}
    >
      {/* Before/After */}
      <BeforeAfterSlider before={card.beforeImg} after={card.afterImg} />

      {/* Featured ribbon — inside card, overlaid on image */}
      {card.featured && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white', fontSize: 10, fontWeight: 800,
          padding: '3px 10px', borderRadius: 6, letterSpacing: 0.5,
          boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
          zIndex: 5,
        }}>⭐ FEATURED</div>
      )}

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* NGO + domain */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>{card.ngo}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{card.ngoBadge}</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: `${card.domainColor}15`, border: `1px solid ${card.domainColor}30`,
            borderRadius: 99, padding: '3px 10px',
          }}>
            <span style={{ fontSize: 12 }}>{card.domainIcon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: card.domainColor }}>{card.domain}</span>
          </div>
        </div>

        {/* Location + date */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>📍 {card.zone}</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>🕐 {card.date}</span>
        </div>

        {/* AI Summary */}
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
          {card.summary}
        </p>

        {/* Score */}
        <div style={{ marginBottom: 12 }}>
          <ScoreBadge score={card.score} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', background: '#f8fafc', padding: '3px 10px', borderRadius: 99, border: '1px solid #e2e8f0' }}>
            🙋 {card.volunteers} volunteers
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', background: '#f8fafc', padding: '3px 10px', borderRadius: 99, border: '1px solid #e2e8f0' }}>
            ⏱ {card.hours}h
          </span>
          {card.wasteKg > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', background: '#f8fafc', padding: '3px 10px', borderRadius: 99, border: '1px solid #e2e8f0' }}>
              ♻️ {card.wasteKg} kg
            </span>
          )}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {card.tags.map(t => (
            <span key={t} style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: 99 }}>#{t.replace(/ /g, '')}</span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); onClick(card) }}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
            }}
          >
            📖 View Story
          </button>
          <button
            onClick={handleShare}
            style={{
              padding: '8px 14px', borderRadius: 8,
              background: '#f8fafc', border: '1px solid #e2e8f0',
              color: '#475569', fontWeight: 600, fontSize: 12, cursor: 'pointer',
            }}
          >
            🔗 Share
          </button>
        </div>

        {/* Verified tag */}
        <div style={{ marginTop: 10, textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>
          ✅ Verified by AI • Real Impact Data
        </div>
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ card, onClose }) {
  if (!card) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'fade-in 0.2s ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 20,
        width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        animation: 'modal-up 0.25s ease',
      }}>
        <BeforeAfterSlider before={card.beforeImg} after={card.afterImg} />

        <div style={{ padding: '20px 24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>{card.ngo}</h2>
              <div style={{ fontSize: 13, color: '#64748b' }}>{card.ngoBadge} · {card.zone}</div>
            </div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, color: '#64748b', cursor: 'pointer', width: 36, height: 36, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          <ScoreBadge score={card.score} />

          <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: '16px 0' }}>{card.summary}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { icon: '🙋', label: 'Volunteers', value: card.volunteers },
              { icon: '⏱', label: 'Hours', value: `${card.hours}h` },
              { icon: '📅', label: 'Date', value: card.date.split('·')[0].trim() },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{value}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{label}</div>
              </div>
            ))}
          </div>

          {card.wasteKg > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>♻️</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#166534' }}>{card.wasteKg} kg</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Waste cleared from environment</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {card.tags.map(t => (
              <span key={t} style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', padding: '4px 12px', borderRadius: 99 }}>#{t.replace(/ /g, '')}</span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                const text = `🌍 ${card.ngo} made an impact at ${card.zone}!\n"${card.summary}"\n\nImpact Score: ${card.score}/100 ✨\n\n#Prahar #SocialImpact`
                navigator.clipboard?.writeText(text)
                alert('Copied! Share it anywhere 🚀')
              }}
              style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
            >
              🔗 Share This Story
            </button>
            <button onClick={onClose} style={{ padding: '12px 20px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose, onAdd }) {
  const [step, setStep] = useState(1) // 1=inputs, 2=story-review
  const [form, setForm] = useState({
    ngo: '', zone: '', domain: 'Pollution', customDomain: '',
    activity: '', people_impacted: '', volunteers: '',
    experience: '', challenge: '', memorable_moment: '',
  })
  const [description, setDescription] = useState('')
  const [beforeUrl, setBeforeUrl] = useState('')
  const [afterUrl, setAfterUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [aiUsed, setAiUsed] = useState(false)
  const [showOptional, setShowOptional] = useState(false)
  const [showRegenPanel, setShowRegenPanel] = useState(false)
  const [regenFeedback, setRegenFeedback] = useState('')
  const [regenOptions, setRegenOptions] = useState([])

  const BASE = 'http://localhost:8000'
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

  const callGemini = async (prompt) => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(GEMINI_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  }
  const REGEN_PRESETS = [
    'Make it more emotional',
    'Add more specific numbers',
    'Make it shorter and punchier',
    'Focus more on the human angle',
    'Make the opening stronger',
    'Add more context about the challenge',
    'Make the ending more inspiring',
    'Use a different tone',
  ]

  const effectiveDomain = form.domain === 'Other' ? (form.customDomain || 'Other') : form.domain

  const generateStory = async (feedback = '', previousStory = '') => {
    if (!form.ngo || !form.zone || !form.activity || !form.people_impacted) {
      alert('Please fill NGO name, zone, activity, and people impacted first.')
      return
    }
    setGenerating(true)
    setShowRegenPanel(false)

    const tones = ['warm and human', 'inspiring and energetic', 'grounded and factual', 'emotional and personal']
    const tone = tones[Math.floor(Math.random() * tones.length)]
    const isRegen = !!(feedback || previousStory)

    let prompt
    if (isRegen) {
      prompt = `You are a skilled social impact writer for an NGO platform called PRAHAR.
You previously wrote an impact story and the user wants it improved.

ORIGINAL INPUTS:
- NGO Name: ${form.ngo}
- Location/Zone: ${form.zone}
- Domain: ${effectiveDomain}
- Activity Done: ${form.activity}
- People Impacted: ${form.people_impacted}
- Volunteers Involved: ${form.volunteers || 'not specified'}
- Volunteer Experience: ${form.experience || 'not provided'}
- Challenge Faced: ${form.challenge || 'not provided'}
- Memorable Moment: ${form.memorable_moment || 'not provided'}

PREVIOUS STORY:
${previousStory || 'Not available'}

USER FEEDBACK / WHAT TO IMPROVE:
${feedback || 'Make it more engaging and different from the previous version'}

INSTRUCTIONS:
- Address the user's feedback DIRECTLY and visibly
- Keep all factual details accurate
- Make this version NOTICEABLY different from the previous story
- Writing style: ${tone}
- Total length: 120-180 words
- No section headers, no bullet points
- Sound authentic, not robotic
- Write only the story, nothing else`
    } else {
      prompt = `You are a skilled social impact writer for an NGO platform called PRAHAR.
Write a compelling, authentic impact story based on the following real inputs.

INPUTS:
- NGO Name: ${form.ngo}
- Location/Zone: ${form.zone}
- Domain: ${effectiveDomain}
- Activity Done: ${form.activity}
- People Impacted: ${form.people_impacted}
- Volunteers Involved: ${form.volunteers || 'not specified'}
- Volunteer Experience: ${form.experience || 'not provided'}
- Challenge Faced: ${form.challenge || 'not provided'}
- Memorable Moment: ${form.memorable_moment || 'not provided'}

WRITING STYLE: ${tone}

STORY STRUCTURE (write naturally, not as labeled sections):
1. Open with the situation BEFORE the activity (1-2 sentences)
2. Describe WHAT was done — specific actions (2-3 sentences)
3. Show the IMPACT with numbers and human angle (2 sentences)
4. Include an emotional moment if provided (1-2 sentences)
5. Close with a forward-looking line (1 sentence)

RULES:
- Total length: 120-180 words
- No robotic tone, no generic phrases like "making a difference"
- Use specific details from the inputs
- Do NOT use section headers or bullet points
- Write only the story, nothing else`
    }

    try {
      const story = await callGemini(prompt)
      setDescription(story)
      setAiUsed(true)
      setStep(2)
    } catch (err) {
      console.error('Gemini error:', err)
      // Feedback-aware fallback
      const fb = feedback.toLowerCase()
      let opening, closing
      if (fb.includes('emotional') || fb.includes('human')) {
        opening = `The streets of ${form.zone} told a story of neglect — until ${form.ngo} decided to act.`
        closing = 'For the families who witnessed it, this was more than a cleanup. It was hope.'
      } else if (fb.includes('short') || fb.includes('punchy')) {
        opening = `${form.ngo} showed up. ${form.zone} needed help. They delivered.`
        closing = `${form.people_impacted} lives changed. That's the whole story.`
      } else if (fb.includes('number') || fb.includes('specific')) {
        opening = `By 7 AM, ${form.volunteers || 'a team of volunteers'} had already gathered at ${form.zone}.`
        closing = `Final count: ${form.people_impacted} people reached, zero excuses made.`
      } else if (fb.includes('inspiring') || fb.includes('ending')) {
        opening = `In ${form.zone}, ${form.ngo} took on a challenge that many had ignored.`
        closing = `This is what ${form.people_impacted} people look like when someone finally shows up for them.`
      } else {
        opening = `In ${form.zone}, the situation demanded urgent attention.`
        closing = 'This is what community-driven impact looks like.'
      }
      const fallback = `${opening} ${form.ngo} stepped in with a focused ${effectiveDomain.toLowerCase()} initiative — ${form.activity.toLowerCase()}. The effort directly reached ${form.people_impacted} people${form.volunteers ? `, with ${form.volunteers} dedicated volunteers on the ground` : ''}. ${form.challenge ? 'The team faced real challenges: ' + form.challenge + '. ' : ''}${form.memorable_moment ? 'A moment that stood out: ' + form.memorable_moment + '. ' : ''}${closing}`
      setDescription(fallback)
      setAiUsed(false)
      setStep(2)
    } finally {
      setGenerating(false)
      setRegenFeedback('')
      setRegenOptions([])
    }
  }

  const handleRegenerate = () => setShowRegenPanel(true)

  const confirmRegenerate = () => {
    const combined = [
      ...regenOptions,
      regenFeedback.trim(),
    ].filter(Boolean).join('. ')
    generateStory(combined || 'Make it different and more engaging', description)
  }

  const toggleRegenOption = (opt) => {
    setRegenOptions(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    )
  }

  const handlePublish = async () => {
    if (!description.trim()) { alert('Story cannot be empty.'); return }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    const domainMap = {
      Pollution: { icon: '🌫️', color: '#64748b' },
      Medical: { icon: '🏥', color: '#ef4444' },
      'Food Relief': { icon: '🍲', color: '#f59e0b' },
      Shelter: { icon: '🏠', color: '#8b5cf6' },
      Flood: { icon: '🌊', color: '#0ea5e9' },
      Other: { icon: '🌐', color: '#10b981' },
    }
    const d = domainMap[form.domain] || { icon: '🌐', color: '#10b981' }
    onAdd({
      id: Date.now(),
      ngo: form.ngo,
      ngoBadge: '✅ Community Verified',
      zone: form.zone,
      domain: effectiveDomain,
      domainIcon: d.icon,
      domainColor: d.color,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · Just now',
      volunteers: parseInt(form.volunteers) || Math.floor(Math.random() * 10) + 3,
      hours: Math.floor(Math.random() * 5) + 1,
      score: Math.floor(Math.random() * 20) + 72,
      summary: description,
      beforeImg: beforeUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      afterImg: afterUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
      tags: [effectiveDomain, form.zone.split(',')[0], `${form.people_impacted} Impacted`].filter(Boolean),
      wasteKg: 0,
      featured: false,
    })
    setSubmitting(false)
    onClose()
  }

  const inp = (label, key, placeholder, type = 'text', required = false) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {type === 'textarea' ? (
        <textarea value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder} rows={2}
          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = '#10b981'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
      ) : (
        <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder} type={type}
          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = '#10b981'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
      )}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fade-in 0.2s ease' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', animation: 'modal-up 0.22s ease' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'white', zIndex: 2, borderRadius: '20px 20px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                {step === 1 ? '📤 Upload Impact Story' : '✏️ Review & Edit Story'}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
                {step === 1 ? 'Fill in details — AI will write the story for you' : 'Edit the AI-generated story or write your own'}
              </p>
            </div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, color: '#64748b', cursor: 'pointer', width: 32, height: 32, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: s <= step ? '#10b981' : '#e2e8f0', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>

        {/* Step 1 — Inputs */}
        {step === 1 && (
          <div style={{ padding: '18px 22px 22px' }}>
            <div style={{ gridColumn: '1/-1', marginBottom: 12 }}>{inp('NGO Name', 'ngo', 'e.g. Green Earth Foundation', 'text', true)}</div>
            <div style={{ marginBottom: 12 }}>{inp('Zone / Location', 'zone', 'e.g. Yamuna Bank, Delhi', 'text', true)}</div>

            {/* Domain with Other option */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Domain</label>
              <select value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: 'white' }}>
                {['Pollution', 'Medical', 'Food Relief', 'Shelter', 'Flood', 'Other'].map(d => <option key={d}>{d}</option>)}
              </select>
              {form.domain === 'Other' && (
                <input
                  value={form.customDomain}
                  onChange={e => setForm(p => ({ ...p, customDomain: e.target.value }))}
                  placeholder="e.g. Education, Animal Welfare, Women Empowerment..."
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #10b981', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginTop: 8 }}
                />
              )}
            </div>

            {inp('What activity was done?', 'activity', 'e.g. Cleaned 400kg plastic from riverbank, distributed 300 meals...', 'textarea', true)}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>{inp('People Impacted', 'people_impacted', 'e.g. 340', 'number', true)}</div>
              <div>{inp('Volunteers Involved', 'volunteers', 'e.g. 12', 'number')}</div>
            </div>

            <button onClick={() => setShowOptional(v => !v)}
              style={{ width: '100%', padding: '8px 0', background: 'none', border: '1.5px dashed #e2e8f0', borderRadius: 10, color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {showOptional ? '▲ Hide' : '▼ Add'} optional details (makes story richer)
            </button>

            {showOptional && (
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 14px 2px', marginBottom: 12, border: '1px solid #e2e8f0' }}>
                {inp('Your experience / feeling', 'experience', 'e.g. It was overwhelming to see so many people in need...')}
                {inp('Challenge faced', 'challenge', 'e.g. Heavy rain made it difficult but the team pushed through...')}
                {inp('Memorable moment', 'memorable_moment', 'e.g. An elderly woman thanked us with tears in her eyes...')}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Before Image URL</label>
                <input value={beforeUrl} onChange={e => setBeforeUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>After Image URL</label>
                <input value={afterUrl} onChange={e => setAfterUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <button onClick={() => generateStory()} disabled={generating}
              style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: generating ? 'wait' : 'pointer', fontWeight: 700, fontSize: 14, background: generating ? '#94a3b8' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', boxShadow: '0 4px 16px rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, transition: 'all 0.2s' }}>
              {generating ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Gemini is writing your story…
                </>
              ) : '✨ Generate Story with AI'}
            </button>

            <button onClick={() => { setDescription(''); setStep(2) }}
              style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              ✍️ Write my own story instead
            </button>
          </div>
        )}

        {/* Step 2 — Story Review & Edit */}
        {step === 2 && (
          <div style={{ padding: '18px 22px 22px' }}>
            {aiUsed && (
              <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', border: '1px solid #ddd6fe', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>✨</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#7c3aed' }}>AI-Generated by Gemini 1.5 Flash</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>You can edit this freely or rewrite it completely</div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Impact Story</label>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{description.length} chars</span>
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={8}
                placeholder="Write or edit your impact story here..."
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #10b981', borderRadius: 12, fontSize: 13, lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
              />
            </div>

            {/* Regenerate panel */}
            {!showRegenPanel ? (
              <button onClick={handleRegenerate} disabled={generating}
                style={{ width: '100%', padding: '9px 0', borderRadius: 10, background: 'none', border: '1.5px solid #7c3aed', color: '#7c3aed', fontWeight: 600, fontSize: 12, cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {generating ? '⏳ Regenerating…' : '🔄 Regenerate with AI'}
              </button>
            ) : (
              <div style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe', borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#7c3aed', marginBottom: 10 }}>🎯 What should the new story focus on?</div>

                {/* Quick preset chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {REGEN_PRESETS.map(opt => (
                    <button key={opt} onClick={() => toggleRegenOption(opt)}
                      style={{
                        padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                        background: regenOptions.includes(opt) ? '#7c3aed' : 'white',
                        color: regenOptions.includes(opt) ? 'white' : '#7c3aed',
                        borderColor: '#7c3aed',
                        transition: 'all 0.15s',
                      }}>
                      {opt}
                    </button>
                  ))}
                </div>

                {/* Custom feedback */}
                <textarea
                  value={regenFeedback}
                  onChange={e => setRegenFeedback(e.target.value)}
                  placeholder="Or type your own feedback... e.g. 'Focus more on the elderly residents who were helped'"
                  rows={2}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd6fe', borderRadius: 10, fontSize: 12, resize: 'none', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'white', marginBottom: 10 }}
                />

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowRegenPanel(false); setRegenFeedback(''); setRegenOptions([]) }}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={confirmRegenerate} disabled={generating}
                    style={{ flex: 2, padding: '8px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {generating ? (
                      <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Generating…</>
                    ) : '✨ Regenerate Now'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)}
                style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                ← Back
              </button>
              <button onClick={handlePublish} disabled={submitting || !description.trim()}
                style={{ flex: 2, padding: '11px 0', borderRadius: 12, border: 'none', cursor: submitting ? 'wait' : 'pointer', fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', boxShadow: '0 4px 16px rgba(16,185,129,0.3)', opacity: submitting || !description.trim() ? 0.6 : 1 }}>
                {submitting ? '⏳ Publishing…' : '🚀 Publish Impact Story'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ImpactShowcase() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [cards, setCards] = useState(DEMO_CARDS)
  const [selectedCard, setSelectedCard] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showNewspaper, setShowNewspaper] = useState(false)
  const [filter, setFilter] = useState('All')

  const domains = ['All', ...new Set(DEMO_CARDS.map(c => c.domain))]
  const filtered = filter === 'All' ? cards : cards.filter(c => c.domain === filter)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 40%, #faf5ff 100%)', position: 'relative' }}>

      {/* Grain overlay */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Hero Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #0f172a 100%)',
          padding: '48px 20px 56px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(139,92,246,0.06)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {/* Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 99, padding: '5px 14px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'glow-dot 1.5s ease-in-out infinite' }} />
              <span style={{ color: '#6ee7b7', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{t('impactWeek')}</span>
            </div>
            </div>

            <h1 style={{ color: 'white', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.15 }}>
              📰 This Week's Impact Stories
            </h1>

            {/* AI headline */}
            <div style={{
              background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
              padding: '12px 18px', marginBottom: 36, display: 'inline-block',
              maxWidth: 620,
            }}>
              <span style={{ color: '#a7f3d0', fontSize: 13, fontWeight: 600 }}>🤖 AI Insight: </span>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                Delhi witnessed a <strong style={{ color: '#6ee7b7' }}>23% improvement</strong> in river cleanliness this week, with record volunteer turnout across 5 critical zones.
              </span>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              {WEEK_STATS.map(({ icon, label, value, suffix }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
                  padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <span style={{ fontSize: 28 }}>{icon}</span>
                  <div>
                    <div style={{ color: 'white', fontWeight: 900, fontSize: 24, lineHeight: 1 }}>
                      <AnimatedCounter target={value} suffix={suffix} />
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {domains.map(d => (
              <button key={d} onClick={() => setFilter(d)} style={{
                padding: '6px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 12, transition: 'all 0.2s',
                background: filter === d ? '#10b981' : 'white',
                color: filter === d ? 'white' : '#475569',
                boxShadow: filter === d ? '0 2px 10px rgba(16,185,129,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                border: filter === d ? 'none' : '1px solid #e2e8f0',
              }}>{d}</button>
            ))}
          </div>

          {/* Upload button */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowNewspaper(true)} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #92400e, #78350f)',
              color: '#fef3c7', fontWeight: 700, fontSize: 13,
              boxShadow: '0 4px 14px rgba(120,53,15,0.35)',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              📰 News Article
            </button>
            <button onClick={() => setShowUpload(true)} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: 'white', fontWeight: 700, fontSize: 13,
              boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              📤 Upload Impact
            </button>
          </div>
        </div>

        {/* ── Masonry Grid ── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 60px' }}>
          <div style={{
            columns: 'auto 320px', columnGap: 20,
          }}>
            {filtered.map((card, i) => (
              <div key={card.id} style={{ breakInside: 'avoid', marginBottom: 0 }}>
                <ImpactCard card={card} index={i} onClick={setSelectedCard} />
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>No stories for this domain yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Floating newspaper side button */}
      <button
        onClick={() => setShowNewspaper(true)}
        style={{
          position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
          background: 'linear-gradient(180deg, #92400e, #78350f)',
          color: '#fef3c7', border: 'none', cursor: 'pointer',
          padding: '16px 10px', borderRadius: '12px 0 0 12px',
          writingMode: 'vertical-rl', textOrientation: 'mixed',
          fontWeight: 800, fontSize: 12, letterSpacing: 1.5,
          boxShadow: '-4px 0 20px rgba(120,53,15,0.3)',
          zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.paddingRight = '14px'}
        onMouseLeave={e => e.currentTarget.style.paddingRight = '10px'}
        title="View as Newspaper"
      >
        <span style={{ writingMode: 'horizontal-tb', fontSize: 18 }}>📰</span>
        <span>NEWS ARTICLE</span>
      </button>

      {/* Modals */}
      {selectedCard && <DetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onAdd={card => setCards(prev => [card, ...prev])} />}
      {showNewspaper && <ImpactNewspaper cards={cards} onClose={() => setShowNewspaper(false)} />}

      <style>{`
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes modal-up { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes glow-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
      `}</style>
    </div>
  )
}
