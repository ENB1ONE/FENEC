import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { ValidatorView } from './components/ValidatorView';
import { AdminPanel } from './components/AdminPanel';
import { 
  Award, 
  ShieldCheck, 
  GraduationCap, 
  Lock, 
  HelpCircle, 
  X, 
  Sparkles, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'student' | 'validator' | 'admin'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('codigo') || window.location.pathname.includes('validar')) {
      return 'validator';
    }
    return 'student';
  });

  const [initialValidatorCode, setInitialValidatorCode] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('codigo') || '';
  });

  const [showHelp, setShowHelp] = useState(true);

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
        showHelp={showHelp}
        onToggleHelp={() => setShowHelp(!showHelp)}
      />

      {/* Collapsible Quick Guide & Demo Credentials Banner */}
      {showHelp && (
        <div className="bg-gradient-to-r from-blue-950/90 via-indigo-950/90 to-blue-950/90 border-b border-blue-800/40 p-4 relative backdrop-blur animate-in fade-in">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] uppercase">
                  FENEC Oficial
                </span>
                <h4 className="font-bold text-white text-sm">
                  Sistema de Carteirinhas Estudantis Digitais e Validador
                </h4>
              </div>
              <p className="text-slate-300">
                Padrão inspirado no Documento Nacional do Estudante (DNE / Lei 12.933/2013). Use as credenciais abaixo para testar cada perfil:
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700 font-mono">
                <span className="text-amber-400 font-bold">Secretaria (Admin):</span> admin@fenec.edu.br / admin123
              </div>
              <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700 font-mono">
                <span className="text-cyan-400 font-bold">Aluno Exemplo:</span> CPF 123.456.789-00 / Nasc 15/05/2002
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-2 right-2 md:static text-slate-400 hover:text-white p-1 rounded-lg"
              title="Fechar guia"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
              F
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
