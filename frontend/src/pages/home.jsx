import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import '../App.css'

function HomeComponent() {
  const navigate = useNavigate()
  const [meetingCode, setMeetingCode] = useState('')
  const { addToUserHistory } = useContext(AuthContext)

  const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) return
    await addToUserHistory(meetingCode)
    navigate(`/${meetingCode}`)
  }

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 10)
    setMeetingCode(code)
  }

  return (
    <div className="home-page">
      <nav className="home-nav">
        <div className="nav-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">YashMeet</span>
        </div>
        <div className="home-nav-right">
          <button className="home-nav-btn outline" onClick={() => navigate('/history')}>📋 History</button>
          <button className="home-nav-btn danger" onClick={() => { localStorage.removeItem('token'); navigate('/auth') }}>Logout</button>
        </div>
      </nav>

      <div className="home-hero">
        <div className="home-left">
          <div className="hero-badge">✦ Your meeting space</div>
          <h1 className="home-title">Start or join a<br /><span className="hero-highlight">video meeting</span></h1>
          <p className="home-subtitle">Enter a meeting code to join an existing call, or generate a new one to invite others.</p>

          <div className="meeting-input-group">
            <input
              className="meeting-input"
              placeholder="Enter meeting code..."
              value={meetingCode}
              onChange={e => setMeetingCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinVideoCall()}
            />
            <button className="btn-primary" onClick={handleJoinVideoCall}>Join →</button>
          </div>

          <button className="generate-btn" onClick={generateCode}>⚡ Generate new meeting code</button>

          {meetingCode && (
            <div className="code-preview">
              <span>Code: <strong>{meetingCode}</strong></span>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText(meetingCode)}>Copy</button>
            </div>
          )}
        </div>

        <div className="home-right">
          <div className="home-card">
            <img src="/logo3.png" alt="Meet" className="home-img" />
          </div>
        </div>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <span className="feature-icon">📹</span>
          <h3>HD Video</h3>
          <p>Crystal clear video with adaptive quality</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">💬</span>
          <h3>Live Chat</h3>
          <p>Real-time messaging with emoji support</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🖥️</span>
          <h3>Screen Share</h3>
          <p>Share your screen with one click</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📝</span>
          <h3>Meeting Notes</h3>
          <p>Take notes during your meeting</p>
        </div>
      </div>
    </div>
  )
}

export default withAuth(HomeComponent)
