import React, { useEffect, useRef, useState, useCallback } from 'react'
import io from 'socket.io-client'
import server from '../environment'
import '../App.css'

const server_url = server
var connections = {}
const peerConfigConnections = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
}

const EMOJIS = ['😀','😂','❤️','👍','🔥','🎉','😮','😢','👏','💯','🤔','😎']

export default function VideoMeetComponent() {
  const socketRef = useRef()
  const socketIdRef = useRef()
  const localVideoref = useRef()
  const videoRef = useRef([])
  const notesRef = useRef('')

  const [videoAvailable, setVideoAvailable] = useState(true)
  const [audioAvailable, setAudioAvailable] = useState(true)
  const [video, setVideo] = useState(false)
  const [audio, setAudio] = useState(false)
  const [screen, setScreen] = useState(false)
  const [screenAvailable, setScreenAvailable] = useState(false)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [newMessages, setNewMessages] = useState(0)
  const [askForUsername, setAskForUsername] = useState(true)
  const [username, setUsername] = useState('')
  const [videos, setVideos] = useState([])
  const [activePanel, setActivePanel] = useState(null) // 'chat' | 'notes' | null
  const [notes, setNotes] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [meetingStarted, setMeetingStarted] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const chatBottomRef = useRef()
  const timerRef = useRef()

  // Timer
  useEffect(() => {
    if (meetingStarted) {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [meetingStarted])

  const formatTimer = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  useEffect(() => {
    getPermissions()
  }, [])

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoPermission) setVideoAvailable(true)
      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (audioPermission) setAudioAvailable(true)
      if (navigator.mediaDevices.getDisplayMedia) setScreenAvailable(true)
      const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (userMediaStream) {
        window.localStream = userMediaStream
        if (localVideoref.current) localVideoref.current.srcObject = userMediaStream
      }
    } catch (e) { console.log(e) }
  }

  useEffect(() => {
    if (video !== undefined && audio !== undefined) getUserMedia()
  }, [video, audio])

  useEffect(() => {
    if (screen !== undefined) getDislayMedia()
  }, [screen])

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices.getUserMedia({ video, audio })
        .then(getUserMediaSuccess)
        .catch(e => console.log(e))
    } else {
      try {
        localVideoref.current.srcObject.getTracks().forEach(t => t.stop())
      } catch (e) {}
    }
  }

  const getUserMediaSuccess = (stream) => {
    try { window.localStream.getTracks().forEach(t => t.stop()) } catch (e) {}
    window.localStream = stream
    localVideoref.current.srcObject = stream
    for (let id in connections) {
      if (id === socketIdRef.current) continue
      connections[id].addStream(window.localStream)
      connections[id].createOffer().then(desc => {
        connections[id].setLocalDescription(desc).then(() => {
          socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }))
        })
      })
    }
    stream.getTracks().forEach(track => {
      track.onended = () => {
        setVideo(false); setAudio(false)
        try { localVideoref.current.srcObject.getTracks().forEach(t => t.stop()) } catch (e) {}
        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
        window.localStream = blackSilence()
        localVideoref.current.srcObject = window.localStream
        for (let id in connections) {
          connections[id].addStream(window.localStream)
          connections[id].createOffer().then(desc => {
            connections[id].setLocalDescription(desc).then(() => {
              socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }))
            })
          })
        }
      }
    })
  }

  const getDislayMedia = () => {
    if (screen) {
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then(getDislayMediaSuccess)
        .catch(e => console.log(e))
    }
  }

  const getDislayMediaSuccess = (stream) => {
    try { window.localStream.getTracks().forEach(t => t.stop()) } catch (e) {}
    window.localStream = stream
    localVideoref.current.srcObject = stream
    for (let id in connections) {
      if (id === socketIdRef.current) continue
      connections[id].addStream(window.localStream)
      connections[id].createOffer().then(desc => {
        connections[id].setLocalDescription(desc).then(() => {
          socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }))
        })
      })
    }
    stream.getTracks().forEach(track => {
      track.onended = () => {
        setScreen(false)
        try { localVideoref.current.srcObject.getTracks().forEach(t => t.stop()) } catch (e) {}
        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
        window.localStream = blackSilence()
        localVideoref.current.srcObject = window.localStream
        getUserMedia()
      }
    })
  }

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message)
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === 'offer') {
            connections[fromId].createAnswer().then(desc => {
              connections[fromId].setLocalDescription(desc).then(() => {
                socketRef.current.emit('signal', fromId, JSON.stringify({ sdp: connections[fromId].localDescription }))
              })
            })
          }
        })
      }
      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
      }
    }
  }

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false })
    socketRef.current.on('signal', gotMessageFromServer)
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-call', window.location.href)
      socketIdRef.current = socketRef.current.id
      socketRef.current.on('chat-message', addMessage)
      socketRef.current.on('user-left', (id) => {
        setVideos(v => v.filter(video => video.socketId !== id))
        setParticipantCount(c => Math.max(1, c - 1))
      })
      socketRef.current.on('user-joined', (id, clients) => {
        setParticipantCount(clients.length)
        if (clients.length >= 2 && !meetingStarted) setMeetingStarted(true)
        clients.forEach(socketListId => {
          connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate != null) {
              socketRef.current.emit('signal', socketListId, JSON.stringify({ ice: event.candidate }))
            }
          }
          connections[socketListId].onaddstream = (event) => {
            let videoExists = videoRef.current.find(v => v.socketId === socketListId)
            if (videoExists) {
              setVideos(videos => {
                const updated = videos.map(v => v.socketId === socketListId ? { ...v, stream: event.stream } : v)
                videoRef.current = updated
                return updated
              })
            } else {
              let newVideo = { socketId: socketListId, stream: event.stream, autoplay: true, playsinline: true }
              setVideos(videos => {
                const updated = [...videos, newVideo]
                videoRef.current = updated
                return updated
              })
            }
          }
          if (window.localStream) {
            connections[socketListId].addStream(window.localStream)
          } else {
            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            connections[socketListId].addStream(window.localStream)
          }
        })
        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue
            try { connections[id2].addStream(window.localStream) } catch (e) {}
            connections[id2].createOffer().then(desc => {
              connections[id2].setLocalDescription(desc).then(() => {
                socketRef.current.emit('signal', id2, JSON.stringify({ sdp: connections[id2].localDescription }))
              })
            })
          }
        }
      })
    })
  }

  const silence = () => {
    let ctx = new AudioContext()
    let oscillator = ctx.createOscillator()
    let dst = oscillator.connect(ctx.createMediaStreamDestination())
    oscillator.start(); ctx.resume()
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
  }

  const black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement('canvas'), { width, height })
    canvas.getContext('2d').fillRect(0, 0, width, height)
    return Object.assign(canvas.captureStream().getVideoTracks()[0], { enabled: false })
  }

  const addMessage = (data, sender, socketIdSender) => {
    setMessages(prev => [...prev, { sender, data, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }])
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages(n => n + 1)
    }
    setTimeout(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 100)
  }

  const sendMessage = () => {
    if (!message.trim()) return
    socketRef.current.emit('chat-message', message, username)
    setMessage('')
    setShowEmoji(false)
  }

  const sendEmoji = (emoji) => {
    socketRef.current.emit('chat-message', emoji, username)
    setShowEmoji(false)
  }

  const connect = () => {
    if (!username.trim()) return
    setAskForUsername(false)
    setVideo(videoAvailable)
    setAudio(audioAvailable)
    setMeetingStarted(true)
    connectToSocketServer()
  }

  const handleEndCall = () => {
    try { localVideoref.current.srcObject.getTracks().forEach(t => t.stop()) } catch (e) {}
    window.location.href = '/'
  }

  const togglePanel = (panel) => {
    if (activePanel === panel) { setActivePanel(null) }
    else { setActivePanel(panel); if (panel === 'chat') setNewMessages(0) }
  }

  if (askForUsername) {
    return (
      <div className="lobby-page">
        <div className="bg-orb orb1" /><div className="bg-orb orb2" />
        <div className="lobby-card">
          <div className="nav-logo" style={{justifyContent:'center', marginBottom:'1.5rem'}}>
            <span className="logo-icon">⬡</span>
            <span className="logo-text">MeetMe</span>
          </div>
          <h2 className="lobby-title">Join Meeting</h2>
          <p className="lobby-sub">Enter your name to join this video call</p>
          <div className="lobby-preview">
            <video ref={localVideoref} autoPlay muted className="lobby-video" />
            <div className="lobby-video-label">📹 Preview</div>
          </div>
          <input
            className="lobby-input"
            placeholder="Your name..."
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && connect()}
          />
          <button className="btn-primary" style={{width:'100%', marginTop:'1rem'}} onClick={connect}>
            Join Meeting →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="meet-page">
      {/* Top bar */}
      <div className="meet-topbar">
        <div className="nav-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">MeetMe</span>
        </div>
        <div className="meet-topbar-center">
          <div className="meet-timer">⏱ {formatTimer(elapsedSeconds)}</div>
          <div className="meet-participants">👥 {participantCount + 1} participant{participantCount !== 0 ? 's' : ''}</div>
        </div>
        <div className="meet-topbar-right">
          <span className="meet-user-badge">👤 {username}</span>
        </div>
      </div>

      {/* Main area */}
      <div className="meet-main">
        {/* Video grid */}
        <div className={`meet-video-area ${activePanel ? 'with-panel' : ''}`}>
          {/* Local video */}
          <div className="local-video-container">
            <video ref={localVideoref} autoPlay muted className="local-video" />
            <div className="video-label">You · {username}</div>
            {!video && <div className="video-off-overlay">📷 Camera Off</div>}
          </div>

          {/* Remote videos */}
          {videos.map((v) => (
            <div key={v.socketId} className="remote-video-container">
              <video
                ref={ref => { if (ref && v.stream) ref.srcObject = v.stream }}
                autoPlay
                className="remote-video"
              />
              <div className="video-label">Participant</div>
            </div>
          ))}

          {videos.length === 0 && (
            <div className="waiting-card">
              <div className="waiting-icon">🔗</div>
              <p>Waiting for others to join...</p>
              <small>Share your meeting link to invite participants</small>
            </div>
          )}
        </div>

        {/* Side panel */}
        {activePanel === 'chat' && (
          <div className="side-panel">
            <div className="panel-header">
              <span>💬 Chat</span>
              <button className="panel-close" onClick={() => setActivePanel(null)}>✕</button>
            </div>
            <div className="chat-messages">
              {messages.length === 0
                ? <div className="chat-empty">No messages yet. Say hello! 👋</div>
                : messages.map((msg, i) => (
                    <div key={i} className={`chat-msg ${msg.sender === username ? 'own' : ''}`}>
                      <div className="chat-msg-sender">{msg.sender}</div>
                      <div className="chat-msg-bubble">{msg.data}</div>
                      <div className="chat-msg-time">{msg.time}</div>
                    </div>
                  ))
              }
              <div ref={chatBottomRef} />
            </div>
            <div className="chat-input-area">
              {showEmoji && (
                <div className="emoji-picker">
                  {EMOJIS.map(e => (
                    <button key={e} className="emoji-btn" onClick={() => sendEmoji(e)}>{e}</button>
                  ))}
                </div>
              )}
              <div className="chat-input-row">
                <button className="emoji-toggle" onClick={() => setShowEmoji(!showEmoji)}>😊</button>
                <input
                  className="chat-input"
                  placeholder="Type a message..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button className="chat-send" onClick={sendMessage}>➤</button>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'notes' && (
          <div className="side-panel">
            <div className="panel-header">
              <span>📝 Meeting Notes</span>
              <button className="panel-close" onClick={() => setActivePanel(null)}>✕</button>
            </div>
            <div className="notes-area">
              <p className="notes-hint">Your notes are saved locally during this meeting.</p>
              <textarea
                className="notes-textarea"
                placeholder="Type your meeting notes here...&#10;&#10;• Action items&#10;• Key decisions&#10;• Follow-ups"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <button className="notes-copy" onClick={() => navigator.clipboard.writeText(notes)}>📋 Copy Notes</button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="meet-controls">
        <button className={`ctrl-btn ${!video ? 'ctrl-off' : ''}`} onClick={() => setVideo(!video)} title="Toggle Camera">
          {video ? '📹' : '📷'}
          <span>{video ? 'Camera' : 'Cam Off'}</span>
        </button>

        <button className={`ctrl-btn ${!audio ? 'ctrl-off' : ''}`} onClick={() => setAudio(!audio)} title="Toggle Mic">
          {audio ? '🎙️' : '🔇'}
          <span>{audio ? 'Mic' : 'Muted'}</span>
        </button>

        {screenAvailable && (
          <button className={`ctrl-btn ${screen ? 'ctrl-active' : ''}`} onClick={() => setScreen(!screen)} title="Screen Share">
            🖥️<span>{screen ? 'Stop Share' : 'Share'}</span>
          </button>
        )}

        <button
          className={`ctrl-btn ${activePanel === 'chat' ? 'ctrl-active' : ''}`}
          onClick={() => togglePanel('chat')}
          title="Chat"
        >
          💬
          {newMessages > 0 && <span className="ctrl-badge">{newMessages}</span>}
          <span>Chat</span>
        </button>

        <button
          className={`ctrl-btn ${activePanel === 'notes' ? 'ctrl-active' : ''}`}
          onClick={() => togglePanel('notes')}
          title="Notes"
        >
          📝<span>Notes</span>
        </button>

        <button className="ctrl-btn ctrl-end" onClick={handleEndCall} title="End Call">
          📵<span>End</span>
        </button>
      </div>
    </div>
  )
}
