export function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" rx="13" fill="#141414"/>
      <rect x="0.75" y="0.75" width="58.5" height="58.5" rx="12.25" stroke="#10b981" strokeOpacity="0.2" strokeWidth="1.5"/>
      <line x1="22" y1="10" x2="22" y2="50" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round"/>
      <line x1="22" y1="18" x2="48" y2="18" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round"/>
      <line x1="22" y1="30" x2="40" y2="30" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round"/>
      <line x1="22" y1="42" x2="34" y2="42" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="48" cy="18" r="2.4" fill="#10b981" opacity="0.85"/>
      <circle cx="40" cy="30" r="2.4" fill="#10b981" opacity="0.85"/>
      <circle cx="34" cy="42" r="2.4" fill="#10b981" opacity="0.85"/>
    </svg>
  )
}