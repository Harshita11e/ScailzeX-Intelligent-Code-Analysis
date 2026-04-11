import { Logo } from './Logo'

export function Navbar({ theme, onToggleTheme, onHome, showBack }) {
  return (
    <nav style={{
      background:'var(--surface)',
      borderBottom:'1px solid var(--bd)',
      padding:'0 20px',
      height:54,
      display:'flex',
      alignItems:'center',
      justifyContent:'space-between',
      position:'sticky',
      top:0,
      zIndex:100,
      gap:12,
    }}>
      {/* Left */}
      <div
        onClick={showBack ? onHome : undefined}
        style={{
          display:'flex',alignItems:'center',gap:9,
          cursor:showBack?'pointer':'default',
          flexShrink:0,
          transition:'opacity 0.15s',
        }}
        onMouseEnter={e=>showBack&&(e.currentTarget.style.opacity='0.8')}
        onMouseLeave={e=>e.currentTarget.style.opacity='1'}
      >
        <Logo size={28}/>
        <span style={{
          fontFamily:'var(--font-ui)',
          fontSize:17,fontWeight:600,
          letterSpacing:'-0.3px',
          color:'var(--text-primary)',
        }}>ScailzeX</span>
        <span className="nav-version" style={{
          fontSize:10,color:'var(--text-muted)',
          fontFamily:'var(--font-mono)',
          background:'var(--bg3)',
          border:'1px solid var(--bd2)',
          padding:'1px 6px',borderRadius:4,
          letterSpacing:0.3,flexShrink:0,
        }}>v1.0</span>
      </div>

      {/* Center tagline — hidden on mobile */}
      <div className="nav-tagline" style={{
        fontSize:12,color:'var(--text-muted)',
        letterSpacing:0.3,
        position:'absolute',left:'50%',
        transform:'translateX(-50%)',
        whiteSpace:'nowrap',
        pointerEvents:'none',
      }}>
        Intelligent Code Analysis&nbsp;&nbsp;·&nbsp;&nbsp;Python&nbsp;&nbsp;·&nbsp;&nbsp;Java&nbsp;&nbsp;·&nbsp;&nbsp;C&nbsp;&nbsp;·&nbsp;&nbsp;C++&nbsp;&nbsp;·&nbsp;&nbsp;JavaScript
      </div>

      {/* Right */}
      <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
        {showBack && (
          <button
            onClick={onHome}
            style={{
              background:'var(--bg3)',border:'1px solid var(--bd2)',
              borderRadius:6,padding:'5px 12px',cursor:'pointer',
              color:'var(--text-secondary)',fontSize:13,
              fontFamily:'var(--font-ui)',fontWeight:500,
              whiteSpace:'nowrap',transition:'all 0.15s',
            }}
            onMouseEnter={e=>{e.target.style.borderColor='var(--green)';e.target.style.color='var(--green)'}}
            onMouseLeave={e=>{e.target.style.borderColor='var(--bd2)';e.target.style.color='var(--text-secondary)'}}
          >
            New Analysis
          </button>
        )}
        <button
          onClick={onToggleTheme}
          style={{
            background:'var(--bg3)',border:'1px solid var(--bd2)',
            borderRadius:6,padding:'5px 10px',cursor:'pointer',
            color:'var(--text-secondary)',fontSize:13,
            fontFamily:'var(--font-ui)',fontWeight:500,
            display:'flex',alignItems:'center',gap:6,
            whiteSpace:'nowrap',transition:'all 0.15s',
          }}
          onMouseEnter={e=>e.currentTarget.style.borderColor='var(--green)'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--bd2)'}
        >
          {theme==='dark'?(
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              <span className="nav-theme-text">Light</span>
            </>
          ):(
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              <span className="nav-theme-text">Dark</span>
            </>
          )}
        </button>
      </div>
    </nav>
  )
}