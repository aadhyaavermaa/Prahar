import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="header">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <span className="logo-text">Prahar</span>
            <span className="logo-tagline">Environmental Intelligence</span>
          </Link>

          <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/about" className="nav-link" onClick={() => setIsMenuOpen(false)}>About</Link>
            <Link to="/features" className="nav-link" onClick={() => setIsMenuOpen(false)}>Features</Link>
            <Link to="/impact" className="nav-link" onClick={() => setIsMenuOpen(false)}>Impact</Link>
            {/* Dev preview links — remove auth guard later */}
            <Link to="/volunteer/onboarding" className="nav-link nav-link--dev" onClick={() => setIsMenuOpen(false)}>Onboarding</Link>
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
