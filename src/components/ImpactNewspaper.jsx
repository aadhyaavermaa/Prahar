
import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'

// ─── Leaderboard data ─────────────────────────────────────────────────────────

const LEADERBOARD = [
  { rank: 1, name: 'Green Earth Foundation', score: 95, volunteers: 30, zone: 'Yamuna Bank' },
  { rank: 2, name: 'LifeSave Trust',          score: 92, volunteers: 8,  zone: 'Dwarka' },
  { rank: 3, name: 'Clean Rivers India',      score: 89, volunteers: 20, zone: 'Najafgarh' },
  { rank: 4, name: 'Food For All India',      score: 78, volunteers: 15, zone: 'Rohini' },
  { rank: 5, name: 'Shelter India',           score: 74, volunteers: 12, zone: 'Mayur Vihar' },
]

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

// ─── Newspaper Component ──────────────────────────────────────────────────────

function NewspaperContent({ cards, paperRef }) {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const weekNum = Math.ceil((today - new Date(today.getFullYear(), 0, 1)) / 604800000)

  const scoreColor = (s) => s >= 85 ? '#166534' : s >= 70 ? '#92400e' : '#991b1b'
  const scoreBg   = (s) => s >= 85 ? '#dcfce7' : s >= 70 ? '#fef3c7' : '#fee2e2'

  return (
    <div
      ref={paperRef}
      style={{
        width: 794,
        background: '#faf8f0',
        fontFamily: '"Georgia", "Times New Roman", serif',
        color: '#1a1a1a',
        padding: '32px 36px 40px',
        boxSizing: 'border-box',
        backgroundImage: `
          radial-gradient(ellipse at top left, rgba(180,160,100,0.08) 0%, transparent 60%),
          radial-gradient(ellipse at bottom right, rgba(160,140,80,0.06) 0%, transparent 60%)
        `,
      }}
    >
      {/* ── Masthead ── */}
      <div style={{ textAlign: 'center', borderBottom: '3px double #2d2d2d', paddingBottom: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>
          Prahar · Environmental Intelligence
        </div>
        <div style={{
          fontSize: 52, fontWeight: 900, letterSpacing: -1, lineHeight: 1,
          fontFamily: '"Georgia", serif',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #3d2b00 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          The Impact Chronicle
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 10, color: '#666', letterSpacing: 1 }}>
          <span>VOL. 1 · ISSUE {weekNum}</span>
          <span style={{ fontStyle: 'italic', fontSize: 11 }}>REAL STORIES. REAL IMPACT.</span>
          <span>{dateStr.toUpperCase()}</span>
        </div>
      </div>

      {/* ── Headline ── */}
      <div style={{ textAlign: 'center', borderBottom: '1px solid #2d2d2d', paddingBottom: 10, marginBottom: 14 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: '8px 0 4px', letterSpacing: -0.5 }}>
          This Week's Impact Stories
        </h1>
        <div style={{ fontSize: 12, color: '#555', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span>✦</span>
          <span>Stories of change. Powered by people. Verified by AI.</span>
          <span>✦</span>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr', gap: 0, border: '1px solid #2d2d2d', marginBottom: 16 }}>
        {[
          { icon: '🌍', label: 'ZONES IMPROVED', value: '23', sub: 'Across Delhi NCR' },
          { icon: '♻️', label: 'WASTE CLEARED', value: '4,750 kg', sub: 'From rivers & public spaces' },
          { icon: '🧑‍🤝‍🧑', label: 'VOLUNTEERS DEPLOYED', value: '286', sub: 'Voices for change' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '10px 14px', borderRight: '1px solid #2d2d2d', textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: '#666', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: '#888', marginTop: 2, fontStyle: 'italic' }}>{s.sub}</div>
          </div>
        ))}
        {/* AI Quote */}
        <div style={{ padding: '10px 14px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 18, color: '#888', lineHeight: 1, marginBottom: 4 }}>"</div>
          <div style={{ fontSize: 10, fontStyle: 'italic', color: '#444', lineHeight: 1.5 }}>
            Small actions, when multiplied by millions of people, can transform the world.
          </div>
          <div style={{ fontSize: 9, color: '#888', marginTop: 4 }}>— CrisisConnect AI</div>
        </div>
      </div>

      {/* ── Top 3 Stories (3-col) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, border: '1px solid #2d2d2d', marginBottom: 0 }}>
        {cards.slice(0, 3).map((card, i) => (
          <div key={card.id} style={{ padding: '12px 14px', borderRight: i < 2 ? '1px solid #2d2d2d' : 'none' }}>
            {/* Domain tag */}
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: card.domainColor || '#555', marginBottom: 4 }}>
              {card.domainIcon} {card.domain}
            </div>
            {/* Date */}
            <div style={{ fontSize: 9, color: '#888', marginBottom: 6 }}>{card.date?.split('·')[0]?.trim()}</div>
            {/* Headline */}
            <h3 style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.3, margin: '0 0 8px', fontFamily: '"Georgia", serif' }}>
              {card.ngo} Drives Change at {card.zone?.split(',')[0]}
            </h3>
            {/* Location */}
            <div style={{ fontSize: 9, color: '#666', marginBottom: 8 }}>📍 {card.zone}</div>
            {/* Before/After images */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
              {[{ src: card.beforeImg, label: 'Before' }, { src: card.afterImg, label: 'After' }].map(({ src, label }) => (
                <div key={label} style={{ position: 'relative', borderRadius: 4, overflow: 'hidden' }}>
                  <img src={src} alt={label} crossOrigin="anonymous" style={{ width: '100%', height: 70, objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', top: 3, left: 3, background: label === 'After' ? '#166534' : 'rgba(0,0,0,0.65)', color: 'white', fontSize: 7, fontWeight: 700, padding: '1px 5px', borderRadius: 3, letterSpacing: 0.5 }}>
                    {label.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
            {/* Summary */}
            <p style={{ fontSize: 10, lineHeight: 1.6, color: '#333', margin: '0 0 8px' }}>
              {card.summary?.slice(0, 120)}{card.summary?.length > 120 ? '…' : ''}
            </p>
            {/* NGO byline */}
            <div style={{ fontSize: 9, color: '#666', marginBottom: 8 }}>By {card.ngo} ●</div>
            {/* Score */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: scoreBg(card.score), border: `1px solid ${scoreColor(card.score)}40`, borderRadius: 4, padding: '3px 8px' }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: scoreColor(card.score) }}>IMPACT SCORE</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: scoreColor(card.score) }}>{card.score}/100</span>
            </div>
            {/* Share */}
            <div style={{ marginTop: 8, fontSize: 9, color: '#888', letterSpacing: 1 }}>SHARE ≪</div>
          </div>
        ))}
      </div>

      {/* ── Bottom 2 Stories (2-col) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid #2d2d2d', borderTop: 'none', marginBottom: 16 }}>
        {cards.slice(3, 5).map((card, i) => (
          <div key={card.id} style={{ padding: '12px 14px', borderRight: i === 0 ? '1px solid #2d2d2d' : 'none' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: card.domainColor || '#555', marginBottom: 4 }}>
              {card.domainIcon} {card.domain}
            </div>
            <div style={{ fontSize: 9, color: '#888', marginBottom: 6 }}>{card.date?.split('·')[0]?.trim()}</div>
            <h3 style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.3, margin: '0 0 6px', fontFamily: '"Georgia", serif' }}>
              {card.ngo} Brings Hope to {card.zone?.split(',')[0]}
            </h3>
            <div style={{ fontSize: 9, color: '#666', marginBottom: 8 }}>📍 {card.zone}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
              {[{ src: card.beforeImg, label: 'Before' }, { src: card.afterImg, label: 'After' }].map(({ src, label }) => (
                <div key={label} style={{ position: 'relative', borderRadius: 4, overflow: 'hidden' }}>
                  <img src={src} alt={label} crossOrigin="anonymous" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', top: 3, left: 3, background: label === 'After' ? '#166534' : 'rgba(0,0,0,0.65)', color: 'white', fontSize: 7, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>
                    {label.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, lineHeight: 1.6, color: '#333', margin: '0 0 8px' }}>
              {card.summary?.slice(0, 160)}{card.summary?.length > 160 ? '…' : ''}
            </p>
            <div style={{ fontSize: 9, color: '#666', marginBottom: 8 }}>By {card.ngo} ●</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: scoreBg(card.score), border: `1px solid ${scoreColor(card.score)}40`, borderRadius: 4, padding: '3px 8px' }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: scoreColor(card.score) }}>IMPACT SCORE</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: scoreColor(card.score) }}>{card.score}/100</span>
              </div>
              <div style={{ fontSize: 9, color: '#888', letterSpacing: 1 }}>SHARE ≪</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Leaderboard ── */}
      <div style={{ border: '1px solid #2d2d2d', marginBottom: 16 }}>
        <div style={{ background: '#1a1a1a', color: '#faf8f0', padding: '6px 14px', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' }}>
          🏆 This Week's NGO Leaderboard
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
          {LEADERBOARD.map((entry, i) => (
            <div key={entry.rank} style={{ padding: '10px 12px', borderRight: i < 4 ? '1px solid #ddd' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 3 }}>{RANK_MEDALS[entry.rank] || `#${entry.rank}`}</div>
              <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.3, marginBottom: 3 }}>{entry.name}</div>
              <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>📍 {entry.zone}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: scoreColor(entry.score) }}>{entry.score}</div>
              <div style={{ fontSize: 8, color: '#888', letterSpacing: 0.5 }}>IMPACT SCORE</div>
              <div style={{ fontSize: 9, color: '#555', marginTop: 3 }}>👥 {entry.volunteers} volunteers</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer Quote ── */}
      <div style={{ borderTop: '2px double #2d2d2d', paddingTop: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontStyle: 'italic', color: '#333', marginBottom: 4 }}>
          " Together, we are not just making an impact, we are creating a legacy. "
        </div>
        <div style={{ fontSize: 9, color: '#888', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Prahar · Environmental Intelligence · prahar.in
        </div>
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function ImpactNewspaper({ cards, onClose }) {
  const paperRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!paperRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#faf8f0',
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `impact-chronicle-${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Download failed:', e)
      alert('Download failed. Try again.')
    }
    setDownloading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '20px 16px', overflowY: 'auto',
      animation: 'fade-in 0.2s ease',
    }}>
      {/* Controls */}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 2001,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: downloading ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white', fontWeight: 700, fontSize: 14,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: 8,
            minWidth: 160,
          }}
        >
          {downloading ? '⏳ Generating…' : '⬇️ Download PNG'}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            color: 'white', fontWeight: 600, fontSize: 13,
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Newspaper preview */}
      <div style={{
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 10,
        maxWidth: '100%',
      }}>
        <NewspaperContent cards={cards} paperRef={paperRef} />
      </div>

      <style>{`
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  )
}
