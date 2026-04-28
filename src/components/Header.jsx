import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const showBack = location.pathname !== '/'
  const { t, toggleLang } = useLang()
  const { user, userProfile, logout } = useAuth()

  const dashboardPath = userProfile?.role === 'ngo' ? '/ngo/dashboard' : '/volunteer/dashboard'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

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
                {t('back')}
              </button>
            )}
            <Link to="/" className="nav-logo">
              <span className="logo-text">Prahar</span>
              <span className="logo-tagline">Environmental Intelligence</span>
            </Link>
          </div>

          <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>{t('home')}</Link>
            <Link to="/map" className={`nav-link ${isActive('/map') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>{t('liveMap')}</Link>
            <Link to="/impact" className={`nav-link ${isActive('/impact') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>{t('impact')}</Link>
            <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>{t('leaderboard')}</Link>
            <Link to="/volunteer/dashboard" className="nav-link nav-link--dev" onClick={() => setIsMenuOpen(false)}>{t('volDashboard')}</Link>
            <Link to="/ngo/dashboard" className="nav-link nav-link--dev" onClick={() => setIsMenuOpen(false)}>{t('ngoDashboard')}</Link>
          </div>

          <div className="nav-auth">
            <button
              onClick={toggleLang}
              style={{
                background: 'transparent', border: '1.5px solid #e5e7eb',
                borderRadius: '8px', color: '#374151', cursor: 'pointer',
                padding: '4px 10px', fontSize: '13px', fontWeight: '600',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151' }}
            >
              {t('langToggle')}
            </button>
            {user ? (
              <>
                <button className="btn btn-outline" onClick={() => navigate(dashboardPath)}>
                  {userProfile?.role === 'ngo' ? t('ngoDashboard') : t('volDashboard')}
                </button>
                <button className="btn btn-primary" onClick={handleLogout}>{t('logout')}</button>
              </>
            ) : (
              <>
                <button className="btn btn-outline" onClick={() => navigate('/login')}>{t('login')}</button>
                <button className="btn btn-primary" onClick={() => navigate('/signup')}>{t('signUp')}</button>
              </>
            )}
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
