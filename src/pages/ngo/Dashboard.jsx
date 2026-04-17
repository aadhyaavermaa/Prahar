import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { useAuth } from '../../context/AuthContext'

const NgoDashboard = () => {
  const { user, userProfile } = useAuth()
  const devUser = user || { email: 'preview@dev.com' }
  const devProfile = userProfile || {}
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  const displayName = devProfile?.ngoName || devProfile?.firstName || 'NGO'

  return (
    <div className="dashboard-page">
      <div className="dashboard-topbar">
        <div className="dashboard-logo">🌿 Prahar</div>
        <div className="dashboard-topbar-right">
          <span className="dashboard-user">{devUser?.email}</span>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-container">
        <div className="dashboard-welcome">
          <h1>Welcome, {displayName} 🏢</h1>
          <p>Manage your volunteer programs and connect with passionate volunteers.</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-icon">📢</span>
            <div>
              <div className="stat-value">0</div>
              <div className="stat-label">Active Listings</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div>
              <div className="stat-value">0</div>
              <div className="stat-label">Volunteers</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📬</span>
            <div>
              <div className="stat-value">0</div>
              <div className="stat-label">Applications</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📢 Post Opportunity</h3>
            <p>Create a new volunteer listing and reach hundreds of volunteers.</p>
            <button className="btn btn-primary btn-sm" disabled>Coming Soon</button>
          </div>
          <div className="dashboard-card">
            <h3>👥 Browse Volunteers</h3>
            <p>Find volunteers by skill, location, and availability.</p>
            <button className="btn btn-outline btn-sm" disabled>Coming Soon</button>
          </div>
          <div className="dashboard-card">
            <h3>🏢 NGO Profile</h3>
            <p>Update your NGO details and showcase your impact.</p>
            <button className="btn btn-outline btn-sm" disabled>Coming Soon</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NgoDashboard
