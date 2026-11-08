import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    rg TEXT NOT NULL,
    rg_uf TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    registration TEXT UNIQUE NOT NULL,
    course TEXT NOT NULL,
    education_level TEXT NOT NULL,
    institution_name TEXT DEFAULT 'FENEC - Faculdade e Escola de Negócios e Educação Continuada',
    photo_url TEXT,
    codigo_uso TEXT UNIQUE NOT NULL,
    valid_until TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS verification_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    codigo_uso TEXT,
    status TEXT,
    ip_address TEXT,
    user_agent TEXT,
    verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE SET NULL
  );
`);

// Calculate standard legal validity date (31 de março do ano subsequente)
export function calculateDefaultValidity(date = new Date()) {
  const currentYear = date.getFullYear();
  const nextYear = currentYear + 1;
  return `31/03/${nextYear}`;
}

// Generate unique Código de Uso (DNE standard format: FENEC-YYYY-XXXXXX)
export function generateCodigoUso() {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 7; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FENEC-${year}-${rand}`;
}

// Seed default admin and sample students if empty
const adminCount = db.prepare('SELECT count(*) as count FROM admins').get();
if (adminCount.count === 0) {
  const defaultPassword = 'admin123';
  const hash = bcrypt.hashSync(defaultPassword, 10);
  db.prepare(`
    INSERT INTO admins (email, password_hash, name)
    VALUES (?, ?, ?)
  `).run('admin@fenec.edu.br', hash, 'Administrador FENEC');
  console.log('✅ Administrador padrão criado: admin@fenec.edu.br / admin123');
}

const studentCount = db.prepare('SELECT count(*) as count FROM students').get();
if (studentCount.count === 0) {
  const validity = calculateDefaultValidity();
  
  // Seed sample student 1
  db.prepare(`
    INSERT INTO students (
      name, cpf, rg, rg_uf, birth_date, registration,
      course, education_level, institution_name,
      photo_url, codigo_uso, valid_until, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Ana Clara de Oliveira Mendes',
    '123.456.789-00',
    'MG-18.945.321',
    'MG',
    '15/05/2002',
    '2026.1.0042',
    'Engenharia de Software',
    'Graduação - Bacharelado',
    'FENEC - Faculdade e Escola de Negócios e Educação Continuada',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'FENEC-2026-K7M9Q21',
    validity,
    'ACTIVE',
    'Aluno bolsista destaque'
  );

  // Seed sample student 2
  db.prepare(`
    INSERT INTO students (
      name, cpf, rg, rg_uf, birth_date, registration,
      course, education_level, institution_name,
      photo_url, codigo_uso, valid_until, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Lucas Ferreira da Silva',
    '987.654.321-99',
    'SP-44.512.890',
    'SP',
    '28/11/1999',
    '2026.1.0118',
    'Administração de Empresas e Inovação',
    'Pós-Graduação - MBA',
    'FENEC - Faculdade e Escola de Negócios e Educação Continuada',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'FENEC-2026-X4L8B55',
    validity,
    'ACTIVE',
    'Representante de turma'
  );

  console.log('✅ Estudantes de demonstração inseridos na base FENEC.');
}

export default db;
