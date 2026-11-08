import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

// Current client build timestamp
export const CURRENT_BUILD_TIME = 1794150800000;

export const AppUpdateManager: React.FC = () => {
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('Atualizando aplicativo para a versão mais recente...');

  const performForceUpdate = async () => {
    setUpdating(true);
    setUpdateMessage('Nova versão encontrada! Atualizando recursos...');

    try {
      // 1. Tell Service Worker to purge cache & skip waiting
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          if (reg.active) {
            reg.active.postMessage({ type: 'PURGE_CACHE' });
          }
          await reg.update().catch(() => {});
        }
      }

      // 2. Clear all CacheStorage in the browser
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(k => caches.delete(k)));
      }

      // 3. Mark last updated time
      localStorage.setItem('fenec_last_build', Date.now().toString());

      // 4. Force hard reload after brief delay for seamless transition
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      console.warn('Erro ao executar atualização forçada:', err);
      window.location.reload();
    }
  };

  const checkForServerUpdate = async () => {
    try {
      // Request version.json bypassing all browser & proxy caches
      const res = await fetch(`./version.json?_nocache=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data && data.buildTime && data.buildTime > CURRENT_BUILD_TIME) {
        console.log('[UpdateManager] Nova versão detectada:', data.buildTime, '> atual:', CURRENT_BUILD_TIME);
        await performForceUpdate();
      }
    } catch (err) {
      // Offline or network error; silent catch
    }
  };

  useEffect(() => {
    // 1. Immediate check on load
    checkForServerUpdate();

    // 2. SW update events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed. Recarregando com nova versão...');
        window.location.reload();
      });

      navigator.serviceWorker.ready.then((registration) => {
        registration.update().catch(() => {});

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New worker waiting, force update!
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                performForceUpdate();
              }
            });
          }
        });
      });
    }

    // 3. Check when app regains focus or comes back from background (PWA Home Screen resumed)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForServerUpdate();
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then(reg => reg?.update().catch(() => {}));
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    // 4. Periodic polling every 30 seconds
    const interval = setInterval(() => {
      checkForServerUpdate();
    }, 30000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  if (!updating) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in select-none">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-4 shadow-xl shadow-amber-500/20 animate-pulse">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
      <h3 className="text-lg font-black text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-400" />
        Atualização do Sistema FENEC
      </h3>
      <p className="text-sm text-slate-300 mt-2 max-w-sm">
        {updateMessage}
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs font-mono text-cyan-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        Sincronizando com a versão mais recente...
      </div>
    </div>
  );
};
