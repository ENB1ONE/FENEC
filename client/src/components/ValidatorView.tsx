import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  RefreshCw 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VerificationResult } from '../types';
import { apiUrl } from '../api';

interface ValidatorViewProps {
  initialCodigo?: string;
}

export const ValidatorView: React.FC<ValidatorViewProps> = ({ initialCodigo = '' }) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [targetCode, setTargetCode] = useState<string>('');

  // Auto-resolve which code to validate
  const resolveCode = (): string => {
    if (initialCodigo && initialCodigo.trim()) {
      return initialCodigo.trim();
    }
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const qCode = searchParams.get('codigo') || searchParams.get('c');
      if (qCode && qCode.trim()) return qCode.trim();
    } catch {}

    try {
      if (window.location.hash) {
        const hashStr = window.location.hash.includes('?')
          ? window.location.hash.split('?')[1]
          : window.location.hash.replace('#', '');
        const hashParams = new URLSearchParams(hashStr);
        const hCode = hashParams.get('codigo') || hashParams.get('c');
        if (hCode && hCode.trim()) return hCode.trim();
      }
    } catch {}

    try {
      const saved = localStorage.getItem('fenec_student_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        const c = parsed.codigo_uso || parsed.codigoUso;
        if (c && c.trim()) return c.trim();
      }
    } catch {}

    return 'FENEC-2026-SZRRANJ';
  };

  const fetchValidation = async (code: string) => {
    if (!code) return;
    setLoading(true);
    setTargetCode(code);

    try {
      const res = await fetch(apiUrl(`/api/public/validate/${encodeURIComponent(code)}?t=${Date.now()}`));
      const data = await res.json();
      setResult(data);
      if (data.valid) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.5 }
        });
      }
    } catch (err) {
      setResult({
        valid: false,
        status: 'ERROR',
        message: 'Não foi possível conectar ao servidor de validação da FENEC.',
        checkedAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const code = resolveCode();
    fetchValidation(code);
  }, [initialCodigo]);

  const formatCheckedAt = (isoString?: string) => {
    try {
      const d = isoString ? new Date(isoString) : new Date();
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return new Date().toLocaleString('pt-BR');
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto py-2">
      {/* Estado: Carregando / Consultando */}
      {loading && (
        <div className="w-full bg-[#0b1329] border-2 border-slate-700/80 rounded-3xl p-8 shadow-2xl text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Consultando Base Oficial</h3>
            <p className="text-xs text-slate-400 mt-1">
              Verificando autenticidade e regularidade da carteirinha FENEC...
            </p>
          </div>
          <div className="h-1.5 w-32 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full w-full bg-cyan-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Estado: DOCUMENTO VÁLIDO E REGULAR */}
      {!loading && result && result.valid && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-500">
          {/* Card com borda verde */}
          <div className="bg-[#0b1329] border-2 border-emerald-500 rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(16,185,129,0.2)]">
            {/* Top Banner Verde */}
            <div className="bg-[#009b55] px-6 py-5 flex items-center gap-4 text-white">
              <div className="w-12 h-12 rounded-full bg-white text-[#009b55] flex items-center justify-center shadow-lg flex-shrink-0">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black tracking-wide uppercase leading-tight">
                  Documento Válido e Regular
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-0.5">
                  Estudante regularmente matriculado na FENEC
                </p>
              </div>
            </div>

            {/* Conteúdo Centralizado */}
            <div className="p-6 flex flex-col items-center text-center">
              {/* Foto 3x4 do Estudante com Borda Dourada e Selo */}
              <div className="relative mb-4 mt-1">
                <div className="w-32 h-40 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-2xl bg-slate-950 flex-shrink-0">
                  <img
                    src={result.student?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(result.student?.name || 'FENEC')}`}
                    alt={result.student?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(result.student?.name || 'FENEC')}`;
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 border-2 border-slate-900 shadow">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              {/* Estudante Titular */}
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Estudante Titular
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {result.student?.name}
              </h3>

              {/* Curso */}
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-4 mb-0.5">
                Curso
              </span>
              <p className="text-sm sm:text-base font-bold text-cyan-400 leading-snug">
                {result.student?.course}
              </p>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {result.student?.educationLevel}
              </p>

              {/* Matrícula (RA) */}
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-4 mb-0.5">
                Matrícula (RA)
              </span>
              <p className="font-mono font-bold text-amber-400 text-sm tracking-wider">
                {result.student?.registration}
              </p>

              {/* Grid CPF e Data de Nascimento */}
              <div className="grid grid-cols-2 gap-4 mt-4 w-full max-w-xs mx-auto text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    CPF
                  </span>
                  <span className="font-mono font-semibold text-slate-200 text-xs sm:text-sm">
                    {result.student?.cpfMasked}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Data Nasc.
                  </span>
                  <span className="font-mono font-semibold text-slate-200 text-xs sm:text-sm">
                    {result.student?.birthDate}
                  </span>
                </div>
              </div>

              {/* Bloco Escuro de Metadados da Emissão */}
              <div className="w-full bg-[#0d162b] border border-slate-800 rounded-2xl p-4 mt-6 text-left space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Entidade Emissora
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Building2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="font-bold text-white text-sm">
                      FENEC Institucional
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Código de Uso
                  </span>
                  <span className="font-mono font-bold text-cyan-400 text-sm sm:text-base tracking-wide block mt-0.5">
                    {result.student?.codigoUso}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Validade Legal
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-sm sm:text-base tracking-wide block mt-0.5">
                    Até {result.student?.validUntil}
                  </span>
                </div>
              </div>

              {/* Data e Hora da Consulta & Meia Entrada */}
              <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Consultado em: {formatCheckedAt(result.checkedAt)}</span>
              </div>
              <p className="text-xs font-semibold text-emerald-400 text-center mt-1.5">
                ✓ Válido para Meia-Entrada e Descontos Institucionais
              </p>
            </div>
          </div>

          {/* Rodapé Oficial da FENEC */}
          <div className="mt-8 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <img src="./logo-fenec.svg" alt="FENEC" className="w-7 h-7 object-contain" />
              <span className="font-bold text-slate-200 text-xs sm:text-sm">
                FENEC — Faculdade e Escola de Negócios e Educação Continuada
              </span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
              Validação oficial conforme Lei Federal nº 12.933/2013 e Decreto nº 8.537/2015.
            </p>
          </div>
        </div>
      )}

      {/* Estado: DOCUMENTO INVÁLIDO OU NÃO LOCALIZADO */}
      {!loading && result && !result.valid && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-500">
          {/* Card com borda vermelha */}
          <div className="bg-[#0b1329] border-2 border-rose-500 rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(244,63,94,0.2)]">
            {/* Top Banner Vermelho */}
            <div className="bg-rose-600 px-6 py-5 flex items-center gap-4 text-white">
              <div className="w-12 h-12 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <XCircle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black tracking-wide uppercase leading-tight">
                  Documento Inválido ou Não Localizado
                </h2>
                <p className="text-xs sm:text-sm text-rose-100 font-medium mt-0.5">
                  Não foi possível atestar a regularidade deste documento
                </p>
              </div>
            </div>

            {/* Conteúdo Centralizado */}
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 mt-2">
                <ShieldAlert className="w-10 h-10" />
              </div>

              <span className="text-[10px] sm:text-[11px] font-bold text-rose-400 uppercase tracking-widest block mb-1">
                Status da Carteirinha
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight leading-snug">
                NÃO REGULAR / INVÁLIDO
              </h3>

              {/* Bloco Escuro de Detalhes do Erro */}
              <div className="w-full bg-[#0d162b] border border-slate-800 rounded-2xl p-4 mt-6 text-left space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Código Consultado
                  </span>
                  <span className="font-mono font-bold text-rose-300 text-sm tracking-wide block mt-0.5">
                    {targetCode || 'Nenhum código fornecido'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Motivo
                  </span>
                  <span className="text-slate-300 text-xs sm:text-sm block mt-0.5">
                    {result.message || 'Código não localizado na base oficial de estudantes regulares da FENEC.'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Orientações
                  </span>
                  <span className="text-slate-400 text-xs block mt-0.5">
                    Certifique-se de que o QR Code pertence a uma carteirinha oficial FENEC do ano letivo vigente. Matrículas trancadas ou canceladas não são válidas.
                  </span>
                </div>
              </div>

              {/* Data e Hora da Consulta & Aviso Meia Entrada */}
              <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Consultado em: {formatCheckedAt(result.checkedAt)}</span>
              </div>
              <p className="text-xs font-semibold text-rose-400 text-center mt-1.5">
                ❌ Este documento NÃO possui validade legal para Meia-Entrada
              </p>
            </div>
          </div>

          {/* Rodapé Oficial da FENEC */}
          <div className="mt-8 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <img src="./logo-fenec.svg" alt="FENEC" className="w-7 h-7 object-contain" />
              <span className="font-bold text-slate-200 text-xs sm:text-sm">
                FENEC — Faculdade e Escola de Negócios e Educação Continuada
              </span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
              Validação oficial conforme Lei Federal nº 12.933/2013 e Decreto nº 8.537/2015.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
