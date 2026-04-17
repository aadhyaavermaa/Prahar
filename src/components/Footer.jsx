import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Prahar</h3>
            <p>Smart resource allocation for NGOs using Environmental Intelligence and AI-powered volunteer management.</p>
            <div className="social-links">
              <a href="#" className="social-link">Twitter</a>
              <a href="#" className="social-link">LinkedIn</a>
              <a href="#" className="social-link">GitHub</a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/impact">Impact</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>For NGOs</h4>
            <ul>
              <li><Link to="/ngos/register">Register NGO</Link></li>
              <li><Link to="/ngos/dashboard">NGO Dashboard</Link></li>
              <li><Link to="/resources">Resources</Link></li>
              <li><Link to="/training">Training</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>For Volunteers</h4>
            <ul>
              <li><Link to="/volunteers/register">Become Volunteer</Link></li>
              <li><Link to="/opportunities">Opportunities</Link></li>
              <li><Link to="/leaderboard">Leaderboard</Link></li>
              <li><Link to="/training">Training</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 Prahar. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
