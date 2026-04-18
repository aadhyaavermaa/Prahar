import { useState, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api'
import { useNavigate } from 'react-router-dom'

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
]

// 3 preview zones — fixed, no live updates needed
const PREVIEW_ZONES = [
  {
    id: 1, name: 'Karol Bagh', lat: 28.6519, lng: 77.1909,
    score: 88, domain: 'Rescue', emoji: '🚨', predicted: true,
    badgeBg: '#fee2e2', badgeColor: '#dc2626', pinShadow: 'rgba(239,68,68,0.4)',
    pulse: true,
  },
  {
    id: 2, name: 'Lajpat Nagar', lat: 28.5677, lng: 77.2433,
    score: 55, domain: 'Food Relief', emoji: '🍲', predicted: false,
    badgeBg: '#fef3c7', badgeColor: '#92400e', pinShadow: 'rgba(245,158,11,0.3)',
    pulse: false,
  },
  {
    id: 3, name: 'Rohini', lat: 28.7041, lng: 77.1025,
    score: 28, domain: 'Shelter', emoji: '🤝', predicted: false,
    badgeBg: '#dcfce7', badgeColor: '#166534', pinShadow: 'rgba(34,197,94,0.3)',
    pulse: false,
  },
]

function PreviewPin({ zone, isHovered, onMouseEnter, onMouseLeave }) {
  const scale = isHovered ? 1.35 : 1
  return (
    <OverlayView
      position={{ lat: zone.lat, lng: zone.lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}
    >
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          cursor: 'default', userSelect: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.18s ease',
          position: 'relative',
        }}
      >
        {/* Emoji */}
        <div style={{
          fontSize: 26,
          filter: `drop-shadow(0 2px 4px ${zone.pinShadow})`,
          animation: zone.pulse ? 'mini-pulse 1.6s ease-in-out infinite' : 'none',
          lineHeight: 1,
        }}>
          {zone.predicted ? '🔮' : zone.emoji}
        </div>

        {/* Score pill */}
        <div style={{
          background: zone.badgeBg,
          border: `1px solid ${zone.badgeColor}30`,
          borderRadius: 20, padding: '1px 7px',
          fontSize: 10, fontWeight: 700, color: zone.badgeColor,
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap',
        }}>
          {zone.score}
        </div>

        {/* Hover tooltip */}
        {isHovered && (
          <div style={{
            position: 'absolute', bottom: '100%', left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '5px 10px',
            fontSize: 11, fontWeight: 700, color: '#0f172a',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 10,
          }}>
            {zone.name} · {zone.domain}
            {zone.predicted && <span style={{ color: '#7c3aed', marginLeft: 4 }}>🔮</span>}
          </div>
        )}
      </div>
    </OverlayView>
  )
}

export default function MiniMapPreview() {
  const navigate = useNavigate()
  const [hoveredZone, setHoveredZone] = useState(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  })

  const onMapLoad = useCallback(() => {}, [])

  return (
    <section style={{
      background: '#f8fafc',
      padding: '60px 20px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fee2e2', border: '1px solid #fecaca',
            borderRadius: 99, padding: '4px 14px', marginBottom: 14,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'live-blink 1.5s ease-in-out infinite' }} />
            <span style={{ color: '#dc2626', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Live Crisis Map</span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
            Real-time Disaster Intelligence
          </h2>
          <p style={{ color: '#64748b', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
            AI-powered zone monitoring across Delhi NCR. Click any zone to see tasks and volunteer opportunities.
          </p>
        </div>

        {/* Map container */}
        <div style={{
          position: 'relative',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
          height: 380,
        }}>
          {!isLoaded ? (
            <div style={{
              width: '100%', height: '100%', background: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '3px solid #e2e8f0', borderTopColor: '#10b981',
                animation: 'mini-spin 0.9s linear infinite',
              }} />
              <span style={{ color: '#94a3b8', fontSize: 14 }}>Loading map…</span>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={DELHI_CENTER}
              zoom={11}
              onLoad={onMapLoad}
              options={{
                styles: CLEAN_MAP_STYLE,
                zoomControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                clickableIcons: false,
                draggable: false,
                scrollwheel: false,
                disableDoubleClickZoom: true,
                keyboardShortcuts: false,
              }}
            >
              {PREVIEW_ZONES.map(zone => (
                <PreviewPin
                  key={zone.id}
                  zone={zone}
                  isHovered={hoveredZone === zone.id}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                />
              ))}
            </GoogleMap>
          )}

          {/* Top-left live badge */}
          <div style={{
            position: 'absolute', top: 14, left: 14,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
            border: '1px solid #e2e8f0', borderRadius: 10,
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            zIndex: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'live-blink 1.5s ease-in-out infinite' }} />
            <span style={{ color: '#10b981', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Live</span>
            <span style={{ color: '#cbd5e1', fontSize: 10 }}>·</span>
            <span style={{ color: '#64748b', fontSize: 10 }}>Delhi NCR</span>
          </div>

          {/* Zone count badges */}
          <div style={{
            position: 'absolute', top: 14, right: 14,
            display: 'flex', gap: 6, zIndex: 5,
          }}>
            {[
              { color: '#fee2e2', text: '#dc2626', label: '🚨 1 Critical' },
              { color: '#fef3c7', text: '#92400e', label: '⏳ 1 Moderate' },
              { color: '#dcfce7', text: '#166534', label: '✅ 1 Safe' },
            ].map(({ color, text, label }) => (
              <div key={label} style={{
                background: color, border: `1px solid ${text}20`,
                borderRadius: 99, padding: '4px 10px',
                fontSize: 11, fontWeight: 700, color: text,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}>{label}</div>
            ))}
          </div>

          {/* Bottom gradient overlay with CTA */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
            padding: '40px 24px 24px',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            zIndex: 5,
          }}>
            <div>
              <div style={{ color: '#0f172a', fontWeight: 700, fontSize: 15, marginBottom: 3 }}>
                10+ active crisis zones across Delhi NCR
              </div>
              <div style={{ color: '#64748b', fontSize: 13 }}>
                Updated every 5 seconds · AI-predicted alerts active
              </div>
            </div>
            <button
              onClick={() => navigate('/map')}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '12px 22px', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🗺️ Explore Full Map →
            </button>
          </div>
        </div>

        {/* Stats row below map */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16, marginTop: 20,
        }}>
          {[
            { icon: '🚨', value: '3', label: 'Emergency Zones', color: '#ef4444', bg: '#fee2e2' },
            { icon: '🙋', value: '47', label: 'Volunteers Deployed', color: '#10b981', bg: '#dcfce7' },
            { icon: '🔮', value: '4', label: 'AI Predicted Alerts', color: '#7c3aed', bg: '#f5f3ff' },
          ].map(({ icon, value, label, color, bg }) => (
            <div key={label} style={{
              background: 'white', border: '1px solid #e2e8f0',
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>{icon}</div>
              <div>
                <div style={{ color, fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{value}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes mini-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes mini-spin { to{transform:rotate(360deg)} }
        @keyframes live-blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </section>
  )
}
