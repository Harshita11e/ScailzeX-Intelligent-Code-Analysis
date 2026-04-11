import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Navbar } from './components/Navbar'
import { EditorPanel } from './components/EditorPanel'
import { ResultsPanel } from './components/ResultsPanel'
import { exportPDF } from './components/exportPDF'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TYPEWRITER_LINES = [
  'Analyze your code in one scan.',
  'Find bugs before your users do.',
  'Review Python, Java, C, C++ and JS.',
  'Catch security holes instantly.',
  'Ship cleaner code every time.',
]

function getGreeting() {
  const h = new Date().getHours()
  if (h>=5&&h<12) return 'Good morning.'
  if (h>=12&&h<17) return 'Good afternoon.'
  if (h>=17&&h<21) return 'Good evening.'
  return 'Hello, developer.'
}

export default function App() {
  const [page, setPage] = useState('editor')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [theme, setTheme] = useState('dark')
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [lineIndex, setLineIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const fullText = TYPEWRITER_LINES[lineIndex]
    const speed = isDeleting ? 35 : 68
    timerRef.current = setTimeout(() => {
      if (!isDeleting && typed.length < fullText.length) {
        setTyped(fullText.slice(0, typed.length+1))
      } else if (!isDeleting && typed.length === fullText.length) {
        setTimeout(() => setIsDeleting(true), 2000)
      } else if (isDeleting && typed.length > 0) {
        setTyped(fullText.slice(0, typed.length-1))
      } else if (isDeleting && typed.length === 0) {
        setIsDeleting(false)
        setLineIndex(prev => (prev+1) % TYPEWRITER_LINES.length)
      }
    }, speed)
    return () => clearTimeout(timerRef.current)
  }, [typed, isDeleting, lineIndex])

  const toggleTheme = () => {
    const next = theme==='dark'?'light':'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const handleReview = async ({ code, language, file }) => {
    setError(null)
    setPage('loading')
    try {
      let response
      if (file) {
        const form = new FormData()
        form.append('file', file)
        response = await axios.post(`${API}/review/upload`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000,
        })
      } else {
        response = await axios.post(`${API}/review`, { code, language }, { timeout: 30000 })
      }
      setResult(response.data)
      setPage('results')
    } catch (err) {
      let msg = 'Review failed. Please try again.'
      if (err.code === 'ECONNABORTED') msg = 'Request timed out. Please try again.'
      else if (err.code === 'ERR_NETWORK') msg = 'Cannot connect to server. Make sure the backend is running.'
      else if (err.response?.status === 400) msg = err.response.data.detail || 'Invalid request.'
      else if (err.response?.status === 500) msg = 'Server error. Please try again.'
      else if (err.response?.data?.detail) msg = err.response.data.detail
      setError(msg)
      setPage('editor')
    }
  }

  const goHome = () => {
    setPage('editor')
    setResult(null)
    setError(null)
    setIsFirstVisit(false)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',background:'var(--bg)'}}>
      <Navbar theme={theme} onToggleTheme={toggleTheme} onHome={goHome} showBack={page==='results'}/>

      {/* Loading */}
      {page==='loading'&&(
        <div style={{
          flex:1,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',
          gap:20,animation:'fadeIn 0.2s ease forwards',
        }}>
          <div style={{fontSize:16,fontWeight:500,color:'var(--text-primary)'}}>
            Analyzing your code
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{
                width:10,height:10,borderRadius:'50%',
                background:'var(--green)',
                animation:`dot${i+1} 1.2s ease-in-out infinite`,
                animationDelay:`${i*0.2}s`,
              }}/>
            ))}
          </div>
        </div>
      )}

      {/* Editor page */}
      {page==='editor'&&(
        <div style={{flex:1,display:'flex',flexDirection:'column',animation:'fadeIn 0.25s ease forwards'}}>

          {/* Hero */}
          <div style={{
            padding:'48px 24px 36px',
            textAlign:'center',
            borderBottom:'1px solid var(--bd)',
          }}>
            {isFirstVisit&&(
              <div style={{
                fontSize:30,fontWeight:700,
                color:'var(--text-primary)',
                marginBottom:6,letterSpacing:'-0.5px',
                animation:'fadeUp 0.4s ease forwards',
              }}>
                {getGreeting()}
              </div>
            )}
            {isFirstVisit&&(
              <div style={{
                fontSize:17,fontWeight:500,
                color:'var(--green)',
                marginBottom:18,letterSpacing:0.2,
                animation:'fadeUp 0.4s ease 0.1s forwards',
                opacity:0,
              }}>
                Welcome to ScailzeX.
              </div>
            )}
            <div style={{
              fontSize:isFirstVisit?14:26,
              fontWeight:isFirstVisit?400:700,
              color:isFirstVisit?'var(--text-tertiary)':'var(--text-primary)',
              marginBottom:18,
              letterSpacing:isFirstVisit?0.2:'-0.3px',
              minHeight:isFirstVisit?22:36,
              display:'flex',alignItems:'center',justifyContent:'center',gap:2,
            }}>
              {typed}
              <span style={{
                display:'inline-block',width:2,
                height:isFirstVisit?14:26,
                background:'var(--green)',
                animation:'blink 1s step-end infinite',
                marginLeft:1,borderRadius:1,
              }}/>
            </div>
            <p style={{
              fontSize:14,color:'var(--text-tertiary)',
              maxWidth:480,margin:'0 auto',
              lineHeight:1.7,fontWeight:400,
            }}>
              ScailzeX finds bugs, security vulnerabilities, performance issues and style problems in seconds.
            </p>
          </div>

          {/* Error */}
          {error&&(
            <div style={{maxWidth:860,margin:'16px auto 0',width:'100%',padding:'0 24px'}}>
              <div style={{
                padding:'12px 16px',
                background:'var(--bug-bg)',border:'1px solid var(--bug-border)',
                borderRadius:8,fontSize:13,color:'var(--bug)',
                display:'flex',alignItems:'center',gap:8,
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="7" cy="7" r="6"/><path d="M7 4.5v3M7 9.5v.5"/>
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Editor */}
          <div style={{flex:1,maxWidth:860,margin:'24px auto 0',width:'100%',padding:'0 24px'}}>
            <div style={{
              background:'var(--surface)',border:'1px solid var(--bd)',
              borderRadius:12,overflow:'hidden',height:500,
              display:'flex',flexDirection:'column',
            }}>
              <EditorPanel onReview={handleReview} loading={false}/>
            </div>
          </div>

          {/* Footer */}
          <footer style={{
            marginTop:48,
            borderTop:'1px solid var(--bd)',
            padding:'28px 24px',
            textAlign:'center',
          }}>
            <div style={{fontSize:14,fontWeight:600,color:'var(--text-secondary)',marginBottom:6,letterSpacing:0.2}}>
              ScailzeX — Intelligent Code Analysis
            </div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:14,letterSpacing:0.3}}>
              © 2026 · All Rights Reserved · v1.0
            </div>
            <div style={{fontSize:12,color:'var(--text-tertiary)',marginBottom:14}}>
              Developed by Harshita Gupta
            </div>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:10,letterSpacing:1.5,textTransform:'uppercase'}}>
              Connect
            </div>
            <a
              href="https://www.linkedin.com/in/harshitagupta11"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:'inline-flex',alignItems:'center',gap:6,
                fontSize:13,color:'var(--green)',textDecoration:'none',fontWeight:500,
                border:'1px solid var(--green-border)',
                padding:'5px 16px',borderRadius:6,
                background:'var(--green-bg)',transition:'all 0.15s',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--green)';e.currentTarget.style.color='#fff'}}
              onMouseLeave={e=>{e.currentTarget.style.background='var(--green-bg)';e.currentTarget.style.color='var(--green)'}}
            >
              LinkedIn ↗
            </a>
          </footer>
        </div>
      )}

      {/* Results page */}
      {page==='results'&&result&&(
        <div style={{flex:1,overflowY:'auto',animation:'slideRight 0.4s cubic-bezier(0.16,1,0.3,1) forwards'}}>
          <ResultsPanel result={result} onExportPDF={()=>exportPDF(result)}/>
        </div>
      )}
    </div>
  )
}