import { useState, useRef } from 'react'

const LANGUAGES = [
  { value:'python', label:'Python', ext:'.py' },
  { value:'java',   label:'Java',   ext:'.java' },
  { value:'c',      label:'C',      ext:'.c' },
  { value:'cpp',    label:'C++',    ext:'.cpp' },
  { value:'javascript', label:'JS', ext:'.js' },
]

const SAMPLES = {
  python: `import os
import pickle
import sqlite3

# Security issue — hardcoded credentials
DB_PASSWORD = "admin123"
SECRET_KEY = "sk-prod-abc123xyz"

def get_user(user_id):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # SQL injection vulnerability
    query = "SELECT * FROM users WHERE id = " + user_id
    cursor.execute(query)
    return cursor.fetchone()

def process_data(raw_data):
    # Unsafe deserialization
    return pickle.loads(raw_data)

def run_task(task_name):
    # Command injection risk
    os.system("run_task.sh " + task_name)

def calculate(x, y):
    # No zero division check
    return x / y

def read_config(path):
    # File not closed properly
    f = open(path, 'r')
    data = f.read()
    return data

try:
    result = calculate(10, 0)
except:
    pass`,

  java: `public class UserService {
    private static final String API_KEY = "sk-1234567890abcdef";
    private static final String DB_PASS = "root123";

    public User findUser(String userId) {
        try {
            String query = "SELECT * FROM users WHERE id = " + userId;
            Statement stmt = connection.createStatement();
            return stmt.executeQuery(query);
        } catch (Exception e) {
            // swallowing exception
        }
        return null;
    }

    public int divide(int a, int b) {
        return a / b;
    }

    public void executeCommand(String cmd) {
        Runtime.getRuntime().exec(cmd);
    }
}`,

  c: `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

char* SECRET = "password123";

void copy_input(char *input) {
    char buffer[16];
    strcpy(buffer, input);
    printf("Input: %s\\n", buffer);
}

int divide(int a, int b) {
    return a / b;
}

int main() {
    char *data = malloc(256);
    int arr[5];
    arr[10] = 42;

    char cmd[100];
    gets(cmd);

    copy_input("this is a very long string that overflows");
    divide(10, 0);

    return 0;
}`,

  cpp: `#include <iostream>
#include <string.h>
#include <cstdlib>

class DataManager {
public:
    char* buffer;
    char* secret = "hardcoded_key_123";

    DataManager(const char* data) {
        buffer = new char[32];
        strcpy(buffer, data);
    }

    void execute(const char* cmd) {
        system(cmd);
    }

    int compute(int x, int y) {
        return x / y;
    }
};

int main() {
    DataManager* dm = new DataManager("overflow_this_buffer_now");
    dm->execute("ls");
    dm->compute(5, 0);
    return 0;
}`,

  javascript: `const express = require('express');
const app = express();

const API_SECRET = "sk-prod-secret-key-123";
const DB_PASSWORD = "admin_pass_456";

app.get('/user', (req, res) => {
    const userId = req.query.id;
    // SQL injection
    const query = "SELECT * FROM users WHERE id = " + userId;
    db.query(query, (err, result) => {
        if (err) throw err;
        // XSS vulnerability
        res.send('<div>' + result.name + '</div>');
    });
});

app.post('/run', (req, res) => {
    const cmd = req.body.command;
    // Command injection
    eval(cmd);
});

function divide(a, b) {
    return a / b;
}

// Prototype pollution
function merge(target, source) {
    for (let key in source) {
        target[key] = source[key];
    }
}

console.log("Server started");
divide(10, 0);`,
}

export function EditorPanel({ onReview, loading }) {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [tab, setTab] = useState('paste')
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFile = (f) => {
    setError('')
    const maxSize = 50 * 1024
    if (f.size > maxSize) {
      setError('File too large. Maximum size is 50KB.')
      return
    }
    const ext = f.name.split('.').pop().toLowerCase()
    const extMap = { py:'python', java:'java', c:'c', cpp:'cpp', cc:'cpp', h:'c', hpp:'cpp', js:'javascript', jsx:'javascript' }
    const supported = ['py','java','c','cpp','cc','h','hpp','js','jsx']
    if (!supported.includes(ext)) {
      setError(`Unsupported file type .${ext}. Supported: .py .java .c .cpp .js`)
      return
    }
    if (extMap[ext]) setLanguage(extMap[ext])
    setFile(f)
  }

  const handleLanguageSwitch = (lang) => {
    setLanguage(lang)
    setCode('')
    setFile(null)
    setError('')
  }

  const handleSample = () => {
    setCode(SAMPLES[language])
    setError('')
  }

  const handleSubmit = () => {
    setError('')
    if (tab === 'paste') {
      if (!code.trim()) { setError('Please paste some code before analyzing.'); return }
      if (code.length > 50000) { setError('Code too large. Maximum 50,000 characters.'); return }
      onReview({ code, language })
    } else {
      if (!file) { setError('Please upload a file before analyzing.'); return }
      onReview({ file, language })
    }
  }

  const hasCode = tab==='paste' ? code.trim().length>0 : file!==null

  const langBtn = (l) => ({
    padding:'5px 11px', borderRadius:6,
    border: language===l.value ? '1px solid var(--green-border)' : '1px solid var(--bd)',
    background: language===l.value ? 'var(--green-bg)' : 'transparent',
    color: language===l.value ? 'var(--green)' : 'var(--text-muted)',
    fontFamily:'var(--font-mono)', fontSize:11,
    fontWeight: language===l.value ? 600 : 400,
    cursor:'pointer', transition:'all 0.15s',
  })

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--surface)'}}>

      {/* Toolbar */}
      <div style={{
        padding:'10px 14px',borderBottom:'1px solid var(--bd)',
        display:'flex',alignItems:'center',justifyContent:'space-between',
        gap:8,flexWrap:'wrap',background:'var(--bg3)',
      }}>
        <div style={{display:'flex',background:'var(--surface2)',borderRadius:7,padding:3,gap:2}}>
          {['paste','upload'].map(t=>(
            <button key={t} onClick={()=>{setTab(t);setError('')}} style={{
              padding:'5px 12px',borderRadius:5,border:'none',
              background:tab===t?'var(--surface)':'transparent',
              color:tab===t?'var(--text-primary)':'var(--text-muted)',
              fontFamily:'var(--font-ui)',fontSize:12,
              fontWeight:tab===t?500:400,cursor:'pointer',transition:'all 0.15s',
              boxShadow:tab===t?'0 1px 3px rgba(0,0,0,0.3)':'none',
            }}>
              {t==='paste'?'Paste code':'Upload file'}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {LANGUAGES.map(l=>(
            <button key={l.value} onClick={()=>handleLanguageSwitch(l.value)} style={langBtn(l)}
              onMouseEnter={e=>{if(language!==l.value){e.target.style.borderColor='var(--green-border)';e.target.style.color='var(--green)'}}}
              onMouseLeave={e=>{if(language!==l.value){e.target.style.borderColor='var(--bd)';e.target.style.color='var(--text-muted)'}}}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding:'8px 14px',background:'var(--bug-bg)',
          borderBottom:'1px solid var(--bug-border)',
          fontSize:12,color:'var(--bug)',
          display:'flex',alignItems:'center',gap:6,
        }}>
          <span>⚠</span> {error}
        </div>
      )}

      {/* Editor area */}
      {tab==='paste'?(
        <textarea
          value={code}
          onChange={e=>{setCode(e.target.value);setError('')}}
          placeholder={`// Paste your ${LANGUAGES.find(l=>l.value===language)?.label} code here...`}
          spellCheck={false}
          style={{
            flex:1,background:'var(--bg2)',
            color:'var(--text-secondary)',
            fontFamily:'var(--font-mono)',fontSize:13,
            lineHeight:1.8,border:'none',outline:'none',
            padding:'16px 20px',resize:'none',tabSize:2,
          }}
        />
      ):(
        <div style={{flex:1,padding:16,display:'flex',flexDirection:'column'}}>
          {!file?(
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0])}}
              onClick={()=>fileRef.current.click()}
              style={{
                flex:1,
                border:`1.5px dashed ${dragOver?'var(--green)':'var(--bd2)'}`,
                borderRadius:10,display:'flex',flexDirection:'column',
                alignItems:'center',justifyContent:'center',
                gap:12,cursor:'pointer',
                background:dragOver?'var(--green-bg)':'var(--bg2)',
                transition:'all 0.2s',padding:32,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 20V10M8 14l6-6 6 6"/><path d="M4 22h20"/>
              </svg>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:14,fontWeight:500,color:'var(--text-primary)',marginBottom:4}}>Drop your file here</div>
                <div style={{fontSize:12,color:'var(--text-tertiary)'}}>or click to browse</div>
              </div>
              <div style={{
                fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)',
                background:'var(--bg3)',padding:'3px 10px',borderRadius:4,border:'1px solid var(--bd)',
              }}>.py · .java · .c · .cpp · .js</div>
              <input ref={fileRef} type="file" accept=".py,.java,.c,.cpp,.cc,.h,.hpp,.js,.jsx"
                style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])}/>
            </div>
          ):(
            <div style={{
              background:'var(--bg3)',border:'1px solid var(--bd)',
              borderRadius:8,padding:'12px 14px',
              display:'flex',alignItems:'center',gap:12,
            }}>
              <div style={{
                width:34,height:34,background:'var(--green-bg)',
                border:'1px solid var(--green-border)',borderRadius:7,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,
              }}>📄</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:500,fontSize:13,color:'var(--text-primary)'}}>{file.name}</div>
                <div style={{fontSize:11,color:'var(--text-tertiary)',marginTop:2,fontFamily:'var(--font-mono)'}}>
                  {(file.size/1024).toFixed(1)} KB · {language}
                </div>
              </div>
              <button onClick={()=>{setFile(null);setError('')}} style={{
                background:'transparent',border:'none',
                color:'var(--text-muted)',cursor:'pointer',fontSize:16,padding:4,
              }}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* Footer bar */}
      <div style={{
        padding:'10px 14px',borderTop:'1px solid var(--bd)',
        display:'flex',alignItems:'center',
        justifyContent:'space-between',gap:8,
        background:'var(--bg3)',flexWrap:'wrap',
      }}>
        <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)'}}>
          {tab==='paste'?`${code.length.toLocaleString()} chars`:file?file.name:'No file selected'}
        </span>
        <div style={{display:'flex',gap:8}}>
          <button
            onClick={handleSample}
            style={{
              padding:'7px 14px',borderRadius:6,
              border:'1px solid var(--bd2)',background:'var(--surface2)',
              color:'var(--text-secondary)',fontFamily:'var(--font-ui)',
              fontSize:12,fontWeight:500,cursor:'pointer',
              transition:'all 0.15s',whiteSpace:'nowrap',
            }}
            onMouseEnter={e=>{e.target.style.borderColor='var(--green)';e.target.style.color='var(--green)'}}
            onMouseLeave={e=>{e.target.style.borderColor='var(--bd2)';e.target.style.color='var(--text-secondary)'}}
          >
            Try Sample Code
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding:'7px 20px',borderRadius:6,border:'none',
              background:hasCode&&!loading?'var(--green)':'var(--surface2)',
              color:hasCode&&!loading?'#fff':'var(--text-muted)',
              fontFamily:'var(--font-ui)',fontSize:13,fontWeight:600,
              cursor:hasCode&&!loading?'pointer':'not-allowed',
              transition:'all 0.2s',opacity:!hasCode?0.5:1,
              whiteSpace:'nowrap',
            }}
            onMouseEnter={e=>{if(hasCode&&!loading)e.target.style.background='var(--green2)'}}
            onMouseLeave={e=>{if(hasCode&&!loading)e.target.style.background='var(--green)'}}
          >
            {loading?'Analyzing...':'Analyze Code'}
          </button>
        </div>
      </div>
    </div>
  )
}