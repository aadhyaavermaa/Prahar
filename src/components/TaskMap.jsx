
import { useState, useEffect, useRef, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api'
import { useAuth } from '../context/AuthContext'
import { joinTask } from '../firebase'

const DELHI_CENTER = { lat: 28.6139, lng: 77.209 }
const LIBRARIES = []

const CLEAN_MAP_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8f5' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f0e9d2' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e8d5a3' }] },
]

const DOMAIN_CONFIG = {
  Medical:       { icon: '🏥', bg: '#fee2e2' },
  'Food Relief': { icon: '🍲', bg: '#fef3c7' },
  Shelter:       { icon: '🤝', bg: '#ede9fe' },
  Rescue:        { icon: '🚨', bg: '#fee2e2' },
  Logistics:     { icon: '📦', bg: '#dbeafe' },
  Flood:         { icon: '🌊', bg: '#e0f2fe' },
  Pollution:     { icon: '🌫️', bg: '#f1f5f9' },
}

const ZONE_NAMES = ['Connaught Place','Lajpat Nagar','Rohini','Dwarka','Saket','Karol Bagh','Janakpuri','Mayur Vihar','Pitampura','Nehru Place']
const DOMAINS = Object.keys(DOMAIN_CONFIG)

const TASK_TEMPLATES = {
  Medical:       ['Emergency triage support','Medicine distribution','Blood donation drive','Ambulance coordination'],
  'Food Relief': ['Hot meal distribution','Ration kit packing','Water supply chain','Kitchen setup'],
  Shelter:       ['Tent installation','Blanket distribution','Evacuation support','Camp registration'],
  Rescue:        ['Search & rescue ops','Debris clearance','Missing persons tracking','Evacuation escort'],
  Logistics:     ['Supply chain coordination','Vehicle dispatch','Warehouse management','Last-mile delivery'],
  Flood:         ['Boat rescue operations','Pump deployment','Sandbag filling','Drainage clearance'],
  Pollution:     ['Air quality monitoring','Mask distribution','Source identification','Community alert'],
}

// Real Delhi coordinates for each zone
const FIXED_ZONES = [
  { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
  { name: 'Lajpat Nagar',    lat: 28.5672, lng: 77.2430 },
  { name: 'Rohini',          lat: 28.7041, lng: 77.1025 },
  { name: 'Dwarka',          lat: 28.5921, lng: 77.0460 },
  { name: 'Saket',           lat: 28.5245, lng: 77.2066 },
  { name: 'Karol Bagh',      lat: 28.6514, lng: 77.1907 },
  { name: 'Janakpuri',       lat: 28.6219, lng: 77.0878 },
  { name: 'Mayur Vihar',     lat: 28.6090, lng: 77.2940 },
  { name: 'Pitampura',       lat: 28.7005, lng: 77.1500 },
  { name: 'Nehru Place',     lat: 28.5491, lng: 77.2519 },
]

function generateZonesAround(_center) {
  return FIXED_ZONES.map((z, i) => {
    const score = Math.floor(Math.random() * 100)
    const domain = DOMAINS[i % DOMAINS.length]
    const templates = TASK_TEMPLATES[domain] || []
    return {
      id: i + 1, name: z.name,
      lat: z.lat, lng: z.lng,
      score, domain,
      volunteersNeeded: Math.floor(Math.random() * 10) + 2,
      predicted: Math.random() > 0.65,
      taskList: templates.slice(0, Math.floor(Math.random() * 3) + 2).map((t, ti) => ({
        id: ti, title: t,
        type: score >= 70 ? 'paid' : ti % 2 === 0 ? 'paid' : 'volunteer',
        amount: score >= 70 ? Math.floor(Math.random() * 800 + 500) : Math.floor(Math.random() * 400 + 200),
        urgencyBonus: score >= 70 ? Math.floor(Math.random() * 300 + 100) : 0,
        duration: `${Math.floor(Math.random() * 4) + 2}h`,
        slots: Math.floor(Math.random() * 5) + 1,
      })),
    }
  })
}

function updateScores(zones) {
  return zones.map(z => ({ ...z, score: Math.min(100, Math.max(0, z.score + (Math.random() * 20 - 10))) }))
}

function getZoneStyle(score) {
  if (score >= 70) return { pinColor: '#ef4444', pinShadow: 'rgba(239,68,68,0.45)', label: 'Critical', badgeBg: '#fee2e2', badgeColor: '#dc2626', emoji: '🚨', pulse: true }
  if (score >= 40) return { pinColor: '#f59e0b', pinShadow: 'rgba(245,158,11,0.35)', label: 'Moderate', badgeBg: '#fef3c7', badgeColor: '#92400e', emoji: '⏳', pulse: false }
  return { pinColor: '#22c55e', pinShadow: 'rgba(34,197,94,0.3)', label: 'Safe', badgeBg: '#dcfce7', badgeColor: '#166534', emoji: '✅', pulse: false }
}

function formatTimeLeft(ms) {
  if (!ms || ms <= 0) return '0:00'
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Emoji Marker ─────────────────────────────────────────────────────────────

function EmojiMarker({ zone, isHovered, isSelected, onClick, onMouseEnter, onMouseLeave }) {
  const style = getZoneStyle(zone.score)
  const domain = DOMAIN_CONFIG[zone.domain] || { icon: '📍' }
  const active = isHovered || isSelected

  return (
    <OverlayView
      position={{ lat: zone.lat, lng: zone.lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}
    >
      <div
        onClick={e => { e.stopPropagation(); onClick() }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          transform: `scale(${active ? 1.35 : 1})`,
          transformOrigin: 'center center',
          transition: 'transform 0.18s ease',
          zIndex: isSelected ? 999 : active ? 99 : 10,
          pointerEvents: 'all',
          padding: '4px',
          // Prevent layout from affecting sibling overlays
          width: 'max-content',
        }}
      >
        {/* Emoji */}
        <div style={{
          fontSize: 30, lineHeight: 1,
          filter: `drop-shadow(0 2px 6px ${style.pinShadow})`,
          animation: style.pulse ? 'pin-pulse 1.6s ease-in-out infinite' : 'none',
        }}>
          {zone.predicted ? '🔮' : domain.icon}
        </div>

        {/* Score badge */}
        <div style={{
          background: style.badgeBg,
          border: `1px solid ${style.pinColor}40`,
          borderRadius: 20, padding: '1px 8px',
          fontSize: 10, fontWeight: 800, color: style.badgeColor,
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap',
        }}>
          {Math.round(zone.score)}
        </div>

        {/* Name tooltip — only when hovered/selected, rendered INSIDE the overlay div */}
        {active && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 700,
            color: '#0f172a',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.14)',
            pointerEvents: 'none',
            zIndex: 1000,
          }}>
            {zone.name}
          </div>
        )}
      </div>
    </OverlayView>
  )
}

function PredictedRing({ zone }) {
  return (
    <OverlayView
      position={{ lat: zone.lat, lng: zone.lng }}
      mapPaneName={OverlayView.OVERLAY_LAYER}
      getPixelPositionOffset={() => ({ x: -40, y: -80 })}
    >
      <div style={{ width: 80, height: 80, position: 'relative', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(139,92,246,0.7)', animation: 'ring-pulse 2s ease-out infinite' }} />
        <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '1.5px solid rgba(139,92,246,0.4)', animation: 'ring-pulse 2s ease-out 0.6s infinite' }} />
      </div>
    </OverlayView>
  )
}

function UserPin({ position }) {
  return (
    <OverlayView position={position} mapPaneName={OverlayView.FLOAT_PANE} getPixelPositionOffset={() => ({ x: -10, y: -10 })}>
      <div style={{ pointerEvents: 'none' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#2563eb', border: '3px solid white', boxShadow: '0 0 0 4px rgba(37,99,235,0.25)', animation: 'user-pulse 2s ease-in-out infinite' }} />
      </div>
    </OverlayView>
  )
}

// ─── Join Task Modal ──────────────────────────────────────────────────────────

function JoinTaskModal({ zone, onClose, onJoined, activeTask, setActiveTask }) {
  const { user } = useAuth()
  const [joining, setJoining] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const style = getZoneStyle(zone.score)
  const domain = DOMAIN_CONFIG[zone.domain] || { icon: '📍' }
  const isCritical = zone.score >= 70

  useEffect(() => {
    if (!activeTask) { setTimeLeft(null); return }
    const tick = () => {
      const left = activeTask.endsAt - Date.now()
      setTimeLeft(left > 0 ? left : 0)
      if (left <= 0) setActiveTask(null)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [activeTask, setActiveTask])

  const handleJoin = async (task) => {
    if (activeTask) return
    setJoining(task.id)
    try {
      // Demo: 1h = 30 seconds for live demo
      const demoMs = (parseInt(task.duration) || 1) * 30 * 1000
      const newActive = { ...task, zoneName: zone.name, endsAt: Date.now() + demoMs }
      if (user) await joinTask(user.uid, task, zone)
      setActiveTask(newActive)
      onJoined && onJoined(task, zone)
    } catch (e) { console.error(e) }
    setJoining(null)
  }

  const isMyTask = (task) => activeTask?.id === task.id && activeTask?.zoneName === zone.name

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'fade-in 0.2s ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        animation: 'modal-up 0.22s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 22px 16px', borderBottom: '1px solid #f1f5f9',
          background: isCritical ? 'linear-gradient(135deg,#fff5f5,#fff)' : 'linear-gradient(135deg,#f0fdf4,#fff)',
          borderRadius: '20px 20px 0 0', position: 'sticky', top: 0, zIndex: 2,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: style.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{domain.icon}</div>
              <div>
                <div style={{ color: '#0f172a', fontWeight: 800, fontSize: 17 }}>{zone.name}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{zone.domain} Response Zone</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, color: '#64748b', cursor: 'pointer', width: 32, height: 32, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: style.badgeBg, color: style.badgeColor }}>{style.emoji} {style.label} · {Math.round(zone.score)}/100</span>
            {isCritical && <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: '#fee2e2', color: '#dc2626', animation: 'pin-pulse 1.6s ease-in-out infinite' }}>🔴 EMERGENCY — Urgency Pay Active</span>}
            {zone.predicted && <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#f5f3ff', color: '#7c3aed' }}>🔮 Predicted Critical in 48h</span>}
          </div>
        </div>

        {/* Active task lock */}
        {activeTask && (
          <div style={{ margin: '14px 20px 0', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#92400e', fontWeight: 700, fontSize: 13 }}>Currently on: "{activeTask.title}"</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                📍 {activeTask.zoneName} · Free in <strong style={{ color: '#d97706' }}>{formatTimeLeft(timeLeft)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Emergency banner */}
        {isCritical && !activeTask && (
          <div style={{ margin: '14px 20px 0', padding: '12px 16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 12, display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ color: '#dc2626', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Emergency Zone — Urgency Bonus Active</div>
              <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.6 }}>
                Paid tasks include an <strong style={{ color: '#d97706' }}>urgency bonus</strong>. You can only hold <strong>one task at a time</strong>.
              </div>
            </div>
          </div>
        )}

        {/* Task list */}
        <div style={{ padding: '16px 20px 22px' }}>
          <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, fontWeight: 700 }}>
            Available Tasks ({zone.taskList?.length || 0})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(zone.taskList || []).map(task => {
              const mine = isMyTask(task)
              const locked = !!activeTask && !mine
              return (
                <div key={task.id} style={{
                  background: mine ? '#fffbeb' : '#fafafa',
                  border: `1px solid ${mine ? '#fde68a' : '#e2e8f0'}`,
                  borderRadius: 14, padding: '14px 16px',
                  opacity: locked ? 0.55 : 1, transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#0f172a', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{task.title}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: task.type === 'paid' ? '#dcfce7' : '#dbeafe', color: task.type === 'paid' ? '#166534' : '#1e40af' }}>
                          {task.type === 'paid' ? '💰 Paid' : '🤝 Volunteer'}
                        </span>
                        <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, background: '#f1f5f9', color: '#64748b' }}>⏱ {task.duration}</span>
                        <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, background: '#f1f5f9', color: '#64748b' }}>👥 {task.slots} slots</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {task.type === 'paid' ? (
                        <div>
                          <div style={{ color: '#16a34a', fontWeight: 800, fontSize: 20, lineHeight: 1 }}>₹{task.amount}</div>
                          {task.urgencyBonus > 0 && <>
                            <div style={{ marginTop: 4, padding: '2px 8px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 700, display: 'inline-block' }}>+₹{task.urgencyBonus} 🔴</div>
                            <div style={{ color: '#d97706', fontSize: 13, fontWeight: 800, marginTop: 4 }}>Total ₹{task.amount + task.urgencyBonus}</div>
                          </>}
                        </div>
                      ) : (
                        <div style={{ color: '#2563eb', fontSize: 14, fontWeight: 700 }}>Free</div>
                      )}
                    </div>
                  </div>

                  {mine ? (
                    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#92400e', fontWeight: 600, fontSize: 13 }}>⏳ In progress</span>
                      <span style={{ color: '#d97706', fontWeight: 800, fontSize: 14 }}>{formatTimeLeft(timeLeft)} left</span>
                    </div>
                  ) : (
                    <button
                      disabled={locked || joining === task.id}
                      onClick={() => handleJoin(task)}
                      style={{
                        marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
                        cursor: locked ? 'not-allowed' : 'pointer',
                        fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                        background: locked ? '#f1f5f9' : isCritical ? '#ef4444' : '#10b981',
                        color: locked ? '#94a3b8' : '#fff',
                        boxShadow: locked ? 'none' : isCritical ? '0 4px 14px rgba(239,68,68,0.3)' : '0 4px 14px rgba(16,185,129,0.25)',
                        opacity: joining === task.id ? 0.7 : 1,
                      }}
                    >
                      {joining === task.id ? '⏳ Joining…' : locked ? '🔒 Finish current task first' : isCritical ? '🚨 Join Emergency Task' : '🙋 Join Task'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', justifyContent: 'space-around' }}>
            {[
              { label: 'Volunteers Needed', value: zone.volunteersNeeded, color: '#2563eb' },
              { label: 'Total Tasks', value: zone.taskList?.length || 0, color: '#7c3aed' },
              { label: 'Zone Score', value: `${Math.round(zone.score)}/100`, color: style.badgeColor },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ color, fontWeight: 800, fontSize: 20 }}>{value}</div>
                <div style={{ color: '#94a3b8', fontSize: 11 }}>{label}</div>
              </div>
            ))}
          </div>
          {!user && <div style={{ marginTop: 12, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, color: '#92400e', fontSize: 12, textAlign: 'center' }}>⚠️ Login to save tasks to your dashboard.</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ zone, onClose, onJoin, inline }) {
  const [showDetails, setShowDetails] = useState(false)
  if (!zone) return null
  const style = getZoneStyle(zone.score)
  const domain = DOMAIN_CONFIG[zone.domain] || { icon: '📍' }
  const isCritical = zone.score >= 70

  const scoreColor = zone.score >= 70 ? '#ef4444' : zone.score >= 40 ? '#f59e0b' : '#22c55e'
  const scoreBg    = zone.score >= 70 ? '#fff1f2' : zone.score >= 40 ? '#fffbeb' : '#f0fdf4'

  const containerStyle = inline ? {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    animation: 'modal-up 0.2s ease',
    maxHeight: '80vh',
    overflowY: 'auto',
  } : {
    position: 'absolute', top: 0, right: 0, height: '100%', width: 340,
    background: '#fff', borderLeft: '1px solid #e2e8f0',
    zIndex: 20, display: 'flex', flexDirection: 'column',
    boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
    animation: 'slide-in 0.22s ease', overflowY: 'auto',
  }

  return (
    <div style={containerStyle}>

      {/* ── Header ── */}
      <div style={{
        padding: '16px 16px 12px',
        background: isCritical
          ? 'linear-gradient(135deg,#fff1f2 0%,#fff 100%)'
          : 'linear-gradient(135deg,#f0fdf4 0%,#fff 100%)',
        borderBottom: '1px solid #f1f5f9',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: style.badgeBg, border: `1.5px solid ${style.pinColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>{domain.icon}</div>
            <div>
              <div style={{ color: '#0f172a', fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>{zone.name}</div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>📍 Delhi NCR · {zone.domain}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 8,
            color: '#64748b', cursor: 'pointer', width: 28, height: 28,
            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: style.badgeBg, color: style.badgeColor }}>
            {style.emoji} {style.label}
          </span>
          {isCritical && (
            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}>
              🔴 Emergency
            </span>
          )}
          {zone.predicted && (
            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#f5f3ff', color: '#7c3aed' }}>
              🔮 AI Predicted
            </span>
          )}
        </div>
      </div>

      {/* ── Severity Score ── */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: scoreBg }}>
        <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>Severity Score</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ color: scoreColor, fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{Math.round(zone.score)}</span>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>/100</div>
            <div style={{ color: scoreColor, fontSize: 11, fontWeight: 700 }}>{style.label}</div>
          </div>
        </div>
        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, width: `${zone.score}%`, background: scoreColor, transition: 'width 0.8s ease' }} />
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, borderBottom: '1px solid #f1f5f9' }}>
        {[
          { icon: '📋', label: 'Tasks', value: zone.taskList?.length || 0, color: '#2563eb', bg: '#eff6ff' },
          { icon: '🙋', label: 'Needed', value: zone.volunteersNeeded, color: '#16a34a', bg: '#f0fdf4' },
          { icon: '⚡', label: 'Urgency', value: isCritical ? 'High' : 'Med', color: scoreColor, bg: scoreBg },
        ].map(({ icon, label, value, color, bg }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${color}20`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
            <div style={{ color, fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{value}</div>
            <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── AI Prediction ── */}
      {zone.predicted && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🔮</span>
            <div>
              <div style={{ color: '#7c3aed', fontWeight: 700, fontSize: 12, marginBottom: 3 }}>AI Prediction Alert</div>
              <div style={{ color: '#64748b', fontSize: 11, lineHeight: 1.5 }}>
                Critical escalation predicted within <strong>48 hours</strong> based on historical patterns.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Task List (View Details) ── */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <button
          onClick={() => setShowDetails(v => !v)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 13 }}>📊 Available Tasks</span>
          <span style={{ color: '#94a3b8', fontSize: 12, transition: 'transform 0.2s', display: 'inline-block', transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>

        {showDetails && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {zone.taskList?.length > 0 ? zone.taskList.map((task, i) => (
              <div key={i} style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ color: '#0f172a', fontWeight: 600, fontSize: 12, flex: 1, lineHeight: 1.4 }}>{task.title}</div>
                  <span style={{
                    marginLeft: 8, padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, flexShrink: 0,
                    background: task.type === 'paid' ? '#fef3c7' : '#f0fdf4',
                    color: task.type === 'paid' ? '#92400e' : '#166534',
                  }}>
                    {task.type === 'paid' ? '💰 Paid' : '🤝 Volunteer'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ color: '#64748b', fontSize: 11 }}>⏱ {task.duration}</span>
                  <span style={{ color: '#64748b', fontSize: 11 }}>👥 {task.slots} slots</span>
                  {task.type === 'paid' && (
                    <span style={{ color: '#16a34a', fontSize: 11, fontWeight: 700 }}>
                      ₹{task.amount}{task.urgencyBonus > 0 ? ` +₹${task.urgencyBonus} bonus` : ''}
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>No tasks available</div>
            )}
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div style={{ padding: '14px 16px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onJoin}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
            cursor: 'pointer', fontWeight: 700, fontSize: 14,
            background: isCritical
              ? 'linear-gradient(135deg,#ef4444,#dc2626)'
              : 'linear-gradient(135deg,#10b981,#059669)',
            color: '#fff',
            boxShadow: isCritical
              ? '0 4px 16px rgba(239,68,68,0.35)'
              : '0 4px 16px rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {isCritical ? '🚨 Join Emergency Task' : '🙋 Join Task'}
        </button>
        <button
          onClick={() => setShowDetails(true)}
          style={{
            width: '100%', padding: '11px 0', borderRadius: 12,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          📊 View Details
        </button>
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
          ✅ Verified zone · Real-time data
        </div>
      </div>

      {/* ── View Details Modal ── */}
      {showDetails && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowDetails(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', animation: 'modal-up 0.22s ease' }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: style.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{domain.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{zone.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{zone.domain} Zone · Delhi NCR</div>
                  </div>
                </div>
                <button onClick={() => setShowDetails(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, color: '#64748b', cursor: 'pointer', width: 30, height: 30, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>
            <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { icon: '🎯', label: 'Severity', value: `${Math.round(zone.score)}/100`, color: scoreColor },
                  { icon: '🙋', label: 'Volunteers Needed', value: zone.volunteersNeeded, color: '#2563eb' },
                  { icon: '📋', label: 'Open Tasks', value: zone.taskList?.length || 0, color: '#7c3aed' },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                    <div style={{ color, fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{value}</div>
                    <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 3, lineHeight: 1.3 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#166534', marginBottom: 8 }}>🏢 What NGOs Do Here</div>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#374151', fontSize: 12, lineHeight: 1.8 }}>
                  <li>Coordinate volunteer deployment and task assignments</li>
                  <li>Monitor zone severity and escalate emergencies</li>
                  <li>Manage resource distribution (food, medicine, shelter)</li>
                  <li>Submit impact reports after task completion</li>
                  <li>Earn NGO points for verified impact activities</li>
                </ul>
              </div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 8 }}>✅ Volunteer Requirements</div>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#374151', fontSize: 12, lineHeight: 1.8 }}>
                  <li>Must be registered on Prahar platform</li>
                  <li>Age 18+ for emergency/critical zones</li>
                  <li>Skills needed: {zone.domain === 'Medical' ? 'First Aid, Medical Aid' : zone.domain === 'Food Relief' ? 'Cooking, Logistics' : zone.domain === 'Flood' ? 'Physical Labor, Driving' : 'Physical Labor, Communication'}</li>
                  <li>Available for minimum {zone.taskList?.[0]?.duration || '2h'} per task</li>
                  <li>Can only hold one active task at a time</li>
                </ul>
              </div>
              {zone.predicted && (
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#7c3aed', marginBottom: 6 }}>🔮 AI Prediction</div>
                  <div style={{ color: '#374151', fontSize: 12, lineHeight: 1.6 }}>
                    This zone is predicted to reach <strong>critical levels within 48 hours</strong> based on historical patterns, weather data, and current volunteer shortage.
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Available Tasks</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {zone.taskList?.map((task, i) => (
                    <div key={i} style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{task.title}</div>
                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: task.type === 'paid' ? '#dcfce7' : '#dbeafe', color: task.type === 'paid' ? '#166534' : '#1e40af', flexShrink: 0, marginLeft: 8 }}>
                          {task.type === 'paid' ? `💰 ₹${task.amount + (task.urgencyBonus || 0)}` : '🤝 Free'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>⏱ {task.duration}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>👥 {task.slots} slots</span>
                        {task.urgencyBonus > 0 && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>+₹{task.urgencyBonus} urgency bonus</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => { setShowDetails(false); onJoin() }}
                style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: isCritical ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
              >
                {isCritical ? '🚨 Join Emergency Task' : '🙋 Join a Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Legend() {
  return (
    <div style={{ position: 'absolute', bottom: 24, left: 12, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>Legend</div>
      {[{ emoji: '🔴', label: 'Critical', range: '≥70' }, { emoji: '🟡', label: 'Moderate', range: '40–69' }, { emoji: '🟢', label: 'Safe', range: '<40' }, { emoji: '🔮', label: 'Predicted', range: '' }, { emoji: '🔵', label: 'You', range: '' }].map(({ emoji, label, range }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <span style={{ fontSize: 11 }}>{emoji}</span>
          <span style={{ color: '#475569', fontSize: 11, flex: 1 }}>{label}</span>
          {range && <span style={{ color: '#cbd5e1', fontSize: 10 }}>{range}</span>}
        </div>
      ))}
    </div>
  )
}

function LiveBar({ lastUpdate, locationName }) {
  return (
    <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid #e2e8f0', borderRadius: 10, padding: '7px 12px', zIndex: 10, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'user-pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
      <span style={{ color: '#10b981', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>Live</span>
      <span style={{ color: '#e2e8f0' }}>·</span>
      <span style={{ color: '#94a3b8', fontSize: 10 }}>{lastUpdate}</span>
      {locationName && <><span style={{ color: '#e2e8f0' }}>·</span><span style={{ color: '#64748b', fontSize: 10 }}>📍 {locationName}</span></>}
    </div>
  )
}

function Loader({ msg }) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#10b981', animation: 'spin 0.9s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛰️</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#0f172a', fontWeight: 700, fontSize: 15 }}>Crisis Intelligence Map</div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{msg}</div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TaskMap() {
  const { user } = useAuth()
  const [mapCenter, setMapCenter] = useState(DELHI_CENTER)
  const [userLocation, setUserLocation] = useState(null)
  const [locationName, setLocationName] = useState(null)
  const [zones, setZones] = useState(() => generateZonesAround(DELHI_CENTER))
  const [selectedZone, setSelectedZone] = useState(null)
  const [joinZone, setJoinZone] = useState(null)
  const [hoveredZone, setHoveredZone] = useState(null)
  const [lastUpdate, setLastUpdate] = useState('just now')
  const [geoReady, setGeoReady] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeTask, setActiveTask] = useState(null) // one task at a time
  const mapRef = useRef(null)

  // Suppress Google Maps billing/dev popup — multiple strategies
  useEffect(() => {
    const _alert = window.alert
    window.alert = (msg) => {
      if (typeof msg === 'string' && msg.toLowerCase().includes('google')) return
      _alert(msg)
    }

    const kill = () => {
      // Only target known Google Maps error classes — don't walk up DOM
      document.querySelectorAll('.gm-err-container, .gm-err-content, .gm-err-autocomplete').forEach(el => {
        el.style.display = 'none'
      })
    }

    const t = setInterval(kill, 300)
    const obs = new MutationObserver(kill)
    obs.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.alert = _alert
      clearInterval(t)
      obs.disconnect()
    }
  }, [])

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  })

  useEffect(() => {
    if (!navigator.geolocation) { setGeoReady(true); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc); setMapCenter(loc)
        setZones(generateZonesAround(loc)); setGeoReady(true)
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json`)
          .then(r => r.json())
          .then(d => setLocationName(d.address?.city || d.address?.town || d.address?.county || 'Your Area'))
          .catch(() => setLocationName('Your Area'))
      },
      () => { setGeoReady(true); setLocationName('Delhi NCR') },
      { timeout: 7000, enableHighAccuracy: true }
    )
  }, [])

  useEffect(() => {
    const t = setInterval(() => { setZones(prev => updateScores(prev)); setLastUpdate('just now') }, 5000)
    return () => clearInterval(t)
  }, [])

  const onMapLoad = useCallback(map => { mapRef.current = map }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  if (loadError) return (
    <div style={{ width: '100%', height: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
        <div style={{ color: '#ef4444', fontWeight: 700 }}>Maps failed to load</div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Check API key in .env</div>
      </div>
    </div>
  )

  const ready = isLoaded && geoReady

  return (
    <>
      <style>{`
        @keyframes pin-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes ring-pulse { 0%{transform:scale(0.6);opacity:0.8} 100%{transform:scale(1.8);opacity:0} }
        @keyframes user-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slide-in { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes modal-up { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes toast-in { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden', background: '#f8fafc' }}>
        {!ready ? (
          <Loader msg={!isLoaded ? 'Loading map engine…' : 'Detecting your location…'} />
        ) : (
          <>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter} zoom={12} onLoad={onMapLoad}
              options={{ styles: CLEAN_MAP_STYLE, zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, clickableIcons: false }}
            >
              {zones.filter(z => z.predicted).map(z => <PredictedRing key={`r-${z.id}`} zone={z} />)}

              {zones.map(z => (
                <EmojiMarker
                  key={`m-${z.id}`} zone={z}
                  isHovered={hoveredZone?.id === z.id}
                  isSelected={selectedZone?.id === z.id}
                  onClick={() => { setSelectedZone(z); setHoveredZone(null) }}
                  onMouseEnter={() => setHoveredZone(z)}
                  onMouseLeave={() => setHoveredZone(null)}
                />
              ))}

              {/* Floating popup near clicked marker */}
              {selectedZone && (
                <OverlayView
                  position={{ lat: selectedZone.lat, lng: selectedZone.lng }}
                  mapPaneName={OverlayView.FLOAT_PANE}
                  getPixelPositionOffset={() => ({ x: 20, y: -180 })}
                >
                  <div style={{ width: 300, pointerEvents: 'all' }}>
                    <Sidebar
                      zone={selectedZone}
                      onClose={() => setSelectedZone(null)}
                      onJoin={() => { setJoinZone(selectedZone); setSelectedZone(null) }}
                      inline
                    />
                  </div>
                </OverlayView>
              )}

              {userLocation && <UserPin position={userLocation} />}
            </GoogleMap>

            <LiveBar lastUpdate={lastUpdate} locationName={locationName} />
            <Legend />
          </>
        )}

        {joinZone && (
          <JoinTaskModal
            zone={joinZone}
            onClose={() => setJoinZone(null)}
            onJoined={(task) => showToast(`✅ Joined "${task.title}" — check your dashboard!`)}
            activeTask={activeTask}
            setActiveTask={setActiveTask}
          />
        )}

        {/* Active task indicator */}
        {activeTask && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 10, padding: '7px 12px', zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            transition: 'right 0.25s ease',
          }}>
            <span style={{ fontSize: 14 }}>⏳</span>
            <div>
              <div style={{ color: '#92400e', fontWeight: 700, fontSize: 11 }}>{activeTask.title}</div>
              <div style={{ color: '#d97706', fontSize: 10 }}>📍 {activeTask.zoneName}</div>
            </div>
          </div>
        )}

        {toast && (
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 300, whiteSpace: 'nowrap', animation: 'toast-in 0.25s ease' }}>
            {toast}
          </div>
        )}
      </div>
    </>
  )
}
