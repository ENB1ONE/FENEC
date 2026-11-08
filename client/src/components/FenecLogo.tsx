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
            strokeWidth="18" 
          />

          {/* Inner Inset Trim */}
          <rect 
            x="56" y="56" width="400" height="400" rx="74" 
            fill="none" 
            stroke="url(#sqLogoGold)" 
            strokeWidth="3.5" 
            strokeOpacity="0.85" 
          />

          {/* 4-Point Star of Excellence at Top Apex */}
          <g transform="translate(256, 110)">
            <path d="M0 -24 L6 -6 L24 0 L6 6 L0 24 L-6 6 L-24 0 L-6 -6 Z" fill="#FEF08A" />
            <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" opacity="0.95" />
          </g>

          {/* Monogram F (Pillar & Arms) */}
          <g>
            <rect x="196" y="154" width="52" height="236" rx="8" fill="url(#sqLogoGold)" />
            <rect x="248" y="154" width="88" height="60" rx="8" fill="#FACC15" />
            <rect x="248" y="256" width="66" height="50" rx="8" fill="url(#sqLogoGold)" />
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
