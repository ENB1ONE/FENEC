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
      {/* Heraldic Shield Crest */}
      <div className={`relative ${currentSize.icon} flex-shrink-0 drop-shadow-[0_4px_12px_rgba(234,179,8,0.25)] transition-transform group-hover:scale-105`}>
        <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="25%" stopColor="#FACC15" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="75%" stopColor="#CA8A04" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
            <linearGradient id="logoNavyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="40%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="logoSheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Base Shield */}
          <path 
            d="M256 36 C376 36 448 68 448 168 C448 308 356 418 256 468 C156 418 64 308 64 168 C64 68 136 36 256 36 Z" 
            fill="url(#logoNavyGrad)" 
            stroke="url(#logoGoldGrad)" 
            strokeWidth="16" 
            strokeLinejoin="round" 
          />

          {/* Inner Inset Trim */}
          <path 
            d="M256 58 C358 58 424 86 424 172 C424 294 344 394 256 438 C168 394 88 294 88 172 C88 86 154 58 256 58 Z" 
            fill="none" 
            stroke="url(#logoGoldGrad)" 
            strokeWidth="3" 
            strokeOpacity="0.6" 
          />

          {/* Subtle Sheen */}
          <path 
            d="M256 42 C362 42 434 72 434 164 C434 235 390 310 320 360 L180 120 C206 66 232 42 256 42 Z" 
            fill="url(#logoSheen)" 
          />

          {/* Apex Star */}
          <g transform="translate(256, 104)">
            <path d="M0 -20 L5 -5 L20 0 L5 5 L0 20 L-5 5 L-20 0 L-5 -5 Z" fill="url(#logoGoldGrad)" />
            <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
          </g>

          {/* Stylized Monogram F */}
          <g transform="translate(182, 142)">
            {/* Pillar */}
            <path d="M14 12 C14 5 19 0 26 0 L68 0 C75 0 80 5 80 12 L80 236 C80 243 75 248 68 248 L26 248 C19 248 14 243 14 236 Z" fill="url(#logoGoldGrad)" />
            {/* Top Bar */}
            <path d="M80 0 L154 0 C162 0 168 6 166 14 L160 48 C158 54 152 60 144 60 L80 60 Z" fill="url(#logoGoldGrad)" />
            {/* Mid Bar */}
            <path d="M80 102 L132 102 C140 102 146 108 144 116 L138 142 C136 148 130 152 122 152 L80 152 Z" fill="url(#logoGoldGrad)" />
            {/* Chisel Highlight */}
            <path d="M22 6 L64 6" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.5" />
            <path d="M86 6 L148 6" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.5" />
            <path d="M86 108 L128 108" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5" />
          </g>

          {/* Academic Laurels (Bottom Arcs) */}
          <g stroke="url(#logoGoldGrad)" strokeWidth="4" strokeLinecap="round">
            <path d="M120 310 C136 350 174 384 220 404" />
            <path d="M392 310 C376 350 338 384 292 404" />
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
