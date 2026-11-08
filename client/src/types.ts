export interface Student {
  id: number;
  name: string;
  cpf: string;
  rg: string;
  rg_uf: string;
  birth_date: string;
  registration: string;
  course: string;
  education_level: string;
  institution_name: string;
  photo_url?: string;
  codigo_uso: string;
  valid_until: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface VerificationResult {
  valid: boolean;
  status: string;
  message: string;
  student?: {
    name: string;
    cpfMasked: string;
    rg: string;
    birthDate: string;
    registration: string;
    course: string;
    educationLevel: string;
    institutionName: string;
    photoUrl?: string;
    codigoUso: string;
    validUntil: string;
    status: string;
  };
  checkedAt: string;
}

export interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalVerifications: number;
  recentLogs: Array<{
    id: number;
    student_id?: number;
    student_name?: string;
    student_course?: string;
    codigo_uso: string;
    status: string;
    ip_address: string;
    verified_at: string;
  }>;
}
