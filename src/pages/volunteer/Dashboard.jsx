import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { subscribeToMyTasks } from '../../firebase'

// Mock data — replace with Firestore queries later
const MOCK_TASKS = [
  { id: 1, title: 'Tree Plantation Drive', ngo: 'Green Earth Foundation', location: 'Sector 21, Delhi', date: 'Apr 20, 2026', status: 'active', priority: 'high', points: 150, category: 'Environment' },
  { id: 2, title: 'Teach Basic Computer Skills', ngo: 'Digital India NGO', location: 'Rohini, Delhi', date: 'Apr 22, 2026', status: 'active', priority: 'medium', points: 100, category: 'Education' },
  { id: 3, title: 'Blood Donation Camp Setup', ngo: 'LifeSave Trust', location: 'Dwarka, Delhi', date: 'Apr 18, 2026', status: 'completed', priority: 'high', points: 200, category: 'Healthcare' },
  { id: 4, title: 'Women Safety Workshop', ngo: 'Shakti Foundation', location: 'Lajpat Nagar', date: 'Apr 15, 2026', status: 'completed', priority: 'medium', points: 120, category: 'Women Empowerment' },
  { id: 5, title: 'River Cleanup Campaign', ngo: 'Clean Rivers India', location: 'Yamuna Bank', date: 'May 1, 2026', status: 'upcoming', priority: 'high', points: 180, category: 'Environment' },
]

const MOCK_ACTIVITY = [
  { id: 1, text: 'Completed Blood Donation Camp Setup', time: '2 days ago', icon: '✅' },
  { id: 2, text: 'Earned "Healthcare Hero" badge', time: '2 days ago', icon: '🏅' },
  { id: 3, text: 'Joined Women Safety Workshop', time: '4 days ago', icon: '📋' },
  { id: 4, text: 'Reached 500 points milestone', time: '1 week ago', icon: '🎯' },
  { id: 5, text: 'Profile verified by LifeSave Trust', time: '1 week ago', icon: '✔️' },
]

const BADGES = [
  { icon: '🌱', label: 'First Step', earned: true },
  { icon: '🌿', label: 'Eco Warrior', earned: true },
  { icon: '🏅', label: 'Healthcare Hero', earned: true },
  { icon: '📚', label: 'Educator', earned: false },
  { icon: '🔥', label: '10 Tasks', earned: false },
  { icon: '⭐', label: 'Top Volunteer', earned: false },
]

const STATUS_STYLES = {
  active:    { bg: '#fef3c7', color: '#d97706', label: 'Active' },
  completed: { bg: '#d1fae5', color: '#059669', label: 'Completed' },
  upcoming:  { bg: '#ede9fe', color: '#7c3aed', label: 'Upcoming' },
}

const PRIORITY_DOT = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#10b981',
}

const VolunteerDashboard = () => {
  const { user, userProfile } = useAuth()
  const devUser = user || { email: 'preview@dev.com' }
  const devProfile = userProfile || {}
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('active')
  const [mapTasks, setMapTasks] = useState([])

  // Real-time listener for tasks joined from the map
  useEffect(() => {
    if (!user) return
    const unsub = subscribeToMyTasks(user.uid, (tasks) => {
      setMapTasks(tasks)
    })
    return () => unsub()
  }, [user])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  const displayName = devProfile?.firstName || devUser?.displayName || 'Arjun'
  const totalPoints = 620
  const level = Math.floor(totalPoints / 200) + 1
  const nextLevelPoints = level * 200
  const progress = ((totalPoints % 200) / 200) * 100

  const filteredTasks = MOCK_TASKS.filter(t =>
    activeTab === 'all' ? true : t.status === activeTab
  )

  return (
    <div className="vdash-page">
      {/* Topbar */}
      <div className="vdash-topbar">
        <div className="vdash-logo">🌿 Prahar</div>
        <div className="vdash-topbar-right">
          <span className="vdash-email">{devUser?.email}</span>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="vdash-layout">
        {/* ── Left Sidebar ── */}
        <aside className="vdash-sidebar">
          {/* Profile card */}
          <div className="vdash-profile-card">
            <div className="vdash-avatar">{displayName[0].toUpperCase()}</div>
            <div className="vdash-profile-name">{displayName}</div>
            <div className="vdash-profile-role">Volunteer</div>
            <div className="vdash-profile-location">📍 Delhi, India</div>

            <div className="vdash-level-row">
              <span className="vdash-level-badge">Level {level}</span>
              <span className="vdash-points-text">{totalPoints} pts</span>
            </div>
            <div className="vdash-progress-bar">
              <div className="vdash-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="vdash-progress-label">{totalPoints % 200} / 200 pts to Level {level + 1}</div>
          </div>

          {/* Stats */}
          <div className="vdash-sidebar-stats">
            <div className="vdash-sstat">
              <div className="vdash-sstat-val">5</div>
              <div className="vdash-sstat-lbl">Tasks Done</div>
            </div>
            <div className="vdash-sstat">
              <div className="vdash-sstat-val">32</div>
              <div className="vdash-sstat-lbl">Hours</div>
            </div>
            <div className="vdash-sstat">
              <div className="vdash-sstat-val">3</div>
              <div className="vdash-sstat-lbl">NGOs</div>
            </div>
          </div>

          {/* Badges */}
          <div className="vdash-section">
            <div className="vdash-section-title">Badges</div>
            <div className="vdash-badges">
              {BADGES.map(b => (
                <div key={b.label} className={`vdash-badge ${b.earned ? 'earned' : 'locked'}`} title={b.label}>
                  <span>{b.icon}</span>
                  <span className="vdash-badge-label">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="vdash-section">
            <div className="vdash-section-title">Skills</div>
            <div className="vdash-skills">
              {['Teaching', 'Environment', 'Healthcare', 'IT'].map(s => (
                <span key={s} className="vdash-skill-tag">{s}</span>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="vdash-main">
          {/* Welcome */}
          <div className="vdash-welcome">
            <div>
              <h1>Welcome back, {displayName} 👋</h1>
              <p>You have <strong>{MOCK_TASKS.filter(t => t.status === 'active').length} active tasks</strong> and <strong>1 upcoming</strong> this week.</p>
            </div>
            <button className="btn btn-primary btn-sm" disabled>+ Find Opportunities</button>
          </div>

          {/* ── Crisis Map Tasks (real-time from Firestore) ── */}
          {mapTasks.length > 0 && (
            <div style={{
              background: 'white', border: '1px solid #e5e7eb', borderRadius: 14,
              padding: '1.25rem', marginBottom: '0.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>🗺️</span>
                <span style={{ fontWeight: 700, color: '#1f2937', fontSize: 15 }}>Crisis Map Tasks</span>
                <span style={{
                  background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 99,
                }}>● Live · {mapTasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mapTasks.map(t => (
                  <div key={t.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px',
                    background: t.isEmergency ? '#fff5f5' : '#f0fdf4',
                    border: `1px solid ${t.isEmergency ? '#fecaca' : '#bbf7d0'}`,
                    borderRadius: 10, gap: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        {t.isEmergency && <span style={{ fontSize: 12 }}>🚨</span>}
                        <span style={{ fontWeight: 600, color: '#1f2937', fontSize: 13 }}>{t.taskTitle}</span>
                        {t.isEmergency && (
                          <span style={{
                            background: '#fee2e2', color: '#dc2626', fontSize: 10, fontWeight: 700,
                            padding: '1px 6px', borderRadius: 99,
                          }}>Emergency</span>
                        )}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 11 }}>
                        📍 {t.zoneName} · {t.zoneDomain}
                        {t.joinedAt?.toDate && ` · Joined ${t.joinedAt.toDate().toLocaleTimeString()}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {t.taskType === 'paid' ? (
                        <div>
                          <div style={{ color: '#16a34a', fontWeight: 800, fontSize: 15 }}>₹{t.totalPay}</div>
                          {t.urgencyBonus > 0 && (
                            <div style={{ color: '#dc2626', fontSize: 10, fontWeight: 600 }}>
                              +₹{t.urgencyBonus} urgency
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#2563eb', fontSize: 12, fontWeight: 600 }}>Volunteer</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Point summary cards */}
          <div className="vdash-cards">            <div className="vdash-card vdash-card--green">
              <div className="vdash-card-icon">🏆</div>
              <div className="vdash-card-val">{totalPoints}</div>
              <div className="vdash-card-lbl">Total Points</div>
            </div>
            <div className="vdash-card vdash-card--blue">
              <div className="vdash-card-icon">✅</div>
              <div className="vdash-card-val">2</div>
              <div className="vdash-card-lbl">Completed Tasks</div>
            </div>
            <div className="vdash-card vdash-card--purple">
              <div className="vdash-card-icon">📋</div>
              <div className="vdash-card-val">2</div>
              <div className="vdash-card-lbl">Active Tasks</div>
            </div>
            <div className="vdash-card vdash-card--orange">
              <div className="vdash-card-icon">⏰</div>
              <div className="vdash-card-val">32h</div>
              <div className="vdash-card-lbl">Hours Logged</div>
            </div>
          </div>

          {/* Tasks */}
          <div className="vdash-tasks-section">
            <div className="vdash-tasks-header">
              <div className="vdash-section-title" style={{marginBottom:0}}>My Tasks</div>
              <div className="vdash-tabs">
                {['active', 'upcoming', 'completed', 'all'].map(tab => (
                  <button key={tab} className={`vdash-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="vdash-task-list">
              {filteredTasks.length === 0 && (
                <div className="vdash-empty">No tasks here yet.</div>
              )}
              {filteredTasks.map(task => {
                const s = STATUS_STYLES[task.status]
                return (
                  <div key={task.id} className="vdash-task-card">
                    <div className="vdash-task-left">
                      <div className="vdash-task-top">
                        <span className="vdash-priority-dot" style={{ background: PRIORITY_DOT[task.priority] }} />
                        <span className="vdash-task-title">{task.title}</span>
                        <span className="vdash-status-pill" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                      <div className="vdash-task-meta">
                        <span>🏢 {task.ngo}</span>
                        <span>📍 {task.location}</span>
                        <span>📅 {task.date}</span>
                        <span className="vdash-category-tag">{task.category}</span>
                      </div>
                    </div>
                    <div className="vdash-task-right">
                      <div className="vdash-task-points">+{task.points} pts</div>
                      {task.status === 'active' && (
                        <button className="btn btn-primary btn-sm" disabled>View Details</button>
                      )}
                      {task.status === 'completed' && (
                        <button className="btn btn-outline btn-sm" disabled>View Report</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="vdash-right">
          {/* Leaderboard */}
          <div className="vdash-section vdash-widget">
            <div className="vdash-section-title">🏅 Leaderboard</div>
            {[
              { rank: 1, name: 'Priya S.', pts: 980 },
              { rank: 2, name: 'Rahul M.', pts: 860 },
              { rank: 3, name: displayName, pts: totalPoints, isYou: true },
              { rank: 4, name: 'Sneha K.', pts: 540 },
              { rank: 5, name: 'Amit R.', pts: 490 },
            ].map(entry => (
              <div key={entry.rank} className={`vdash-lb-row ${entry.isYou ? 'you' : ''}`}>
                <span className="vdash-lb-rank">#{entry.rank}</span>
                <span className="vdash-lb-name">{entry.name}{entry.isYou ? ' (You)' : ''}</span>
                <span className="vdash-lb-pts">{entry.pts} pts</span>
              </div>
            ))}
          </div>

          {/* Activity feed */}
          <div className="vdash-section vdash-widget">
            <div className="vdash-section-title">📰 Recent Activity</div>
            {MOCK_ACTIVITY.map(a => (
              <div key={a.id} className="vdash-activity-row">
                <span className="vdash-activity-icon">{a.icon}</span>
                <div>
                  <div className="vdash-activity-text">{a.text}</div>
                  <div className="vdash-activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default VolunteerDashboard
