import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const showBack = location.pathname !== '/'

  return (
    <header className="header">
      <nav className="navbar">
        <div className="nav-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'transparent', border: '1.5px solid #10b981',
                  borderRadius: '8px', color: '#10b981', cursor: 'pointer',
                  padding: '4px 12px', fontSize: '13px', fontWeight: '600',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#10b981' }}
              >
                ← Back
              </button>
            )}
            <Link to="/" className="nav-logo">
              <span className="logo-text">Prahar</span>
              <span className="logo-tagline">Environmental Intelligence</span>
            </Link>
          </div>

          <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/map" className="nav-link" onClick={() => setIsMenuOpen(false)}>🗺️ Live Map</Link>
            <Link to="/impact" className="nav-link" onClick={() => setIsMenuOpen(false)}>📰 Impact</Link>
            <Link to="/leaderboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>🏆 Leaderboard</Link>
            <Link to="/volunteer/dashboard" className="nav-link nav-link--dev" onClick={() => setIsMenuOpen(false)}>Vol. Dashboard</Link>
            <Link to="/ngo/dashboard" className="nav-link nav-link--dev" onClick={() => setIsMenuOpen(false)}>NGO Dashboard</Link>
          </div>

          <div className="nav-auth">
            <button className="btn btn-outline" onClick={() => navigate('/login')}>Login</button>
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>Sign Up</button>
          </div>

          <button className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
    </header>
  )
}

export default Header