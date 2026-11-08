import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';
import db, { calculateDefaultValidity, generateCodigoUso } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fenec_super_secret_jwt_key_2026';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage setup for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'photo-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Auth Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login como administrador.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Admin Login
app.post('/api/auth/admin-login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!admin) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const isMatch = bcrypt.compareSync(password, admin.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  return res.json({
    token,
    admin: { id: admin.id, email: admin.email, name: admin.name }
  });
});

// Student Login (by CPF and BirthDate or Registration)
app.post('/api/auth/student-login', (req, res) => {
  const { cpf, birthDate, registration } = req.body;
  if (!cpf) {
    return res.status(400).json({ error: 'O CPF é obrigatório.' });
  }

  const cleanCpf = cpf.replace(/\D/g, '');

  // Look for student matching CPF
  const students = db.prepare('SELECT * FROM students').all();
  const student = students.find(s => s.cpf.replace(/\D/g, '') === cleanCpf);

  if (!student) {
    return res.status(404).json({ error: 'Estudante não encontrado com o CPF informado.' });
  }

  // If birthDate is provided, verify it
  if (birthDate) {
    const normalizeDate = (d) => (d || '').replace(/[\/\-\.]/g, '').trim();
    if (normalizeDate(student.birth_date) !== normalizeDate(birthDate)) {
      // Also check registration as fallback
      if (registration && student.registration.toLowerCase() !== registration.toLowerCase()) {
        return res.status(401).json({ error: 'Data de nascimento incorreta para este CPF.' });
      }
    }
  }

  // Generate student token
  const token = jwt.sign(
    { id: student.id, cpf: student.cpf, codigoUso: student.codigo_uso, role: 'student' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    student
  });
});

// ==========================================
// 2. PUBLIC VALIDATOR ROUTES (Validador DNE)
// ==========================================

// Validate via QR Code or Direct Link by Código de Uso
app.get('/api/public/validate/:codigoUso', async (req, res) => {
  const { codigoUso } = req.params;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  const student = db.prepare('SELECT * FROM students WHERE codigo_uso = ?').get(codigoUso);

  if (!student) {
    db.prepare(`
      INSERT INTO verification_logs (codigo_uso, status, ip_address, user_agent)
      VALUES (?, 'NOT_FOUND', ?, ?)
    `).run(codigoUso, ip, userAgent);

    return res.status(404).json({
      valid: false,
      status: 'NOT_FOUND',
      message: 'Documento não localizado na base de dados da FENEC.',
      checkedAt: new Date().toISOString()
    });
  }

  const isActive = student.status === 'ACTIVE';

  db.prepare(`
    INSERT INTO verification_logs (student_id, codigo_uso, status, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).run(student.id, student.codigo_uso, isActive ? 'SUCCESS' : 'INACTIVE', ip, userAgent);

  return res.json({
    valid: isActive,
    status: student.status,
    message: isActive 
      ? 'Documento de Identificação Estudantil autêntico, válido e regular.'
      : 'Atenção: Carteirinha inativa ou com matrícula trancada.',
    student: {
      name: student.name,
      cpfMasked: student.cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '***.$2.$3-**'),
      rg: student.rg + '/' + student.rg_uf,
      birthDate: student.birth_date,
      registration: student.registration,
      course: student.course,
      educationLevel: student.education_level,
      institutionName: student.institution_name,
      photoUrl: student.photo_url,
      codigoUso: student.codigo_uso,
      validUntil: student.valid_until,
      status: student.status
    },
    checkedAt: new Date().toISOString()
  });
});

// Validate manually with Código de Uso + Data de Nascimento (Matching official DNE form)
app.post('/api/public/validate-manual', (req, res) => {
  const { codigoUso, birthDate } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  if (!codigoUso || !birthDate) {
    return res.status(400).json({ error: 'Código de Uso e Data de Nascimento são obrigatórios.' });
  }

  const student = db.prepare('SELECT * FROM students WHERE codigo_uso = ?').get(codigoUso.trim());
  if (!student) {
    return res.status(404).json({
      valid: false,
      status: 'NOT_FOUND',
      message: 'Documento não localizado com este Código de Uso.'
    });
  }

  // Normalize dates for comparison (support DD/MM/YYYY or YYYY-MM-DD)
  const norm = (d) => (d || '').replace(/\D/g, '');
  const cleanInput = norm(birthDate);
  const cleanDb = norm(student.birth_date);

  // Compare DDMMYYYY
  let matches = cleanInput === cleanDb;
  if (!matches && cleanInput.length === 8 && cleanDb.length === 8) {
    // If one is YYYYMMDD and other is DDMMYYYY
    const inputReverse = cleanInput.slice(4, 8) + cleanInput.slice(2, 4) + cleanInput.slice(0, 2);
    if (inputReverse === cleanDb) matches = true;
  }

  if (!matches) {
    return res.status(400).json({
      valid: false,
      status: 'MISMATCH',
      message: 'Data de nascimento não confere com o titular deste documento.'
    });
  }

  const isActive = student.status === 'ACTIVE';

  db.prepare(`
    INSERT INTO verification_logs (student_id, codigo_uso, status, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).run(student.id, student.codigo_uso, isActive ? 'SUCCESS' : 'INACTIVE', ip, userAgent);

  return res.json({
    valid: isActive,
    status: student.status,
    message: isActive 
      ? 'Documento de Identificação Estudantil autêntico, válido e regular.'
      : 'Documento inativo ou cancelado.',
    student: {
      name: student.name,
      cpfMasked: student.cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '***.$2.$3-**'),
      rg: student.rg + '/' + student.rg_uf,
      birthDate: student.birth_date,
      registration: student.registration,
      course: student.course,
      educationLevel: student.education_level,
      institutionName: student.institution_name,
      photoUrl: student.photo_url,
      codigoUso: student.codigo_uso,
      validUntil: student.valid_until,
      status: student.status
    },
    checkedAt: new Date().toISOString()
  });
});

// Helper to generate dynamic QR Code for a student card
app.get('/api/public/qrcode/:codigoUso', async (req, res) => {
  const { codigoUso } = req.params;
  const host = req.get('host');
  const protocol = req.protocol;
  const validateUrl = `${protocol}://${host}/validar?codigo=${encodeURIComponent(codigoUso)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(validateUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    return res.json({ qrDataUrl, validateUrl });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao gerar QR Code.' });
  }
});

// ==========================================
// 3. ADMIN MANAGEMENT ROUTES
// ==========================================

// Get All Students with filters
app.get('/api/admin/students', requireAdmin, (req, res) => {
  const { search, status } = req.query;
  let query = 'SELECT * FROM students WHERE 1=1';
  const params = [];

  if (status && status !== 'ALL') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (name LIKE ? OR cpf LIKE ? OR registration LIKE ? OR codigo_uso LIKE ? OR course LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  query += ' ORDER BY created_at DESC';
  const students = db.prepare(query).all(...params);
  return res.json({ students });
});

// Get Single Student
app.get('/api/admin/students/:id', requireAdmin, (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Estudante não encontrado.' });
  return res.json({ student });
});

// Create New Student & Generate Card
app.post('/api/admin/students', requireAdmin, upload.single('photo'), (req, res) => {
  try {
    const {
      name,
      cpf,
      rg,
      rg_uf,
      birth_date,
      registration,
      course,
      education_level,
      notes
    } = req.body;

    if (!name || !cpf || !birth_date || !registration || !course) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes (Nome, CPF, Data Nasc, Matrícula, Curso).' });
    }

    // Check CPF uniqueness
    const cleanCpf = cpf.trim();
    const existingCpf = db.prepare('SELECT id FROM students WHERE cpf = ?').get(cleanCpf);
    if (existingCpf) {
      return res.status(400).json({ error: 'Já existe um estudante cadastrado com este CPF.' });
    }

    // Check registration uniqueness
    const existingReg = db.prepare('SELECT id FROM students WHERE registration = ?').get(registration.trim());
    if (existingReg) {
      return res.status(400).json({ error: 'Já existe um estudante com esta matrícula.' });
    }

    // Handle photo
    let photoUrl = req.body.photo_url || '';
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    } else if (!photoUrl) {
      photoUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1e3a8a,0f172a`;
    }

    const codigoUso = generateCodigoUso();
    const validUntil = calculateDefaultValidity();
    const institution = 'FENEC - Faculdade e Escola de Negócios e Educação Continuada';

    const stmt = db.prepare(`
      INSERT INTO students (
        name, cpf, rg, rg_uf, birth_date, registration,
        course, education_level, institution_name,
        photo_url, codigo_uso, valid_until, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `);

    const result = stmt.run(
      name.trim(),
      cleanCpf,
      (rg || '').trim(),
      (rg_uf || 'SP').toUpperCase().trim(),
      birth_date.trim(),
      registration.trim(),
      course.trim(),
      education_level || 'Graduação',
      institution,
      photoUrl,
      codigoUso,
      validUntil,
      notes || ''
    );

    const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      message: 'Estudante e Carteirinha Digital criados com sucesso!',
      student: newStudent
    });
  } catch (err) {
    console.error('Error creating student:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar estudante: ' + err.message });
  }
});

// Update Student
app.put('/api/admin/students/:id', requireAdmin, upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!student) return res.status(404).json({ error: 'Estudante não encontrado.' });

  try {
    const {
      name,
      cpf,
      rg,
      rg_uf,
      birth_date,
      registration,
      course,
      education_level,
      status,
      valid_until,
      notes
    } = req.body;

    let photoUrl = student.photo_url;
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.photo_url) {
      photoUrl = req.body.photo_url;
    }

    db.prepare(`
      UPDATE students SET
        name = ?,
        cpf = ?,
        rg = ?,
        rg_uf = ?,
        birth_date = ?,
        registration = ?,
        course = ?,
        education_level = ?,
        photo_url = ?,
        status = ?,
        valid_until = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || student.name,
      cpf || student.cpf,
      rg !== undefined ? rg : student.rg,
      rg_uf || student.rg_uf,
      birth_date || student.birth_date,
      registration || student.registration,
      course || student.course,
      education_level || student.education_level,
      photoUrl,
      status || student.status,
      valid_until || student.valid_until,
      notes !== undefined ? notes : student.notes,
      id
    );

    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    return res.json({ message: 'Estudante atualizado com sucesso.', student: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar: ' + err.message });
  }
});

// Toggle Status (ACTIVE / INACTIVE)
app.patch('/api/admin/students/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Use ACTIVE ou INACTIVE.' });
  }

  db.prepare('UPDATE students SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  return res.json({ message: `Status alterado para ${status}.`, student: updated });
});

// Delete Student
app.delete('/api/admin/students/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM students WHERE id = ?').run(id);
  return res.json({ message: 'Estudante excluído com sucesso.' });
});

// Dashboard Stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const totalStudents = db.prepare('SELECT count(*) as count FROM students').get().count;
  const activeStudents = db.prepare("SELECT count(*) as count FROM students WHERE status = 'ACTIVE'").get().count;
  const inactiveStudents = totalStudents - activeStudents;
  const totalVerifications = db.prepare('SELECT count(*) as count FROM verification_logs').get().count;
  const recentLogs = db.prepare(`
    SELECT v.*, s.name as student_name, s.course as student_course
    FROM verification_logs v
    LEFT JOIN students s ON v.student_id = s.id
    ORDER BY v.verified_at DESC
    LIMIT 8
  `).all();

  return res.json({
    totalStudents,
    activeStudents,
    inactiveStudents,
    totalVerifications,
    recentLogs
  });
});

// Serve frontend in production
const distDir = path.join(__dirname, '../client/dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    // If request is for an API route that didn't match, send 404 json
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Rota de API não encontrada.' });
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor FENEC rodando com sucesso na porta ${PORT}`);
  console.log(`🌐 Validador Público: http://localhost:${PORT}/validar`);
  console.log(`👤 Portal Administrativo & Estudante ativos.`);
});
