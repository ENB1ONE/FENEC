import React, { useState, useRef, useEffect } from 'react';
import { Student } from '../types';
import { 
  X, 
  Upload, 
  User, 
  CreditCard, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  CheckCircle2,
  Camera,
  RotateCw,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { maskCPF, maskDate } from '../utils';
import { apiUrl } from '../api';

interface NewStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  studentToEdit?: Student | null;
}

export const NewStudentModal: React.FC<NewStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  token,
  studentToEdit
}) => {
  const [name, setName] = useState(studentToEdit?.name || '');
  const [cpf, setCpf] = useState(studentToEdit?.cpf || '');
  const [rg, setRg] = useState(studentToEdit?.rg || '');
  const [rgUf, setRgUf] = useState(studentToEdit?.rg_uf || 'SP');
  const [birthDate, setBirthDate] = useState(studentToEdit?.birth_date || '');
  const [registration, setRegistration] = useState(studentToEdit?.registration || '');
  const [course, setCourse] = useState(studentToEdit?.course || '');
  const [educationLevel, setEducationLevel] = useState(studentToEdit?.education_level || 'Graduação');
  const [notes, setNotes] = useState(studentToEdit?.notes || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(studentToEdit?.photo_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (mode: 'user' | 'environment' = 'user') => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não é suportada ou permitida neste navegador.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      streamRef.current = stream;
      setFacingMode(mode);
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões do dispositivo.');
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.error('Video play error:', e));
    }
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `estudante-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhotoFile(file);
        setPhotoPreview(canvas.toDataURL('image/jpeg', 0.9));
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cpf.trim() || !birthDate.trim() || !registration.trim() || !course.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('cpf', cpf.trim());
    formData.append('rg', rg.trim());
    formData.append('rg_uf', rgUf.trim());
    formData.append('birth_date', birthDate.trim());
    formData.append('registration', registration.trim());
    formData.append('course', course.trim());
    formData.append('education_level', educationLevel);
    formData.append('notes', notes.trim());

    if (photoFile) {
      formData.append('photo', photoFile);
    } else if (photoPreview && photoPreview.startsWith('http')) {
      formData.append('photo_url', photoPreview);
    }

    try {
      const endpoint = studentToEdit 
        ? `/api/admin/students/${studentToEdit.id}`
        : '/api/admin/students';
      const method = studentToEdit ? 'PUT' : 'POST';

      const res = await fetch(apiUrl(endpoint), {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação.');
      }

      stopCamera();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar estudante.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-cyan-400 flex items-center justify-center border border-blue-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {studentToEdit ? 'Editar Carteirinha / Aluno' : 'Emitir Nova Carteirinha FENEC'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Photo Upload & Camera Capture Section */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300">
                Foto do Estudante (Estilo 3x4 / Documento)
              </label>
              <p className="text-[11px] text-slate-400">
                Tire uma foto na hora com a câmera do celular/computador ou selecione um arquivo.
              </p>
            </div>

            {cameraError && (
              <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden bg-black border-2 border-cyan-500/80 p-3 flex flex-col items-center">
                <div className="relative w-full max-w-xs aspect-[3/4] bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  />
                  {/* Guide overlay for face */}
                  <div className="absolute inset-4 border-2 border-dashed border-cyan-400/60 rounded-[50%] pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] text-cyan-200/90 bg-slate-900/80 px-2 py-0.5 rounded-full font-semibold">
                      Posicione o rosto
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 w-full justify-center">
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capturar Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-600"
                    title="Alternar Câmera"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Inverter</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-3 rounded-xl text-xs font-semibold border border-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-24 rounded-lg overflow-hidden border-2 border-amber-400/80 bg-slate-950 flex-shrink-0 flex items-center justify-center shadow">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-500" />
                  )}
                </div>

                <div className="flex-1 w-full text-center sm:text-left">
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => startCamera('user')}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Tirar Foto com Câmera</span>
                    </button>

                    <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold py-2 px-3.5 rounded-lg border border-slate-600 inline-flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Enviar Arquivo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoChange} 
                        className="hidden" 
                      />
                    </label>

                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
                        className="text-xs text-rose-400 hover:text-rose-300 py-2 px-2 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Student Fields */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Nome Completo do Estudante *
            </label>
            <input
              type="text"
              placeholder="Ex: Mariana Castro Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                CPF do Estudante *
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                maxLength={14}
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2 text-sm font-mono text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Data de Nascimento *
              </label>
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                value={birthDate}
                onChange={(e) => setBirthDate(maskDate(e.target.value))}
                maxLength={10}
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2 text-sm font-mono text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                RG (Registro Geral)
              </label>
              <input
                type="text"
                placeholder="Ex: 12.345.678"
                value={rg}
                onChange={(e) => setRg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2 text-sm font-mono text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                UF do RG
              </label>
              <input
                type="text"
                placeholder="SP"
                maxLength={2}
                value={rgUf}
                onChange={(e) => setRgUf(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2 text-sm font-mono text-white text-center uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Matrícula (RA) *
              </label>
              <input
                type="text"
                placeholder="Ex: 2026.1.0089"
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2 text-sm font-mono text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Nível de Ensino
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white"
              >
                <option value="Graduação - Bacharelado">Graduação - Bacharelado</option>
                <option value="Graduação - Licenciatura">Graduação - Licenciatura</option>
                <option value="Graduação - Tecnólogo">Graduação - Tecnólogo</option>
                <option value="Pós-Graduação - Especialização">Pós-Graduação - Especialização</option>
                <option value="Pós-Graduação - MBA">Pós-Graduação - MBA</option>
                <option value="Mestrado / Doutorado">Mestrado / Doutorado</option>
                <option value="Ensino Técnico Profissional">Ensino Técnico Profissional</option>
                <option value="Extensão Universitária">Extensão Universitária</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Curso / Especialização *
            </label>
            <input
              type="text"
              placeholder="Ex: Ciência de Dados e Inteligência Artificial"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Observações Internas (Opcional)
            </label>
            <textarea
              placeholder="Bolsa integral, diretório acadêmico, campus, etc."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 resize-none"
            />
          </div>

          {/* Legal notes */}
          <div className="bg-blue-950/40 border border-blue-800/40 p-3 rounded-xl text-[11px] text-cyan-200">
            ℹ️ O <strong>Código de Uso</strong> exclusivo e o <strong>QR Code</strong> serão gerados automaticamente. A validade será calculada para <strong>31 de março do ano seguinte</strong> conforme o padrão legal do DNE.
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Gravando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{studentToEdit ? 'Salvar Alterações' : 'Emitir Carteirinha'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
