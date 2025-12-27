
import React from 'react';

export const StartIcon = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" className="drop-shadow-lg">
    <defs>
      <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <circle 
      cx="50" cy="50" r="45" 
      fill="none" 
      stroke="#f59e0b" 
      strokeWidth="1" 
      strokeDasharray="4 4" 
      className="animate-rotate-dashed"
    />
    <path 
      d="M40 30 L75 50 L40 70 Z" 
      fill="url(#amberGradient)" 
      stroke="#fef3c7"
      strokeWidth="1"
    />
  </svg>
);

export const StopIcon = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" className="drop-shadow-lg">
    <defs>
      <linearGradient id="rustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#b91c1c', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#7f1d1d', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <rect 
      x="30" y="30" width="40" height="40" 
      fill="url(#rustGradient)" 
      stroke="#fecaca"
      strokeWidth="2"
      rx="4"
    />
    <circle 
      cx="50" cy="50" r="45" 
      fill="none" 
      stroke="#7f1d1d" 
      strokeWidth="2" 
      strokeDasharray="8 4"
    />
  </svg>
);
