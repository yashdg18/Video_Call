import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../App.css'

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext)
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser()
        setMeetings(history)
      } catch (e) {}
      setLoading(false)
    }
    fetchHistory()
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="history-page">
      <nav className="home-nav">
        <div className="nav-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">MeetMe</span>
        </div>
        <button className="home-nav-btn outline" onClick={() => navigate('/home')}>← Back to Home</button>
      </nav>

      <div className="history-content">
        <div className="history-header">
          <h1 className="history-title">Meeting <span className="hero-highlight">History</span></h1>
          <p className="history-sub">All your past meetings in one place</p>
        </div>

        {loading ? (
          <div className="history-loading">Loading your meetings...</div>
        ) : meetings.length === 0 ? (
          <div className="history-empty">
            <span className="empty-icon">📭</span>
            <p>No meetings yet. Start your first one!</p>
            <button className="btn-primary" onClick={() => navigate('/home')}>Start a Meeting</button>
          </div>
        ) : (
          <div className="history-grid">
            {meetings.map((e, i) => (
              <div key={i} className="history-card">
                <div className="history-card-icon">📹</div>
                <div className="history-card-info">
                  <div className="history-code">{e.meetingCode}</div>
                  <div className="history-date">{formatDate(e.date)} · {formatTime(e.date)}</div>
                </div>
                <button className="rejoin-btn" onClick={() => navigate(`/${e.meetingCode}`)}>Rejoin →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
