import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { ValidatorView } from './components/ValidatorView';
import { AdminPanel } from './components/AdminPanel';
import { AppInstallPrompt } from './components/AppInstallPrompt';
import { AppUpdateManager } from './components/AppUpdateManager';

export function App() {
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const getInitialCode = (): string => {
    // 1. Check window.location.search
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('codigo')) {
      return searchParams.get('codigo')!;
    }
    
    // 2. Check window.location.hash (e.g. #/validar?codigo=... or #codigo=...)
    if (window.location.hash) {
      const hashStr = window.location.hash.includes('?')
        ? window.location.hash.split('?')[1]
        : window.location.hash.replace('#', '');
      const hashParams = new URLSearchParams(hashStr);
      if (hashParams.get('codigo')) {
        return hashParams.get('codigo')!;
      }
    }
    return '';
  };

  const initialCode = getInitialCode();

  const [currentTab, setCurrentTab] = useState<'student' | 'validator' | 'admin'>(() => {
    if (initialCode || window.location.pathname.includes('validar')) {
      return 'validator';
    }
    return 'student';
  });

  const [initialValidatorCode, setInitialValidatorCode] = useState<string>(initialCode);

  useEffect(() => {
    const handleUrlChange = () => {
      const code = getInitialCode();
      if (code) {
        setInitialValidatorCode(code);
        setCurrentTab('validator');
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // When validator is requested with a specific code
  const handleOpenValidator = (codigoUso: string) => {
    setInitialValidatorCode(codigoUso);
    setCurrentTab('validator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        onOpenInstallModal={() => {
          // Clear dismissed flag so banner/modal opens
          localStorage.removeItem('fenec_install_dismissed');
          window.location.reload();
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {currentTab === 'student' && (
          <StudentPortal onOpenValidator={handleOpenValidator} />
        )}

        {currentTab === 'validator' && (
          <ValidatorView initialCodigo={initialValidatorCode} />
        )}

        {currentTab === 'admin' && (
          <AdminPanel onOpenValidator={handleOpenValidator} />
        )}
      </main>

      {/* Android & iOS App Install Banner & Modal Guide */}
      <AppInstallPrompt />

      {/* Forced PWA & Browser Auto-Update Manager */}
      <AppUpdateManager />

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-400 no-print">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex-shrink-0">
              <img src="./logo-fenec.svg" alt="FENEC" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-slate-300">
              FENEC — Faculdade e Escola de Negócios e Educação Continuada
            </span>
          </div>

          <p className="text-slate-400">
            Validação oficial conforme Lei Federal nº 12.933/2013 e Decreto nº 8.537/2015.
          </p>
        </div>
      </footer>
    </div>
  );
}
export default App;
