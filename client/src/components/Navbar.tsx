import React, { useState } from 'react';
import { GraduationCap, ShieldCheck, Lock, Smartphone } from 'lucide-react';
import { FenecLogo } from './FenecLogo';

interface NavbarProps {
  currentTab: 'student' | 'validator' | 'admin';
  onChangeTab: (tab: 'student' | 'validator' | 'admin') => void;
  onOpenInstallModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  onOpenInstallModal
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 border-b border-slate-800 backdrop-blur shadow-lg no-print">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div 
          onClick={() => onChangeTab('student')}
          className="cursor-pointer group select-none"
        >
          <FenecLogo size="sm" />
        </div>

        {/* Right side navigation & Install */}
        <div className="flex items-center gap-2">
          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all"
              title="Instalar aplicativo FENEC"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Instalar App</span>
            </button>
          )}

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => onChangeTab('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'student'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-102'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Aluno</span>
            </button>

            <button
              onClick={() => onChangeTab('validator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'validator'
                  ? 'bg-blue-600 text-white shadow-md scale-102'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Validador</span>
            </button>

            <button
              onClick={() => onChangeTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md scale-102'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Secretaria</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
