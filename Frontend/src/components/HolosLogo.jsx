export default function HolosLogo({ size = 22, className = "" }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      className={className}
    >
      {/* Outer Hexagon */}
      <path 
        d="M16 2L2.14359 10V22L16 30L29.8564 22V10L16 2Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinejoin="round" 
      />
      
      {/* Inner Structural Lines */}
      <path 
        d="M16 2V10M2.14359 10L9 14M29.8564 10L23 14" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round" 
        opacity="0.4" 
      />
      <path 
        d="M2.14359 22L16 14L29.8564 22" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinejoin="round" 
        opacity="0.4" 
      />
      <path 
        d="M16 30V22" 
        stroke="currentColor" 
        strokeWidth="1" 
        opacity="0.4" 
      />
      
      {/* Central Core */}
      <path 
        d="M16 11L11.67 13.5V18.5L16 21L20.33 18.5V13.5L16 11Z" 
        fill="currentColor" 
        fillOpacity="0.1" 
        stroke="currentColor" 
        strokeWidth="1.2" 
      />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
    </svg>
  );
}
