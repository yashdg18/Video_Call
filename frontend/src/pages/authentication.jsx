import React, { useContext, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../App.css'

export default function Authentication() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [formState, setFormState] = useState(0) // 0=login, 1=register
  const [loading, setLoading] = useState(false)

  const { handleRegister, handleLogin } = useContext(AuthContext)

  let handleAuth = async () => {
    setLoading(true)
    setError('')
    try {
      if (formState === 0) {
        await handleLogin(username, password)
      } else {
        let result = await handleRegister(name, username, password)
        setMessage(result)
        setUsername(''); setPassword(''); setName('')
        setFormState(0)
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong')
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAuth()
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="nav-logo" style={{marginBottom:'2rem'}}>
            <span className="logo-icon">⬡</span>
            <span className="logo-text">MeetMe</span>
          </div>
          <h2 className="auth-tagline">"Where great meetings happen."</h2>
          <p className="auth-sub">HD video · Live chat · Screen share · Secure</p>
          <div className="auth-features">
            <div className="auth-feat">✓ No time limits</div>
            <div className="auth-feat">✓ End-to-end encrypted</div>
            <div className="auth-feat">✓ Works on any device</div>
          </div>
          {/* <div className="auth-credit">Built by <strong>Yash Dg</strong> · <a href="https://github.com/yashdg18" target="_blank" rel="noreferrer">github.com/yashdg18</a></div> */}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">{formState === 0 ? 'Welcome back' : 'Create account'}</h2>
          <p className="auth-desc">{formState === 0 ? 'Sign in to your MeetMe account' : 'Join MeetMe today — it\'s free'}</p>

          <div className="auth-tabs">
            <button className={`auth-tab ${formState === 0 ? 'active' : ''}`} onClick={() => setFormState(0)}>Sign In</button>
            <button className={`auth-tab ${formState === 1 ? 'active' : ''}`} onClick={() => setFormState(1)}>Sign Up</button>
          </div>

          <div className="auth-form">
            {formState === 1 && (
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="full name" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} className="form-input" />
              </div>
            )}
            <div className="form-group">
              <label>Username</label>
              <input type="text" placeholder="abc123" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={handleKeyDown} className="form-input" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} className="form-input" />
            </div>

            {error && <div className="auth-error">⚠ {error}</div>}
            {message && <div className="auth-success">✓ {message}</div>}

            <button className="auth-submit" onClick={handleAuth} disabled={loading}>
              {loading ? <span className="auth-spinner" /> : (formState === 0 ? 'Sign In →' : 'Create Account →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
