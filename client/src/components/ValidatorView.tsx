import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  GraduationCap, 
  QrCode,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VerificationResult } from '../types';
import { maskDate } from '../utils';
import { apiUrl } from '../api';

interface ValidatorViewProps {
  initialCodigo?: string;
}

export const ValidatorView: React.FC<ValidatorViewProps> = ({ initialCodigo = '' }) => {
  const [codigoUso, setCodigoUso] = useState(initialCodigo);
  const [dataNascimento, setDataNascimento] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If initialCodigo changes, perform auto-lookup
  useEffect(() => {
    if (initialCodigo) {
      setCodigoUso(initialCodigo);
      handleDirectValidate(initialCodigo);
    }
  }, [initialCodigo]);

  // Direct lookup via QR Code or Código de Uso alone
  const handleDirectValidate = async (codigo: string) => {
    if (!codigo.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch(apiUrl(`/api/public/validate/${encodeURIComponent(codigo.trim())}`));
      const data = await res.json();
      setResult(data);
      if (data.valid) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      setErrorMsg('Falha ao conectar com o servidor do validador.');
    } finally {
      setLoading(false);
    }
  };

  // Official DNE standard lookup with Código de Uso + Data de Nascimento
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoUso.trim()) {
      setErrorMsg('Por favor informe o Código de Uso.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch(apiUrl('/api/public/validate-manual'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigoUso: codigoUso.trim(),
          birthDate: dataNascimento.trim()
        })
      });
      const data = await res.json();
      setResult(data);
      if (data.valid) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      setErrorMsg('Falha ao validar documento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-2">
      {/* Header Banner */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-500/20 mb-3 border border-blue-400/30">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white font-sans">
          Validador Oficial de Carteirinhas FENEC
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-lg mx-auto">
          Consulte e ateste a autenticidade e regularidade das carteiras de identificação estudantil em tempo real.
        </p>
      </div>

      {/* Verification Search Form */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md mb-6">
        <form onSubmit={handleSubmitManual} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Código de Uso (Número da CIE) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: FENEC-2026-K7M9Q21"
                  value={codigoUso}
                  onChange={(e) => setCodigoUso(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 transition-colors"
                  required
                />
                <QrCode className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Data de Nascimento (Opcional p/ QR Code)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(maskDate(e.target.value))}
                  maxLength={10}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 transition-colors"
                />
                <Calendar className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Consultando base FENEC...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Verificar Autenticidade</span>
                </>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Verification Result Card */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {result.valid ? (
            /* SUCCESS: Valid Document */
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-emerald-500/60 rounded-2xl overflow-hidden shadow-2xl">
              {/* Top Banner Status */}
              <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-wide uppercase">
                      Documento Válido e Regular
                    </h3>
                    <p className="text-xs text-emerald-100 font-medium">
                      Estudante regularmente matriculado na FENEC
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block text-right text-xs font-mono text-emerald-100">
                  <p>Certificação Digital</p>
                  <p className="font-bold">ICP-FENEC Autêntico</p>
                </div>
              </div>

              {/* Verified Details */}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start border-b border-slate-700/60 pb-6 mb-6">
                  {/* Photo */}
                  <div className="relative">
                    <div className="w-28 h-36 rounded-xl overflow-hidden border-2 border-amber-400 shadow-xl bg-slate-950 flex-shrink-0">
                      <img
                        src={result.student?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(result.student?.name || 'FENEC')}`}
                        alt={result.student?.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(result.student?.name || 'FENEC')}`;
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1 border-2 border-slate-900 shadow">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Student Credentials */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Estudante Titular
                      </span>
                      <h4 className="text-xl font-bold text-white leading-tight">
                        {result.student?.name}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Curso</span>
                        <span className="font-semibold text-cyan-300">{result.student?.course}</span>
                        <span className="text-[11px] text-slate-400 block">{result.student?.educationLevel}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Matrícula (RA)</span>
                        <span className="font-mono font-bold text-amber-300">{result.student?.registration}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">CPF</span>
                        <span className="font-mono text-slate-200">{result.student?.cpfMasked}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Data Nasc.</span>
                        <span className="font-mono text-slate-200">{result.student?.birthDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Institution & Validity Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Entidade Emissora</span>
                    <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" /> FENEC Institucional
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Código de Uso</span>
                    <span className="font-mono font-bold text-cyan-300 text-xs block mt-0.5">
                      {result.student?.codigoUso}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Validade Legal</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs block mt-0.5">
                      Até {result.student?.validUntil}
                    </span>
                  </div>
                </div>

                {/* Validation Timestamp & Security Info */}
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-2 pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Consultado em: {new Date(result.checkedAt).toLocaleString('pt-BR')}
                  </span>
                  <span className="text-emerald-400/90 font-medium">
                    ✓ Válido para Meia-Entrada e Descontos Institucionais
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* FAILURE: Invalid or Suspended Document */
            <div className="bg-slate-800/95 border-2 border-rose-500/70 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-rose-600 px-6 py-4 flex items-center gap-3 text-white">
                <XCircle className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h3 className="text-base font-black tracking-wide uppercase">
                    Documento Inválido ou Não Localizado
                  </h3>
                  <p className="text-xs text-rose-100">
                    {result.message || 'Este documento não confere com os registros ativos da FENEC.'}
                  </p>
                </div>
              </div>

              <div className="p-6 text-sm text-slate-300 space-y-3">
                <p>
                  A carteirinha informada não pôde ser atestada como regular. Motivos comuns:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                  <li>Código de Uso digitado incorretamente;</li>
                  <li>Data de nascimento não confere com o cadastro do estudante;</li>
                  <li>Matrícula trancada, cancelada ou estudante egresso;</li>
                  <li>Documento expirado (anterior ao ano corrente).</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
