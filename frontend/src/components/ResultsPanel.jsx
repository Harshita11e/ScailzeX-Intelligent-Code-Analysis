import { useState } from 'react'

const TYPE_STYLE = {
  bug:         { color:'var(--bug)',         bg:'var(--bug-bg)',         border:'var(--bug-border)',         label:'Bug' },
  security:    { color:'var(--security)',    bg:'var(--security-bg)',    border:'var(--security-border)',    label:'Security' },
  performance: { color:'var(--performance)', bg:'var(--performance-bg)', border:'var(--performance-border)', label:'Performance' },
  style:       { color:'var(--style)',       bg:'var(--style-bg)',       border:'var(--style-border)',       label:'Style' },
}

const SEV_STYLE = {
  critical: { color:'var(--critical)', bg:'var(--critical-bg)', border:'var(--critical-border)', label:'Critical' },
  high:     { color:'var(--high)',     bg:'var(--high-bg)',     border:'var(--high-border)',     label:'High' },
  medium:   { color:'var(--medium)',   bg:'var(--medium-bg)',   border:'var(--medium-border)',   label:'Medium' },
  low:      { color:'var(--low)',      bg:'var(--low-bg)',      border:'var(--low-border)',      label:'Low' },
}

function Badge({ label, color, bg, border }) {
  return (
    <span style={{
      fontSize:11,fontWeight:600,color,
      background:bg,border:`1px solid ${border}`,
      padding:'2px 8px',borderRadius:4,
      textTransform:'uppercase',letterSpacing:0.5,
      flexShrink:0,whiteSpace:'nowrap',
    }}>{label}</span>
  )
}

function Pill({ count, label, color, bg, border }) {
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',gap:5,
      fontSize:12,fontWeight:500,color,background:bg,
      border:`1px solid ${border}`,padding:'3px 10px',borderRadius:20,
    }}>
      <span style={{width:6,height:6,borderRadius:'50%',background:color,display:'inline-block'}}/>
      {count} {label}
    </span>
  )
}

function ScoreRing({ score }) {
  const r = 38
  const circ = 2*Math.PI*r
  const fill = (score/100)*circ
  const color = score>=80?'var(--positive)':score>=60?'#10b981':score>=40?'var(--medium)':'var(--critical)'
  const label = score>=80?'Excellent':score>=60?'Good':score>=40?'Fair':'Needs Work'
  return (
    <div style={{display:'flex',alignItems:'center',gap:20}}>
      <div style={{position:'relative',width:92,height:92,flexShrink:0}}>
        <svg width="92" height="92" viewBox="0 0 92 92">
          <circle cx="46" cy="46" r={r} fill="none" stroke="var(--bd2)" strokeWidth="6"/>
          <circle cx="46" cy="46" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 46 46)"
            style={{transition:'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)'}}
          />
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <div style={{fontSize:24,fontWeight:700,color,lineHeight:1}}>{score}</div>
          <div style={{fontSize:10,color:'var(--text-muted)',marginTop:1}}>/100</div>
        </div>
      </div>
      <div>
        <div style={{fontSize:22,fontWeight:700,color:'var(--text-primary)',marginBottom:3,letterSpacing:'-0.3px'}}>{label}</div>
        <div style={{fontSize:13,color:'var(--text-tertiary)'}}>Overall code quality</div>
      </div>
    </div>
  )
}

function CodeDiff({ before, after, explanation }) {
  const [cb, setCb] = useState(false)
  const [ca, setCa] = useState(false)
  const copy = (text, fn) => { navigator.clipboard.writeText(text); fn(true); setTimeout(()=>fn(false),2000) }

  const block = (code, label, color, bg, border, copied, onCopy) => (
    <div style={{marginBottom:8}}>
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'5px 12px',background:bg,
        border:`1px solid ${border}`,borderBottom:'none',
        borderRadius:'7px 7px 0 0',
      }}>
        <span style={{fontSize:10,fontWeight:700,color,letterSpacing:1}}>{label}</span>
        <button onClick={onCopy} style={{
          background:'transparent',border:'none',
          fontSize:11,color:copied?'var(--positive)':'var(--text-muted)',
          cursor:'pointer',fontFamily:'var(--font-ui)',fontWeight:500,
        }}>{copied?'✓ Copied':'Copy'}</button>
      </div>
      <pre style={{
        margin:0,padding:'10px 14px',
        background:'var(--bg2)',
        border:`1px solid ${border}`,
        borderRadius:'0 0 7px 7px',
        fontFamily:'var(--font-mono)',fontSize:12,
        lineHeight:1.8,color:'var(--text-secondary)',
        overflowX:'auto',whiteSpace:'pre-wrap',wordBreak:'break-word',
      }}>{code}</pre>
    </div>
  )

  return (
    <div style={{marginTop:12}}>
      {block(before,'BEFORE','var(--critical)','var(--critical-bg)','var(--critical-border)',cb,()=>copy(before,setCb))}
      {block(after,'AFTER','var(--positive)','var(--positive-bg)','var(--positive-border)',ca,()=>copy(after,setCa))}
      {explanation&&(
        <div style={{
          padding:'8px 12px',
          background:'var(--green-bg)',border:'1px solid var(--green-border)',
          borderRadius:6,fontSize:12,color:'var(--text-secondary)',lineHeight:1.6,
        }}>
          <span style={{color:'var(--green)',fontWeight:600,marginRight:6}}>Why this works:</span>
          {explanation}
        </div>
      )}
    </div>
  )
}

function IssueCard({ issue, index }) {
  const [open, setOpen] = useState(false)
  const sev = SEV_STYLE[issue.severity]||SEV_STYLE.low
  const typ = TYPE_STYLE[issue.type]||TYPE_STYLE.style

  return (
    <div style={{
      border:`1px solid var(--bd)`,
      borderLeft:`3px solid ${sev.color}`,
      borderRadius:8,overflow:'hidden',
      animation:'fadeUp 0.3s ease forwards',
      animationDelay:`${index*0.04}s`,opacity:0,
      transition:'border-color 0.15s',
    }}
    onMouseEnter={e=>e.currentTarget.style.borderColor='var(--bd2)'}
    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--bd)'}
    >
      <button
        onClick={()=>setOpen(!open)}
        style={{
          width:'100%',display:'flex',alignItems:'center',gap:8,
          padding:'12px 14px',
          background:open?'var(--bg3)':'var(--surface)',
          border:'none',cursor:'pointer',textAlign:'left',
          transition:'background 0.15s',
        }}
      >
        <div style={{fontSize:13,fontWeight:500,color:'var(--text-primary)',flex:1,lineHeight:1.4}}>
          {issue.title}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
          {issue.line&&(
            <span style={{
              fontFamily:'var(--font-mono)',fontSize:10,
              color:'var(--text-tertiary)',background:'var(--bg3)',
              border:'1px solid var(--bd)',padding:'1px 7px',borderRadius:4,
            }}>L{issue.line}</span>
          )}
          <Badge label={typ.label} color={typ.color} bg={typ.bg} border={typ.border}/>
          <Badge label={sev.label} color={sev.color} bg={sev.bg} border={sev.border}/>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
            stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"
            style={{transform:open?'rotate(90deg)':'none',transition:'transform 0.2s',flexShrink:0}}>
            <path d="M3.5 1.5l4 4-4 4"/>
          </svg>
        </div>
      </button>

      {open&&(
        <div style={{padding:'0 14px 14px',borderTop:'1px solid var(--bd)',background:'var(--surface)'}}>
          <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.7,margin:'12px 0'}}>
            {issue.description}
          </p>
          {issue.before&&issue.after?(
            <CodeDiff before={issue.before} after={issue.after} explanation={issue.explanation}/>
          ):(
            <div style={{
              background:'var(--green-bg)',border:'1px solid var(--green-border)',
              borderRadius:7,padding:'10px 14px',
            }}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--green)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>
                How to fix it
              </div>
              <div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6}}>{issue.suggestion}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ResultsPanel({ result, onExportPDF }) {
  const stats = {
    critical: result.issues.filter(i=>i.severity==='critical').length,
    high:     result.issues.filter(i=>i.severity==='high').length,
    medium:   result.issues.filter(i=>i.severity==='medium').length,
    low:      result.issues.filter(i=>i.severity==='low').length,
  }

  return (
    <div style={{maxWidth:820,margin:'0 auto',padding:'32px 24px 48px',position:'relative'}}>

      {/* Header */}
      <div style={{marginBottom:28}}>
        <div style={{
          display:'flex',alignItems:'center',gap:8,marginBottom:12,flexWrap:'wrap',
        }}>
          <span style={{
            fontSize:11,fontWeight:600,letterSpacing:1.5,
            textTransform:'uppercase',color:'var(--text-muted)',
          }}>
            Review complete
          </span>
          <span style={{color:'var(--bd2)'}}>·</span>
          <span style={{fontSize:11,color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>
            {result.analysis_time}s
          </span>
          <span style={{color:'var(--bd2)'}}>·</span>
          <span style={{
            fontSize:11,fontWeight:600,color:'var(--green)',
            background:'var(--green-bg)',border:'1px solid var(--green-border)',
            padding:'1px 8px',borderRadius:4,fontFamily:'var(--font-mono)',
          }}>
            {result.language?.toUpperCase()}
          </span>
          {result.filename&&(
            <>
              <span style={{color:'var(--bd2)'}}>·</span>
              <span style={{fontSize:11,color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>{result.filename}</span>
            </>
          )}
        </div>
        <h1 style={{
          fontSize:20,fontWeight:600,
          color:'var(--text-primary)',
          lineHeight:1.4,letterSpacing:'-0.2px',
          borderLeft:'3px solid var(--green)',
          paddingLeft:12,
        }}>
          {result.summary}
        </h1>
      </div>

      {/* Score card */}
      <div style={{
        background:'var(--surface)',border:'1px solid var(--bd)',
        borderRadius:12,padding:24,marginBottom:24,
      }}>
        <ScoreRing score={result.score}/>
        <div style={{marginTop:24,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 28px'}}>
          {Object.entries(result.category_scores||{}).map(([cat,val])=>{
            const color = val>=80?'var(--positive)':val>=60?'#10b981':val>=40?'var(--medium)':'var(--critical)'
            return (
              <div key={cat}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                  <span style={{fontSize:12,color:'var(--text-secondary)',textTransform:'capitalize',fontWeight:500}}>{cat}</span>
                  <span style={{fontSize:12,fontFamily:'var(--font-mono)',color,fontWeight:600}}>{val}</span>
                </div>
                <div style={{height:4,background:'var(--bd2)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{
                    height:'100%',borderRadius:2,width:`${val}%`,background:color,
                    transition:'width 1s cubic-bezier(0.16,1,0.3,1)',
                  }}/>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:20}}>
          {stats.critical>0&&<Pill count={stats.critical} label="critical" color="var(--critical)" bg="var(--critical-bg)" border="var(--critical-border)"/>}
          {stats.high>0&&<Pill count={stats.high} label="high" color="var(--high)" bg="var(--high-bg)" border="var(--high-border)"/>}
          {stats.medium>0&&<Pill count={stats.medium} label="medium" color="var(--medium)" bg="var(--medium-bg)" border="var(--medium-border)"/>}
          {stats.low>0&&<Pill count={stats.low} label="low" color="var(--low)" bg="var(--low-bg)" border="var(--low-border)"/>}
        </div>
      </div>

      {/* Issues */}
      {result.issues.length>0&&(
        <div style={{marginBottom:24}}>
          <div style={{
            fontSize:13,fontWeight:600,color:'var(--text-primary)',
            marginBottom:12,display:'flex',alignItems:'center',gap:8,
          }}>
            Issues Found
            <span style={{
              fontSize:11,fontFamily:'var(--font-mono)',
              color:'var(--text-muted)',background:'var(--bg3)',
              border:'1px solid var(--bd)',padding:'1px 7px',borderRadius:10,
            }}>{result.issues.length}</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {result.issues.map((issue,i)=><IssueCard key={i} issue={issue} index={i}/>)}
          </div>
        </div>
      )}

      {/* Positives */}
      {result.positives?.length>0&&(
        <div style={{marginBottom:32}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:12}}>
            What's Working Well
          </div>
          <div style={{
            background:'var(--positive-bg)',border:'1px solid var(--positive-border)',
            borderRadius:10,padding:'14px 16px',
            display:'flex',flexDirection:'column',gap:8,
          }}>
            {result.positives.map((p,i)=>(
              <div key={i} style={{display:'flex',gap:10,fontSize:13,color:'var(--text-secondary)',lineHeight:1.6}}>
                <span style={{color:'var(--positive)',flexShrink:0,fontWeight:700}}>✓</span>
                {p}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minimal footer */}
      <div style={{
        marginTop:48,paddingTop:20,
        borderTop:'1px solid var(--bd)',
        textAlign:'center',
      }}>
        <div style={{fontSize:12,color:'var(--text-muted)',letterSpacing:0.3}}>
          ScailzeX · Intelligent Code Analysis · © 2026
        </div>
      </div>

      {/* Export PDF — fixed top right */}
      <div style={{position:'fixed',top:62,right:20,zIndex:90}}>
        <button
          onClick={onExportPDF}
          style={{
            display:'flex',alignItems:'center',gap:7,
            padding:'8px 14px',borderRadius:7,
            border:'1px solid var(--bd2)',
            background:'var(--surface)',
            color:'var(--text-secondary)',
            fontFamily:'var(--font-ui)',fontSize:12,fontWeight:500,
            cursor:'pointer',transition:'all 0.15s',
            boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--green)';e.currentTarget.style.color='var(--green)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bd2)';e.currentTarget.style.color='var(--text-secondary)'}}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="2" y="1" width="10" height="12" rx="1.5"/>
            <path d="M4.5 5h5M4.5 7.5h5M4.5 10h3"/>
          </svg>
          Export PDF
        </button>
      </div>
    </div>
  )
}
