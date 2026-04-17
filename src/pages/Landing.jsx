import React from 'react'
import { Link } from 'react-router-dom'

const Landing = () => {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Environmental Intelligence for
              <span className="highlight"> Smart Resource Allocation</span>
            </h1>
            <p className="hero-subtitle">
              Satellite + API data predicts crises 48–72 hrs before they peak. 
              AI-powered volunteer matching and dynamic workforce redistribution for NGOs.
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary btn-large">
                Get Started
              </Link>
              <Link to="/about" className="btn btn-outline btn-large">
                Learn More
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card">
              <div className="card-icon">🛰️</div>
              <h4>Predictive Analytics</h4>
              <p>48-72 hours early warning</p>
            </div>
            <div className="floating-card">
              <div className="card-icon">🤖</div>
              <h4>AI Matching</h4>
              <p>Smart volunteer allocation</p>
            </div>
            <div className="floating-card">
              <div className="card-icon">🗺️</div>
              <h4>Fleet Routing</h4>
              <p>Optimized deployment</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Dynamic Workforce Redistribution</h3>
              <p>Continuously rebalances volunteers across NGOs and regions by demand</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>AI Volunteer Matching</h3>
              <p>Gemini matches by skill, location, reliability, and urgency</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Fleet Routing</h3>
              <p>Multi-volunteer, multi-location deployment optimization</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>CV Impact Scoring</h3>
              <p>AI scores before/after photos — proof, not self-reporting</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Dual Gamification</h3>
              <p>Points, badges & leaderboards for both volunteers AND NGOs</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📰</div>
              <h3>Weekly Impact Showcase</h3>
              <p>Auto-compiled visual newspaper of real social impact</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Make an Impact?</h2>
            <p>Join thousands of NGOs and volunteers making a difference with smart resource allocation.</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary btn-large">
                Join as Volunteer
              </Link>
              <Link to="/ngos/register" className="btn btn-outline btn-large">
                Register Your NGO
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
