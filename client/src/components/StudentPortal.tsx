import React, { useState } from 'react';
import { Student } from '../types';
import { DigitalCard } from './DigitalCard';
import { 
  GraduationCap, 
  LogIn, 
  UserCheck, 
  Calendar, 
  CreditCard, 
  LogOut, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { maskCPF, maskDate } from '../utils';
import { apiUrl } from '../api';

interface StudentPortalProps {
  onOpenValidator: (codigoUso: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ onOpenValidator }) => {
  const [student, setStudent] = useState<Student | null>(() => {
    const saved = localStorage.getItem('fenec_student_data');
    if (saved) {
      try {
        const raw = JSON.parse(saved);
        return {
          ...raw,
          name: raw.name,
          birth_date: raw.birth_date || raw.birthDate || '',
          photo_url: raw.photo_url || raw.photoUrl || '',
          valid_until: raw.valid_until || raw.validUntil || '',
          codigo_uso: raw.codigo_uso || raw.codigoUso || '',
          cpf: raw.cpf || raw.cpfMasked || '',
          course: raw.course || '',
          education_level: raw.education_level || raw.educationLevel || '',
          institution_name: raw.institution_name || raw.institutionName || 'FENEC - Faculdade e Escola de Negócios e Educação Continuada',
          status: raw.status || 'ACTIVE'
        };
      } catch {
        return null;
      }
    }
    return null;
  });

  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Silent sync to keep cached student details 100% up-to-date with server
  React.useEffect(() => {
    const syncWithServer = () => {
      const saved = localStorage.getItem('fenec_student_data');
      let codeToSync = student?.codigo_uso || (student as any)?.codigoUso;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.codigo_uso || parsed.codigoUso)) {
            codeToSync = parsed.codigo_uso || parsed.codigoUso;
          }
        } catch {}
      }

      if (codeToSync) {
        fetch(apiUrl(`/api/public/validate/${encodeURIComponent(codeToSync)}?t=${Date.now()}`))
          .then(res => res.json())
          .then(data => {
            if (data && data.valid && data.student) {
              const raw = data.student;
              setStudent(prev => {
                if (!prev) return prev;
                const merged: Student = {
                  ...prev,
                  ...raw,
                  name: raw.name || prev.name,
                  birth_date: raw.birthDate || raw.birth_date || prev.birth_date,
                  photo_url: raw.photoUrl || raw.photo_url || prev.photo_url,
                  valid_until: raw.validUntil || raw.valid_until || prev.valid_until,
                  codigo_uso: raw.codigoUso || raw.codigo_uso || prev.codigo_uso,
                  cpf: prev.cpf || raw.cpfMasked || raw.cpf,
                  course: raw.course || prev.course,
                  education_level: raw.educationLevel || raw.education_level || prev.education_level,
                  institution_name: raw.institutionName || raw.institution_name || prev.institution_name,
                  status: raw.status || prev.status
                };
                localStorage.setItem('fenec_student_data', JSON.stringify(merged));
                return merged;
              });
            }
          })
          .catch(() => {});
      }
    };

    syncWithServer();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncWithServer();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', syncWithServer);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', syncWithServer);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf.trim()) {
      setError('Por favor informe o seu CPF.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl('/api/auth/student-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: cpf.trim(),
          birthDate: birthDate.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Falha ao autenticar.');
      }

      const raw = data.student;
      const normalizedStudent: Student = {
        ...raw,
        name: raw.name,
        birth_date: raw.birth_date || raw.birthDate || '',
        photo_url: raw.photo_url || raw.photoUrl || '',
        valid_until: raw.valid_until || raw.validUntil || '',
        codigo_uso: raw.codigo_uso || raw.codigoUso || '',
        cpf: raw.cpf || raw.cpfMasked || '',
        course: raw.course || '',
        education_level: raw.education_level || raw.educationLevel || '',
        institution_name: raw.institution_name || raw.institutionName || 'FENEC - Faculdade e Escola de Negócios e Educação Continuada',
        status: raw.status || 'ACTIVE'
      };

      setStudent(normalizedStudent);
      localStorage.setItem('fenec_student_data', JSON.stringify(normalizedStudent));
      if (data.token) {
        localStorage.setItem('fenec_student_token', data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setStudent(null);
    localStorage.removeItem('fenec_student_data');
    localStorage.removeItem('fenec_student_token');
  };

  if (student) {
    return (
      <div className="w-full max-w-2xl mx-auto py-2">
        {/* Welcome & Logout header */}
        <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 mb-6 backdrop-blur shadow-md no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 drop-shadow-[0_2px_8px_rgba(234,179,8,0.35)] flex items-center justify-center flex-shrink-0">
              <img src="./logo-fenec.svg" alt="FENEC" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Estudante Conectado</p>
              <h3 className="text-sm font-bold text-white">{student.name}</h3>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-slate-700/80 hover:bg-slate-700 text-rose-300 hover:text-rose-200 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-600 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>

        {/* Digital Card Renderer - Abre direto em Tela Cheia */}
        <DigitalCard 
          student={student} 
          onOpenValidator={onOpenValidator} 
          onLogout={handleLogout}
          defaultFullscreen={true}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto py-2">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 drop-shadow-[0_4px_16px_rgba(234,179,8,0.35)] mb-3">
          <img src="./logo-fenec.svg" alt="FENEC" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white font-sans">
          Portal do Estudante FENEC
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Acesse instantaneamente a sua Carteira de Estudante Digital oficial.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              CPF do Estudante *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                maxLength={14}
                required
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 transition-colors"
              />
              <CreditCard className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Data de Nascimento *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                value={birthDate}
                onChange={(e) => setBirthDate(maskDate(e.target.value))}
                maxLength={10}
                required
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 transition-colors"
              />
              <Calendar className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-60 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all text-sm mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>Carregando Carteirinha...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Acessar Minha Carteirinha</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
