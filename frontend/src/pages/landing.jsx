import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'

export default function LandingPage() {
  const router = useNavigate()

  return (
    <div className="landingPageContainer">
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />
      <div className="bg-orb orb3" />

      <nav className="landing-nav">
        <div className="nav-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">MeetMe</span>
        </div>
        <div className="navlist">
          <span className="nav-link" onClick={() => router('/aljk23')}>Join as Guest</span>
          <span className="nav-link" onClick={() => router('/auth')}>Register</span>
          <button className="nav-btn" onClick={() => router('/auth')}>Login</button>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div className="hero-left">
          <div className="hero-badge">Built by ydg</div>
          <h1 className="hero-title">
            <span className="hero-highlight">Connect</span> with<br />
            anyone, anywhere
          </h1>
          <p className="hero-subtitle">
            Crystal-clear video calls, real-time chat, and seamless collaboration —
            all in one place. Made for people who value quality.
          </p>
          <div className="hero-actions">
            <Link to="/auth" className="btn-primary">Get Started Free →</Link>
            <span className="nav-link-ghost" onClick={() => router('/aljk23')}>Join as Guest</span>
          </div>
          <div className="hero-stats">
            <div className="stat"><strong>HD</strong><span>Video Quality</span></div>
            <div className="stat-divider" />
            <div className="stat"><strong>0ms</strong><span>Latency</span></div>
            <div className="stat-divider" />
            <div className="stat"><strong>100%</strong><span>Secure</span></div>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-card">
            <img src="/mobile.png" alt="MeetMe App" className="hero-img" />
            <div className="floating-badge badge1">🔒 Encrypted</div>
            <div className="floating-badge badge2">⚡ Ultra-low latency</div>
          </div>
        </div>
      </div>

      <div className="landing-footer">
        <p>© 2026 MeetMe · Built by <strong>ydg</strong> · <a href="https://github.com/yashdg18" target="_blank" rel="noreferrer">github.com/yashdg18</a></p>
      </div>
    </div>
  )
}
