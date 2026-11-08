import React from 'react';

interface FenecLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const FenecLogo: React.FC<FenecLogoProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const sizeMap = {
    xs: { icon: 'w-6 h-6', text: 'text-sm', sub: 'text-[8px]' },
    sm: { icon: 'w-8 h-8', text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Square Emblem with Gold Border */}
      <div className={`relative ${currentSize.icon} flex-shrink-0 drop-shadow-[0_4px_12px_rgba(234,179,8,0.3)] transition-transform group-hover:scale-105`}>
        <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="sqLogoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="25%" stopColor="#FACC15" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="75%" stopColor="#CA8A04" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
            <linearGradient id="sqLogoNavy" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="40%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="sqLogoSheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.08" />
              <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Outer Rounded Square with Gold Border */}
          <rect 
            x="36" y="36" width="440" height="440" rx="92" 
            fill="url(#sqLogoNavy)" 
            stroke="url(#sqLogoGold)" 
            strokeWidth="20" 
          />

          {/* Inner Inset Trim */}
          <rect 
            x="56" y="56" width="400" height="400" rx="74" 
            fill="none" 
            stroke="url(#sqLogoGold)" 
            strokeWidth="3.5" 
            strokeOpacity="0.6" 
          />

          {/* Diagonal Glass Sheen */}
          <path d="M56 180 L180 56 L340 56 L56 340 Z" fill="url(#sqLogoSheen)" />

          {/* Apex Star */}
          <g transform="translate(256, 110)">
            <path d="M0 -22 L6 -6 L22 0 L6 6 L0 22 L-6 6 L-22 0 L-6 -6 Z" fill="url(#sqLogoGold)" />
            <circle cx="0" cy="0" r="4" fill="#FFFFFF" opacity="0.9" />
          </g>

          {/* Stylized Monogram F */}
          <g transform="translate(182, 142)">
            {/* Pillar */}
            <path d="M14 12 C14 5 19 0 26 0 L68 0 C75 0 80 5 80 12 L80 236 C80 243 75 248 68 248 L26 248 C19 248 14 243 14 236 Z" fill="url(#sqLogoGold)" />
            {/* Top Bar */}
            <path d="M80 0 L154 0 C162 0 168 6 166 14 L160 48 C158 54 152 60 144 60 L80 60 Z" fill="url(#sqLogoGold)" />
            {/* Mid Bar */}
            <path d="M80 102 L132 102 C140 102 146 108 144 116 L138 142 C136 148 130 152 122 152 L80 152 Z" fill="url(#sqLogoGold)" />
            {/* Chisel Highlights */}
            <path d="M22 6 L64 6" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.5" />
            <path d="M86 6 L148 6" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.5" />
            <path d="M86 108 L128 108" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5" />
          </g>

          {/* Laurels */}
          <g stroke="url(#sqLogoGold)" strokeWidth="4" strokeLinecap="round">
            <path d="M120 340 C136 380 174 414 220 428" />
            <path d="M392 340 C376 380 338 414 292 428" />
          </g>
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`${currentSize.text} font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 font-sans leading-none drop-shadow-sm`}>
              FENEC
            </span>
            <span className="text-[10px] bg-blue-950 text-cyan-300 font-extrabold px-1.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest shadow-sm">
              Digital
            </span>
          </div>
          <p className={`${currentSize.sub} text-slate-400 font-semibold tracking-tight uppercase leading-tight mt-0.5`}>
            Faculdade & Educação Continuada
          </p>
        </div>
      )}
    </div>
  );
};
