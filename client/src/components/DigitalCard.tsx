import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { apiUrl } from '../api';
import { 
  ShieldCheck, 
  RotateCw, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  QrCode as QrIcon,
  Award,
  Calendar,
  Sparkles,
  School
} from 'lucide-react';

interface DigitalCardProps {
  student: Student;
  onOpenValidator?: (codigoUso: string) => void;
}

export const DigitalCard: React.FC<DigitalCardProps> = ({ student, onOpenValidator }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Live clock for dynamic security verification (prevents screenshot fraud)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch or generate QR Code
  useEffect(() => {
    if (student?.codigo_uso) {
      fetch(apiUrl(`/api/public/qrcode/${encodeURIComponent(student.codigo_uso)}`))
        .then(res => res.json())
        .then(data => {
          if (data.qrDataUrl) {
            setQrCodeUrl(data.qrDataUrl);
          }
        })
        .catch(err => console.error('Erro ao buscar QR code:', err));
    }
  }, [student?.codigo_uso]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(student.codigo_uso);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const timeString = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateString = currentTime.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const isActive = student.status === 'ACTIVE';

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Dynamic Security Indicator Banner */}
      <div className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 mb-4 shadow-lg backdrop-blur-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="font-semibold text-slate-200">
            {isActive ? 'Documento Ativo em Tempo Real' : 'Documento Inativo / Trancado'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-cyan-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeString}</span>
        </div>
      </div>

      {/* 3D Flip Container */}
      <div 
        className="w-full perspective-1000 cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={`relative w-full aspect-[1/1.58] transition-transform duration-700 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* =========================================
              FRENTE DA CARTEIRINHA
             ========================================= */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between p-5 print-area">
            {/* Hologram sheen overlay */}
            <div className="absolute inset-0 pointer-events-none animate-shimmer opacity-40 z-10" />

            {/* Subtle background crest / watermark */}
            <div className="absolute right-[-20%] bottom-[-10%] opacity-5 pointer-events-none">
              <School className="w-96 h-96 text-white" />
            </div>

            {/* Header: Institution Branding */}
            <div className="relative z-20 flex items-center justify-between border-b border-amber-400/30 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md">
                  <Award className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-wider text-amber-300 font-sans leading-none">
                    FENEC
                  </h2>
                  <p className="text-[10px] text-slate-300 font-medium tracking-tight mt-0.5 uppercase">
                    Educação e Inovação
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Sparkles className="w-2.5 h-2.5" /> Oficial
                </span>
                <p className="text-[9px] text-slate-400 mt-0.5 font-mono">DNE Digital</p>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="relative z-20 my-1 bg-gradient-to-r from-blue-900/60 via-indigo-800/80 to-blue-900/60 border-y border-blue-500/30 py-1 px-2 text-center rounded">
              <p className="text-[11px] font-bold tracking-wider text-cyan-200 uppercase">
                Carteira de Identificação Estudantil
              </p>
            </div>

            {/* Body: Photo & Student Data */}
            <div className="relative z-20 flex gap-4 items-center">
              {/* Photo Box */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-32 rounded-xl overflow-hidden border-2 border-amber-400/70 shadow-lg bg-slate-800">
                  <img 
                    src={student.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}`} 
                    alt={student.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}`;
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md border-2 border-slate-900">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              {/* Data Fields */}
              <div className="flex-1 min-w-0 space-y-1.5 text-left">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Nome</span>
                  <p className="text-sm font-bold text-white truncate leading-tight">
                    {student.name}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Curso</span>
                  <p className="text-xs font-semibold text-cyan-300 truncate leading-tight">
                    {student.course}
                  </p>
                  <p className="text-[10px] text-slate-300">{student.education_level}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Matrícula</span>
                    <p className="text-xs font-mono font-bold text-amber-200">{student.registration}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Nascimento</span>
                    <p className="text-xs font-mono text-slate-200">{student.birth_date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">CPF</span>
                    <p className="text-[11px] font-mono text-slate-300">{student.cpf}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">RG / UF</span>
                    <p className="text-[11px] font-mono text-slate-300">{student.rg} {student.rg_uf}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: Código de Uso & Validade */}
            <div className="relative z-20 pt-2 border-t border-slate-700/60 mt-1 flex items-end justify-between">
              <div>
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">
                  Código de Uso (Número CIE)
                </span>
                <span className="text-sm font-mono font-extrabold text-white tracking-wider">
                  {student.codigo_uso}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Validade</span>
                <span className="inline-block bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-extrabold text-xs px-2.5 py-0.5 rounded-md shadow font-mono">
                  {student.valid_until}
                </span>
              </div>
            </div>

            {/* Flip hint at bottom */}
            <div className="relative z-20 text-center pt-1 no-print">
              <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <RotateCw className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                Toque no cartão para ver o QR Code
              </span>
            </div>
          </div>

          {/* =========================================
              VERSO DA CARTEIRINHA
             ========================================= */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white flex flex-col justify-between p-5 print-area">
            {/* Hologram sheen */}
            <div className="absolute inset-0 pointer-events-none animate-shimmer opacity-30 z-10" />

            {/* Header Verso */}
            <div className="relative z-20 border-b border-slate-700 pb-2 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-amber-300">Autenticação e Validação</h3>
                <p className="text-[10px] text-slate-400">Padrão Nacional de Identificação</p>
              </div>
              <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Certificado
              </div>
            </div>

            {/* Center: QR Code & Verification Info */}
            <div className="relative z-20 flex flex-col items-center justify-center my-auto py-2">
              <div className="bg-white p-2.5 rounded-2xl shadow-xl border-4 border-amber-400/50 flex flex-col items-center">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code de Validação" className="w-40 h-40 object-contain" />
                ) : (
                  <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-slate-400">
                    <QrIcon className="w-12 h-12 animate-pulse" />
                  </div>
                )}
              </div>
              <p className="text-[11px] font-semibold text-cyan-300 mt-2 flex items-center gap-1">
                <QrIcon className="w-3.5 h-3.5" /> Aponte a câmera para validar
              </p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                {student.codigo_uso}
              </p>
            </div>

            {/* Legal text & disclaimer */}
            <div className="relative z-20 text-[9px] text-slate-400 leading-tight space-y-1 border-t border-slate-800 pt-2">
              <p className="text-slate-300">
                <strong>{student.institution_name}</strong>
              </p>
              <p>
                Documento emitido conforme a Lei Federal nº 12.933/2013 e normas institucionais. Válido para comprovação acadêmica e fruição de benefícios e descontos estudantis.
              </p>
              <div className="flex justify-between text-[8px] text-slate-500 font-mono pt-1">
                <span>EMISSÃO: {student.created_at ? student.created_at.slice(0, 10) : '2026-01-10'}</span>
                <span>STATUS: {student.status}</span>
              </div>
            </div>

            {/* Flip back hint */}
            <div className="relative z-20 text-center no-print">
              <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <RotateCw className="w-3 h-3 text-cyan-400" />
                Toque para voltar para a frente
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="w-full mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 no-print">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700 shadow transition-all"
        >
          <RotateCw className="w-4 h-4 text-cyan-400" />
          <span>Girar</span>
        </button>

        <button
          onClick={handleCopyCode}
          className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700 shadow transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
          <span>{copied ? 'Copiado!' : 'Código'}</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700 shadow transition-all"
        >
          <Printer className="w-4 h-4 text-indigo-400" />
          <span>Imprimir</span>
        </button>

        <button
          onClick={() => onOpenValidator && onOpenValidator(student.codigo_uso)}
          className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-md transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Validar</span>
        </button>
      </div>

      {/* Benefícios e Descontos Reminder */}
      <div className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 mt-4 text-left no-print">
        <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Uso e Benefícios FENEC
        </h4>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Apresente esta carteira online em cinemas, teatros, livrarias, eventos e estabelecimentos conveniados para obter descontos. No momento da compra de ingressos online, utilize o seu <strong>Código de Uso</strong>.
        </p>
      </div>
    </div>
  );
};
