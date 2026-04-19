import TaskMap from '../components/TaskMap'
import { useNavigate } from 'react-router-dom'

export default function TaskMapPage() {
  const navigate = useNavigate()
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      background: '#020617',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', padding: '6px 12px', fontSize: 13, fontWeight: 600 }}
          >← Back</button>
          <span style={{ fontSize: 24 }}>🛰️</span>
          <div>
            <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0, lineHeight: 1.2 }}>
              PRAHAR Intelligence Map
            </h1>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
              Real-time disaster zone monitoring · Delhi NCR
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#10b981', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            System Status
          </div>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>● Operational</div>
        </div>
      </div>

      {/* Map fills remaining height */}
      <div style={{ flex: 1, padding: 12, minHeight: 0 }}>
        <TaskMap />
      </div>
    </div>
  )
}
