import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, Check, X, Smartphone, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { FenecLogo } from './FenecLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const AppInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if already running as installed PWA (standalone)
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    setIsStandalone(checkStandalone);

    // 2. Platform Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Check if dismissed previously in localStorage (lasts 24h)
    const dismissedTime = localStorage.getItem('fenec_install_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 24 * 60 * 60 * 1000) {
      setDismissed(true);
    }

    // 3. Android / Chrome beforeinstallprompt event listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('fenec_install_dismissed', Date.now().toString());
  };

  const handleInstallAndroid = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalledSuccess(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error('Erro ao acionar prompt de instalação:', err);
        setShowAndroidModal(true);
      }
    } else {
      // Fallback instructions modal for Android browsers where event already fired or is manual
      setShowAndroidModal(true);
    }
  };

  // If already standalone (installed) and not in success flash, hide banner
  if (isStandalone && !installedSuccess) {
    return null;
  }

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* SUCCESS BANNER AFTER INSTALLATION                             */}
      {/* ------------------------------------------------------------- */}
      {installedSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold">Aplicativo FENEC instalado com sucesso na sua tela inicial!</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FLOATING BOTTOM PROMPT BANNER (Non-intrusive)                  */}
      {/* ------------------------------------------------------------- */}
      {!dismissed && (
        <aside 
          aria-label="Instalação do Aplicativo FENEC"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-40 bg-slate-900/95 border border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-md p-3.5 no-print"
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex-shrink-0 drop-shadow-[0_4px_12px_rgba(234,179,8,0.35)] flex items-center justify-center">
                <img src="./logo-fenec.svg" alt="FENEC" className="w-full h-full object-contain" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5 leading-tight">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Instalar Aplicativo Oficial FENEC
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  {isIOS 
                    ? 'Adicione à tela de início do seu iPhone para acesso instantâneo.'
                    : 'Instale no seu Android para ter sua carteirinha sempre à mão, offline.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Fechar lembrete"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {isIOS ? (
              <button
                onClick={() => setShowIOSModal(true)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-2 px-3 rounded-xl shadow flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Como Adicionar no iPhone</span>
              </button>
            ) : (
              <button
                onClick={handleInstallAndroid}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-extrabold py-2 px-3 rounded-xl shadow flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Instalar no Android</span>
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-200 text-xs font-medium px-2.5 py-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Agora não
            </button>
          </div>
        </aside>
      )}

      {/* ------------------------------------------------------------- */}
      {/* iOS INSTALLATION GUIDE MODAL (Apple Safari Standard)          */}
      {/* ------------------------------------------------------------- */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fade-in"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 text-white shadow-2xl space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex-shrink-0 drop-shadow-[0_4px_12px_rgba(234,179,8,0.35)] flex items-center justify-center">
                  <img src="./logo-fenec.svg" alt="FENEC" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-300 leading-tight">
                    Adicionar à Tela de Início
                  </h3>
                  <p className="text-[11px] text-slate-400">Instalação oficial no iOS (iPhone / iPad)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowIOSModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Apple Safari Instructions */}
            <div className="space-y-3.5 text-xs text-slate-200">
              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-2xl flex items-center gap-2.5 text-cyan-200">
                <Smartphone className="w-4 h-4 flex-shrink-0 text-cyan-400" />
                <span>Abra este site no navegador <strong>Safari</strong> do seu iPhone para habilitar a instalação.</span>
              </div>

              {/* Step 1 */}
              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    Toque no botão <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono text-[11px]"><Share2 className="w-3 h-3 inline mr-1" /> Compartilhar</span>
                  </p>
                  <p className="text-slate-400 mt-1 leading-snug">
                    Localizado na barra inferior do Safari (o ícone de quadrado com a seta apontando para cima).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    Role e toque em <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-amber-300 font-bold"><PlusSquare className="w-3 h-3 text-amber-400" /> "Adicionar à Tela de Início"</span>
                  </p>
                  <p className="text-slate-400 mt-1 leading-snug">
                    Role a folha de opções do Safari até encontrar a opção com ícone de "+".
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </div>
                <div>
                  <p className="font-bold text-white">
                    Confirme tocando em <span className="text-cyan-300 font-bold">"Adicionar"</span>
                  </p>
                  <p className="text-slate-400 mt-1 leading-snug">
                    Toque em "Adicionar" no canto superior direito. O ícone FENEC aparecerá na tela do seu iPhone.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Button */}
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black py-3 rounded-2xl shadow text-xs uppercase tracking-wider transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Entendi, vou adicionar</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ANDROID MANUAL INSTRUCTIONS MODAL (Fallback if no event)      */}
      {/* ------------------------------------------------------------- */}
      {showAndroidModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fade-in"
          onClick={() => setShowAndroidModal(false)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 text-white shadow-2xl space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex-shrink-0 drop-shadow-[0_4px_12px_rgba(234,179,8,0.35)] flex items-center justify-center">
                  <img src="./logo-fenec.svg" alt="FENEC" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-300 leading-tight">
                    Instalar no Android
                  </h3>
                  <p className="text-[11px] text-slate-400">Instalação direta no Google Chrome</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAndroidModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="font-bold text-white">Toque no menu do Chrome (três pontinhos ⋮)</p>
                  <p className="text-slate-400 mt-1">Localizado no canto superior direito do seu navegador.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="font-bold text-white">Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"</p>
                  <p className="text-slate-400 mt-1">O Chrome fará o download instantâneo do atalho do aplicativo.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidModal(false)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-2xl shadow text-xs uppercase tracking-wider"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
