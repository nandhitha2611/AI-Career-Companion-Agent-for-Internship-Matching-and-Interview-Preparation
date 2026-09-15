// src/components/BotIcon.jsx
import React from 'react';

export default function BotIcon({ className = "w-6 h-6" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue Speech Bubble Background */}
      <path 
        d="M50 5C25.15 5 5 23.36 5 46c0 12.83 6.42 24.36 16.4 32.22L12 95l18.52-6.17C35.88 91.2 42.74 92.5 50 92.5c24.85 0 45-18.36 45-41C95 23.36 74.85 5 50 5z" 
        fill="#2563EB" 
      />

      {/* Robot Screen Outline */}
      <rect 
        x="28" 
        y="30" 
        width="44" 
        height="28" 
        rx="8" 
        stroke="white" 
        strokeWidth="4" 
        fill="none" 
      />

      {/* Side Antennas / Ears */}
      <rect x="23" y="36" width="3" height="16" rx="1.5" fill="white" />
      <rect x="74" y="36" width="3" height="16" rx="1.5" fill="white" />

      {/* Left Eye */}
      <rect x="38" y="39" width="5" height="10" rx="2.5" fill="white" />

      {/* Right Eye */}
      <rect x="57" y="39" width="5" height="10" rx="2.5" fill="white" />

      {/* Smile */}
      <path 
        d="M45 51 C45 54, 55 54, 55 51" 
        stroke="white" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
    </svg>
  );
}