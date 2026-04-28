import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'

const Landing = () => {
  const { t } = useLang()
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              {t('heroTitle')}
              <span className="highlight"> {t('heroHighlight')}</span>
            </h1>
            <p className="hero-subtitle">{t('heroSubtitle')}</p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary btn-large">{t('getStarted')}</Link>
              <Link to="/about" className="btn btn-outline btn-large">{t('learnMore')}</Link>
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
          <h2 className="section-title">{t('powerfulFeatures')}</h2>
          <div className="features-grid">
            <div className="feature-card"><div className="feature-icon">🔄</div><h3>{t('feature1Title')}</h3><p>{t('feature1Desc')}</p></div>
            <div className="feature-card"><div className="feature-icon">🧠</div><h3>{t('feature2Title')}</h3><p>{t('feature2Desc')}</p></div>
            <div className="feature-card"><div className="feature-icon">🗺️</div><h3>{t('feature3Title')}</h3><p>{t('feature3Desc')}</p></div>
            <div className="feature-card"><div className="feature-icon">📸</div><h3>{t('feature4Title')}</h3><p>{t('feature4Desc')}</p></div>
            <div className="feature-card"><div className="feature-icon">🏆</div><h3>{t('feature5Title')}</h3><p>{t('feature5Desc')}</p></div>
            <div className="feature-card"><div className="feature-icon">📰</div><h3>{t('feature6Title')}</h3><p>{t('feature6Desc')}</p></div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>{t('ctaTitle')}</h2>
            <p>{t('ctaSubtitle')}</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary btn-large">{t('joinVolunteer')}</Link>
              <Link to="/ngos/register" className="btn btn-outline btn-large">{t('registerNgo')}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
