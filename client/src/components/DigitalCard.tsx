import React, { useState, useEffect, useRef } from 'react';
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
  School,
  Maximize2,
  X,
  Smartphone
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Touch swipe gesture refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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

  // Close fullscreen on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Touch Swipe Handlers for mobile ("passar o dedo para virar")
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Check if horizontal swipe is dominant and above threshold (35px)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
      if (deltaX < 0) {
        // Swiped Left -> go to Verso (QR Code)
        setIsFlipped(true);
      } else {
        // Swiped Right -> go to Frente
        setIsFlipped(false);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

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

  const isActive = student.status === 'ACTIVE';

  // ==========================================
  // RENDER CARD FRONT CONTENT
  // ==========================================
  const renderCardFrontContent = () => (
    <>
      {/* Hologram sheen overlay */}
      <div className="absolute inset-0 pointer-events-none animate-shimmer opacity-40 z-10 no-print" />

      {/* Subtle background crest / watermark */}
      <div className="absolute right-[-20%] bottom-[-10%] opacity-5 pointer-events-none">
        <School className="w-96 h-96 text-white" />
      </div>

      {/* Header: Institution Branding */}
      <div className="relative z-20 flex items-center justify-between border-b border-amber-400/30 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-md flex-shrink-0">
            <Award className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wider text-amber-300 font-sans leading-none">
              FENEC
            </h2>
            <p className="text-[9px] text-slate-300 font-medium tracking-tight mt-0.5 uppercase">
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
      <div className="relative z-20 my-1 bg-gradient-to-r from-blue-900/60 via-indigo-800/80 to-blue-900/60 border-y border-blue-500/30 py-0.5 px-2 text-center rounded">
        <p className="text-[10px] font-bold tracking-wider text-cyan-200 uppercase">
          Carteira de Identificação Estudantil
        </p>
      </div>

      {/* Body: Photo & Student Data */}
      <div className="relative z-20 flex gap-3.5 items-center">
        {/* Photo Box */}
        <div className="relative flex-shrink-0">
          <div className="w-24 h-32 rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-lg bg-slate-800">
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
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Data Fields */}
        <div className="flex-1 min-w-0 space-y-1 text-left">
          <div>
            <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-semibold">Nome</span>
            <p className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
              {student.name}
            </p>
          </div>

          <div>
            <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-semibold">Curso</span>
            <p className="text-[11px] font-semibold text-cyan-300 truncate leading-tight">
              {student.course}
            </p>
            <p className="text-[9px] text-slate-300">{student.education_level}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div>
              <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-semibold">Matrícula</span>
              <p className="text-[11px] font-mono font-bold text-amber-200">{student.registration}</p>
            </div>
            <div>
              <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-semibold">Nascimento</span>
              <p className="text-[11px] font-mono text-slate-200">{student.birth_date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-semibold">CPF</span>
              <p className="text-[10px] font-mono text-slate-300">{student.cpf}</p>
            </div>
            <div>
              <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-semibold">RG / UF</span>
              <p className="text-[10px] font-mono text-slate-300">{student.rg} {student.rg_uf}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Código de Uso, QR Preview & Validade */}
      <div className="relative z-20 pt-2 border-t border-slate-700/60 mt-1 flex items-end justify-between">
        <div>
          <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest block">
            Código de Uso (Número CIE)
          </span>
          <span className="text-xs sm:text-sm font-mono font-extrabold text-white tracking-wider">
            {student.codigo_uso}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {qrCodeUrl && (
            <div 
              className="w-10 h-10 bg-white p-0.5 rounded-lg border border-amber-400/80 shadow cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
              title="Toque para girar e ver QR Code completo"
            >
              <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="text-right">
            <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-semibold">Validade</span>
            <span className="inline-block bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-extrabold text-xs px-2.5 py-0.5 rounded-md shadow font-mono">
              {student.valid_until}
            </span>
          </div>
        </div>
      </div>

      {/* Flip hint at bottom */}
      <div className="relative z-20 text-center pt-0.5 no-print">
        <span className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
          <RotateCw className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          Passe o dedo ou toque para virar
        </span>
      </div>
    </>
  );

  // ==========================================
  // RENDER CARD BACK CONTENT
  // ==========================================
  const renderCardBackContent = () => (
    <>
      {/* Hologram sheen */}
      <div className="absolute inset-0 pointer-events-none animate-shimmer opacity-30 z-10 no-print" />

      {/* Header Verso */}
      <div className="relative z-20 border-b border-slate-700 pb-2 flex justify-between items-center">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-amber-300">Autenticação e Validação</h3>
          <p className="text-[9px] text-slate-400">Padrão Nacional de Identificação</p>
        </div>
        <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Certificado ICP
        </div>
      </div>

      {/* Center: QR Code & Verification Info */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto py-1">
        <a
          href={`https://enb1one.github.io/FENEC/?codigo=${encodeURIComponent(student.codigo_uso)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="group relative bg-white p-2.5 rounded-2xl shadow-2xl border-4 border-amber-400/80 hover:border-cyan-400 transition-all flex flex-col items-center"
          title="Clique ou aponte a câmera para autenticar"
        >
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR Code de Validação" className="w-36 h-36 sm:w-40 sm:h-40 object-contain" />
          ) : (
            <div className="w-36 h-36 sm:w-40 sm:h-40 bg-slate-100 flex items-center justify-center text-slate-400">
              <QrIcon className="w-12 h-12 animate-pulse" />
            </div>
          )}
          <span className="absolute bottom-1 bg-slate-900/90 text-cyan-300 text-[9px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity no-print">
            Abrir Validador ↗
          </span>
        </a>
        <p className="text-[11px] font-semibold text-cyan-300 mt-2 flex items-center gap-1">
          <QrIcon className="w-3.5 h-3.5" /> Aponte a câmera para validar
        </p>
        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
          {student.codigo_uso}
        </p>
      </div>

      {/* Legal text & disclaimer */}
      <div className="relative z-20 text-[9px] text-slate-400 leading-tight space-y-1 border-t border-slate-800 pt-2">
        <p className="text-slate-300 font-semibold truncate">
          {student.institution_name}
        </p>
        <p className="text-[8px] sm:text-[9px] text-slate-400 leading-tight">
          Documento emitido conforme a Lei Federal nº 12.933/2013 e Decreto nº 8.537/2015. Válido em todo território nacional para comprovação acadêmica e benefício de meia-entrada estudantil.
        </p>
        <div className="flex justify-between text-[8px] text-slate-500 font-mono pt-0.5">
          <span>EMISSÃO: {student.created_at ? student.created_at.slice(0, 10) : '2026-11-08'}</span>
          <span className="text-emerald-400 font-bold">STATUS: {student.status}</span>
        </div>
      </div>

      {/* Flip back hint */}
      <div className="relative z-20 text-center no-print pt-0.5">
        <span className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
          <RotateCw className="w-3 h-3 text-cyan-400" />
          Passe o dedo ou toque para voltar
        </span>
      </div>
    </>
  );

  return (
    <>
      {/* ========================================================
          FULLSCREEN PRESENTATION OVERLAY (MOSTRAR APENAS CARTEIRINHA)
         ======================================================== */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between items-center p-4 sm:p-6 select-none animate-in fade-in duration-200">
          {/* Top Bar with Security Pulse and Close Button */}
          <div className="w-full max-w-sm flex items-center justify-between py-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                FENEC Digital
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                {timeString}
              </span>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 shadow transition-colors"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span>Fechar</span>
            </button>
          </div>

          {/* Centered Carteirinha with Touch Swipe Support */}
          <div className="my-auto w-full max-w-sm py-2">
            <div 
              className="w-full card-perspective cursor-pointer"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`card-flipper aspect-[1/1.58] ${isFlipped ? 'is-flipped' : ''}`}>
                <div className="card-face card-face-front rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between p-5">
                  {renderCardFrontContent()}
                </div>
                <div className="card-face card-face-back rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white flex flex-col justify-between p-5">
                  {renderCardBackContent()}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Touch swipe guidance and side toggle */}
          <div className="w-full max-w-sm flex flex-col items-center gap-2.5 py-2 border-t border-slate-800">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
              <button
                type="button"
                onClick={() => setIsFlipped(false)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${!isFlipped ? 'bg-amber-500 text-slate-950 font-extrabold shadow' : 'text-slate-400 hover:text-white'}`}
              >
                1. Frente
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setIsFlipped(true)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${isFlipped ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-slate-400 hover:text-white'}`}
              >
                2. Verso (QR Code)
              </button>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 text-center">
              <span>👉</span>
              <span><strong>Passe o dedo</strong> ou toque no cartão para virar</span>
              <span>👈</span>
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          ON-SCREEN INTERACTIVE COMPONENT
         ======================================================== */}
      <div className="screen-only flex flex-col items-center w-full max-w-md mx-auto">
        {/* Dynamic Security Indicator Banner */}
        <div className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 mb-3 shadow-lg backdrop-blur-sm flex items-center justify-between text-xs">
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

        {/* Front / Back Quick Selector */}
        <div className="w-full flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 mb-3 text-xs font-bold no-print">
          <button
            type="button"
            onClick={() => setIsFlipped(false)}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              !isFlipped
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Frente (Identificação)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFlipped(true)}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              isFlipped
                ? 'bg-blue-600 text-white shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrIcon className="w-3.5 h-3.5" />
            <span>Verso (QR Code Oficial)</span>
          </button>
        </div>

        {/* 3D Flip Container with Touch Swipe Gesture Support */}
        <div 
          className="w-full card-perspective cursor-pointer select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div 
            className={`card-flipper aspect-[1/1.58] ${
              isFlipped ? 'is-flipped' : ''
            }`}
          >
            {/* FRENTE */}
            <div className="card-face card-face-front rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between p-5">
              {renderCardFrontContent()}
            </div>

            {/* VERSO */}
            <div className="card-face card-face-back rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white flex flex-col justify-between p-5">
              {renderCardBackContent()}
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="w-full mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 no-print">
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-md transition-all"
            title="Exibir apenas a carteirinha na tela cheia"
          >
            <Smartphone className="w-4 h-4" />
            <span>Tela Cheia</span>
          </button>

          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700 shadow transition-all"
          >
            <RotateCw className="w-4 h-4 text-cyan-400" />
            <span>{isFlipped ? 'Ver Frente' : 'Girar Verso'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700 shadow transition-all"
            title="Imprimir Carteirinha Digital"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={() => onOpenValidator && onOpenValidator(student.codigo_uso)}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700 shadow transition-all"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            <span>Validador</span>
          </button>
        </div>

        {/* Mobile Swipe Hint Banner */}
        <div className="w-full mt-3 bg-slate-800/40 border border-slate-700/50 rounded-xl p-2.5 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2 no-print">
          <span>📱</span>
          <span>Dica: <strong>Passe o dedo para o lado</strong> no cartão para virar para o QR Code</span>
        </div>

        {/* Beneficios e Descontos Reminder */}
        <div className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 mt-3 text-left no-print">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Uso e Benefícios FENEC
            </h4>
            <button
              onClick={handleCopyCode}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
              <span>{copied ? 'Copiado!' : 'Copiar Código CIE'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Apresente esta carteira online em cinemas, teatros, livrarias, shows e estabelecimentos conveniados para obter descontos. No momento da compra de ingressos online, utilize o seu <strong>Código de Uso: {student.codigo_uso}</strong>.
          </p>
        </div>
      </div>

      {/* ========================================================
          PRINT-ONLY OFFICIAL LAYOUT (Lei nº 12.933/2013)
          Renderizado exclusivamente na impressora ou salvar PDF
         ======================================================== */}
      <div className="print-only">
        <div className="max-w-[190mm] mx-auto p-4 bg-white text-slate-900 font-sans">
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-400 text-slate-950 font-black text-2xl rounded-xl flex items-center justify-center border-2 border-slate-900 shadow">
                F
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-wide uppercase text-slate-950 leading-tight">
                  FENEC — Faculdade e Escola de Negócios e Educação Continuada
                </h1>
                <p className="text-xs font-bold text-slate-800">
                  Documento de Identificação Estudantil Digital (CIE Nacional)
                </p>
                <p className="text-[10px] text-slate-600">
                  Emitido em estrita conformidade com a Lei Federal nº 12.933/2013 e Decreto Federal nº 8.537/2015
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs border-2 border-slate-900 p-2 rounded-lg bg-slate-50">
              <span className="block text-[9px] text-slate-600 font-bold uppercase">Código CIE</span>
              <span className="font-extrabold text-sm text-slate-950">{student.codigo_uso}</span>
              <span className="block text-[9px] text-emerald-800 font-bold mt-0.5">STATUS: ATIVO</span>
            </div>
          </div>

          {/* Cards Layout Side-by-Side with Fold Line */}
          <div className="my-5">
            <p className="text-center text-xs font-bold text-slate-600 mb-2">
              ✂ Recorte no retângulo externo e dobre ao meio para plastificar (tamanho padrão de carteira 85mm x 54mm)
            </p>

            <div className="flex justify-center items-stretch border-2 border-dashed border-slate-400 p-4 rounded-xl bg-slate-100 gap-4">
              {/* Card Frente */}
              <div className="w-[78mm] h-[122mm] rounded-2xl overflow-hidden shadow-md border-2 border-amber-500 bg-slate-950 text-white flex flex-col justify-between p-4 flex-shrink-0 relative">
                {renderCardFrontContent()}
              </div>

              {/* Fold Divider */}
              <div className="flex flex-col items-center justify-center px-2 border-r-2 border-dashed border-slate-400 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span className="rotate-90 whitespace-nowrap">✂ Dobrar Aqui</span>
              </div>

              {/* Card Verso */}
              <div className="w-[78mm] h-[122mm] rounded-2xl overflow-hidden shadow-md border-2 border-amber-500 bg-slate-950 text-white flex flex-col justify-between p-4 flex-shrink-0 relative">
                {renderCardBackContent()}
              </div>
            </div>
          </div>

          {/* Official Validation & Legal Section */}
          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 text-xs space-y-2 text-slate-700">
            <h3 className="font-bold text-slate-900 uppercase tracking-wide text-xs">
              Instruções de Validação e Direitos do Estudante:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
              <li>
                <strong>Validação Instantânea:</strong> A autenticidade deste documento pode ser atestada apontando a câmera de qualquer smartphone para o QR Code acima ou acessando <strong>https://enb1one.github.io/FENEC/</strong> informando o Código de Uso <strong>{student.codigo_uso}</strong>.
              </li>
              <li>
                <strong>Meia-Entrada Garantida:</strong> Válido em todo o território nacional para 50% de desconto em cinemas, teatros, espetáculos musicais, circos, eventos educativos, esportivos e de lazer, nos termos da Lei Federal nº 12.933/2013.
              </li>
              <li>
                <strong>Validade do Documento:</strong> Válido até <strong>{student.valid_until}</strong> (31 de março do ano subsequente à expedição).
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-200 flex justify-between text-[10px] font-mono text-slate-500">
              <span>Emissão: {student.created_at ? student.created_at.slice(0, 10) : '2026-11-08'}</span>
              <span>Certificação Digital FENEC • Registro: {student.registration}</span>
              <span>Impresso em: {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
