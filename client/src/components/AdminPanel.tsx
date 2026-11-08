import React, { useState, useEffect } from 'react';
import { Student, AdminStats } from '../types';
import { NewStudentModal } from './NewStudentModal';
import { DigitalCard } from './DigitalCard';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Trash2, 
  Eye, 
  Copy, 
  Check, 
  Lock, 
  Mail, 
  LogOut, 
  Activity, 
  Sparkles,
  AlertTriangle,
  Building2,
  Calendar,
  X
} from 'lucide-react';
import { apiUrl } from '../api';

interface AdminPanelProps {
  onOpenValidator: (codigoUso: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onOpenValidator }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fenec_admin_token'));
  const [adminUser, setAdminUser] = useState<any>(() => {
    const saved = localStorage.getItem('fenec_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loadingData, setLoadingData] = useState(false);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch students & stats when token is present
  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, search, statusFilter]);

  const loadData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (statusFilter !== 'ALL') q.append('status', statusFilter);

      const [resStudents, resStats] = await Promise.all([
        fetch(apiUrl(`/api/admin/students?${q.toString()}`), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(apiUrl('/api/admin/stats'), {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (resStudents.status === 401 || resStats.status === 401) {
        handleLogout();
        return;
      }

      const dataStudents = await resStudents.json();
      const dataStats = await resStats.json();

      setStudents(dataStudents.students || []);
      setStats(dataStats || null);
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch(apiUrl('/api/auth/admin-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Falha no login.');
      }

      setToken(data.token);
      setAdminUser(data.admin);
      localStorage.setItem('fenec_admin_token', data.token);
      localStorage.setItem('fenec_admin_user', JSON.stringify(data.admin));
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao conectar.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setAdminUser(null);
    localStorage.removeItem('fenec_admin_token');
    localStorage.removeItem('fenec_admin_user');
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(apiUrl(`/api/admin/students/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Deseja realmente remover o estudante ${name} e cancelar esta carteirinha?`)) {
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/admin/students/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // If not logged in as Admin, show login box
  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto py-2">
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center w-16 h-16 drop-shadow-[0_4px_16px_rgba(234,179,8,0.35)] mb-3">
            <img src="./logo-fenec.svg" alt="FENEC" className="w-full h-full object-contain" />
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-full border border-slate-900 shadow">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white font-sans">
            Painel da Secretaria / Gestor FENEC
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Autentique-se para gerenciar estudantes e emitir carteirinhas digitais.
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                E-mail Institucional
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="admin@fenec.edu.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all text-sm mt-2"
            >
              {loginLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Acessar Painel Administrativo</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-2 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 drop-shadow-[0_4px_12px_rgba(234,179,8,0.3)]">
            <img src="./logo-fenec.svg" alt="FENEC" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-sans flex items-center gap-2">
              Gestão de Carteirinhas — FENEC
            </h2>
            <p className="text-xs text-slate-400">
              Controle, Emissão e Validação de Documentos Estudantis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setStudentToEdit(null);
              setIsNewModalOpen(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 text-xs transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nova Carteirinha</span>
          </button>

          <button
            onClick={handleLogout}
            className="bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white p-2.5 rounded-xl border border-slate-600 transition-colors"
            title="Sair do Painel"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Alunos
              </span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white mt-2 font-mono">
              {stats.totalStudents}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Cadastrados na base</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Carteirinhas Ativas
              </span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
              {stats.activeStudents}
            </p>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">Aptas para descontos</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Inativas / Trancadas
              </span>
              <XCircle className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-rose-400 mt-2 font-mono">
              {stats.inactiveStudents}
            </p>
            <p className="text-[11px] text-rose-300/80 mt-0.5">Bloqueadas no validador</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Validações Efetuadas
              </span>
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-cyan-400 mt-2 font-mono">
              {stats.totalVerifications}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Consultas em portarias / web</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, matrícula ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            <option value="ALL">Todos os Alunos</option>
            <option value="ACTIVE">Apenas Ativos</option>
            <option value="INACTIVE">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Estudante</th>
                <th className="py-3 px-4">CPF / Matrícula</th>
                <th className="py-3 px-4">Curso & Grau</th>
                <th className="py-3 px-4">Código de Uso (CIE)</th>
                <th className="py-3 px-4">Validade</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loadingData ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-2" />
                    Carregando registros...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Nenhum estudante encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isActive = student.status === 'ACTIVE';
                  return (
                    <tr key={student.id} className="hover:bg-slate-700/30 transition-colors">
                      {/* Name & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}`}
                            alt={student.name}
                            className="w-9 h-11 object-cover rounded-md border border-amber-400/50 bg-slate-900 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}`;
                            }}
                          />
                          <div>
                            <p className="font-bold text-white text-xs">{student.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Nasc: {student.birth_date}</p>
                          </div>
                        </div>
                      </td>

                      {/* CPF & Matrícula */}
                      <td className="py-3 px-4 font-mono">
                        <p className="text-slate-200">{student.cpf}</p>
                        <p className="text-[10px] text-cyan-300 font-semibold">{student.registration}</p>
                      </td>

                      {/* Curso */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-200">{student.course}</p>
                        <p className="text-[10px] text-slate-400">{student.education_level}</p>
                      </td>

                      {/* Código de Uso */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleCopy(student.codigo_uso)}
                          className="font-mono text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 group bg-slate-900/80 px-2 py-1 rounded border border-slate-700"
                          title="Clique para copiar"
                        >
                          <span>{student.codigo_uso}</span>
                          {copiedCode === student.codigo_uso ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500 group-hover:text-amber-300" />
                          )}
                        </button>
                      </td>

                      {/* Validade */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {student.valid_until}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(student.id, student.status)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40'
                          }`}
                          title="Clique para alternar status (Ativar/Inativar)"
                        >
                          {isActive ? '● ATIVO' : '○ INATIVO'}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewStudent(student)}
                            className="p-1.5 bg-slate-700 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg transition-colors"
                            title="Ver Carteirinha Digital"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setStudentToEdit(student);
                              setIsNewModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-700 hover:bg-amber-600 text-slate-200 hover:text-white rounded-lg transition-colors"
                            title="Editar Dados"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(student.id, student.name)}
                            className="p-1.5 bg-slate-700 hover:bg-rose-600 text-slate-200 hover:text-white rounded-lg transition-colors"
                            title="Excluir Registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Box (Consultas e Leituras de QR Code Recentes) */}
      {stats?.recentLogs && stats.recentLogs.length > 0 && (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-cyan-400" /> Registro de Validações Recentes (Auditoria)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {stats.recentLogs.map((log) => (
              <div key={log.id} className="bg-slate-900/80 border border-slate-700/60 p-3 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {log.status === 'SUCCESS' ? 'VÁLIDO' : 'NEGADO'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(log.verified_at).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <p className="font-bold text-white truncate text-xs">
                  {log.student_name || 'Consulta Avulsa'}
                </p>
                <p className="font-mono text-[11px] text-amber-300 truncate">
                  {log.codigo_uso}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  IP: {log.ip_address}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New / Edit Student Modal */}
      <NewStudentModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setStudentToEdit(null);
        }}
        onSuccess={(updatedStudent) => {
          loadData();
          setIsNewModalOpen(false);
          setStudentToEdit(null);
          if (updatedStudent) {
            if (previewStudent && (previewStudent.id === updatedStudent.id || previewStudent.codigo_uso === updatedStudent.codigo_uso)) {
              setPreviewStudent(updatedStudent);
            }
            try {
              const saved = localStorage.getItem('fenec_student_data');
              if (saved) {
                const cur = JSON.parse(saved);
                if (cur.id === updatedStudent.id || cur.codigo_uso === updatedStudent.codigo_uso || cur.cpf === updatedStudent.cpf) {
                  localStorage.setItem('fenec_student_data', JSON.stringify({
                    ...cur,
                    ...updatedStudent
                  }));
                }
              }
            } catch (e) {
              console.error('Error syncing localStorage student data:', e);
            }
          }
        }}
        token={token}
        studentToEdit={studentToEdit}
      />

      {/* Card Preview Modal */}
      {previewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => setPreviewStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4 text-center">
              Prévia da Carteirinha Digital
            </h3>
            <DigitalCard 
              student={previewStudent} 
              onOpenValidator={(code) => {
                setPreviewStudent(null);
                onOpenValidator(code);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
