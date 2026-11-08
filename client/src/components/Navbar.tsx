import React from 'react';
import { Award, GraduationCap, ShieldCheck, Lock } from 'lucide-react';

interface NavbarProps {
  currentTab: 'student' | 'validator' | 'admin';
  onChangeTab: (tab: 'student' | 'validator' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 border-b border-slate-800 backdrop-blur shadow-md no-print">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div 
          onClick={() => onChangeTab('student')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-md group-hover:scale-105 transition-transform">
            <Award className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-wider text-amber-300 font-sans leading-none">
                FENEC
              </span>
              <span className="text-[10px] bg-blue-600/30 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-blue-500/30 uppercase">
                Digital
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">
              Carteira Estudantil & Validador
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
          <button
            onClick={() => onChangeTab('student')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentTab === 'student'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Aluno</span>
          </button>

          <button
            onClick={() => onChangeTab('validator')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentTab === 'validator'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Validador</span>
          </button>

          <button
            onClick={() => onChangeTab('admin')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Secretaria</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
