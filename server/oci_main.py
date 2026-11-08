import os
import sqlite3
import random
import string
import datetime
import io
import base64
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import bcrypt
import jwt
import qrcode

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
DB_PATH = os.path.join(BASE_DIR, "fenec.db")
JWT_SECRET = os.getenv("JWT_SECRET", "fenec_super_secret_jwt_key_2026")

# Database initialization
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("""
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
    """)
    cursor.execute("""
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
    """)

    # Seed Admin
    cursor.execute("SELECT count(*) as count FROM admins")
    if cursor.fetchone()["count"] == 0:
        hashed = bcrypt.hashpw(b"enb1palms", bcrypt.gensalt()).decode("utf-8")
        cursor.execute("INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)",
                       ("admin@fenec.edu.br", hashed, "Administrador FENEC"))
        conn.commit()
        print("✅ Admin padrão criado: admin@fenec.edu.br")

    # Seed Students
    cursor.execute("SELECT count(*) as count FROM students")
    if cursor.fetchone()["count"] == 0:
        validity = f"31/03/{datetime.date.today().year + 1}"
        cursor.execute("""
        INSERT INTO students (
            name, cpf, rg, rg_uf, birth_date, registration,
            course, education_level, institution_name,
            photo_url, codigo_uso, valid_until, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "Ana Clara de Oliveira Mendes",
            "123.456.789-00",
            "MG-18.945.321",
            "MG",
            "15/05/2002",
            "2026.1.0042",
            "Engenharia de Software",
            "Graduação - Bacharelado",
            "FENEC - Faculdade e Escola de Negócios e Educação Continuada",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            "FENEC-2026-K7M9Q21",
            validity,
            "ACTIVE",
            "Aluno bolsista destaque"
        ))
        cursor.execute("""
        INSERT INTO students (
            name, cpf, rg, rg_uf, birth_date, registration,
            course, education_level, institution_name,
            photo_url, codigo_uso, valid_until, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "Lucas Ferreira da Silva",
            "987.654.321-99",
            "SP-44.512.890",
            "SP",
            "28/11/1999",
            "2026.1.0118",
            "Administração de Empresas e Inovação",
            "Pós-Graduação - MBA",
            "FENEC - Faculdade e Escola de Negócios e Educação Continuada",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
            "FENEC-2026-X4L8B55",
            validity,
            "ACTIVE",
            "Representante de turma"
        ))
        conn.commit()
        print("✅ Estudantes padrão criados.")

    conn.close()

init_db()

# Helpers
def calculate_default_validity():
    year = datetime.date.today().year + 1
    return f"31/03/{year}"

def generate_codigo_uso():
    year = datetime.date.today().year
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    rand = "".join(random.choice(chars) for _ in range(7))
    return f"FENEC-{year}-{rand}"

# FastAPI App
app = FastAPI(title="FENEC Carteirinha & Validador API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Security Dependency
def require_admin(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Acesso não autorizado.")
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")

# Pydantic Models
class AdminLoginRequest(BaseModel):
    email: str
    password: str

class StudentLoginRequest(BaseModel):
    cpf: str
    birthDate: Optional[str] = None
    registration: Optional[str] = None

class ValidateManualRequest(BaseModel):
    codigoUso: str
    birthDate: str

class StatusUpdateRequest(BaseModel):
    status: str

# ----------------- AUTH ROUTES -----------------
@app.post("/api/auth/admin-login")
def admin_login(req: AdminLoginRequest):
    conn = get_db()
    admin = conn.execute("SELECT * FROM admins WHERE email = ?", (req.email.strip(),)).fetchone()
    conn.close()
    if not admin:
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    
    if not bcrypt.checkpw(req.password.encode("utf-8"), admin["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")

    token = jwt.encode(
        {"id": admin["id"], "email": admin["email"], "name": admin["name"], "role": "admin"},
        JWT_SECRET,
        algorithm="HS256"
    )
    return {
        "token": token,
        "admin": {"id": admin["id"], "email": admin["email"], "name": admin["name"]}
    }

@app.post("/api/auth/student-login")
def student_login(req: StudentLoginRequest):
    clean_cpf = "".join(filter(str.isdigit, req.cpf))
    conn = get_db()
    students = conn.execute("SELECT * FROM students").fetchall()
    
    matched = None
    for s in students:
        if "".join(filter(str.isdigit, s["cpf"])) == clean_cpf:
            matched = s
            break
            
    if not matched:
        conn.close()
        raise HTTPException(status_code=404, detail="Estudante não encontrado com este CPF.")

    if req.birthDate:
        norm_in = "".join(filter(str.isalnum, req.birthDate))
        norm_db = "".join(filter(str.isalnum, matched["birth_date"]))
        if norm_in != norm_db:
            conn.close()
            raise HTTPException(status_code=401, detail="Data de nascimento incorreta para este CPF.")

    token = jwt.encode(
        {"id": matched["id"], "cpf": matched["cpf"], "codigoUso": matched["codigo_uso"], "role": "student"},
        JWT_SECRET,
        algorithm="HS256"
    )
    conn.close()
    return {
        "token": token,
        "student": dict(matched)
    }

# ----------------- PUBLIC VALIDATOR -----------------
@app.get("/api/public/validate/{codigo_uso}")
def validate_qr(codigo_uso: str, request: Request):
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "")
    conn = get_db()
    student = conn.execute("SELECT * FROM students WHERE codigo_uso = ?", (codigo_uso.strip(),)).fetchone()

    if not student:
        conn.execute("INSERT INTO verification_logs (codigo_uso, status, ip_address, user_agent) VALUES (?, 'NOT_FOUND', ?, ?)",
                     (codigo_uso, ip, ua))
        conn.commit()
        conn.close()
        return JSONResponse(status_code=404, content={
            "valid": False,
            "status": "NOT_FOUND",
            "message": "Documento não localizado na base de dados da FENEC.",
            "checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })

    is_active = student["status"] == "ACTIVE"
    conn.execute("INSERT INTO verification_logs (student_id, codigo_uso, status, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
                 (student["id"], student["codigo_uso"], "SUCCESS" if is_active else "INACTIVE", ip, ua))
    conn.commit()
    conn.close()

    cpf_val = student["cpf"]
    cpf_masked = f"***.{cpf_val[4:7]}.{cpf_val[8:11]}-**" if len(cpf_val) >= 14 else "***.***.***-**"

    return {
        "valid": is_active,
        "status": student["status"],
        "message": "Documento de Identificação Estudantil autêntico, válido e regular." if is_active else "Documento inativo ou trancado.",
        "student": {
            "name": student["name"],
            "cpfMasked": cpf_masked,
            "rg": f"{student['rg']}/{student['rg_uf']}",
            "birthDate": student["birth_date"],
            "registration": student["registration"],
            "course": student["course"],
            "educationLevel": student["education_level"],
            "institutionName": student["institution_name"],
            "photoUrl": student["photo_url"],
            "codigoUso": student["codigo_uso"],
            "validUntil": student["valid_until"],
            "status": student["status"]
        },
        "checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@app.post("/api/public/validate-manual")
def validate_manual(req: ValidateManualRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "")
    conn = get_db()
    student = conn.execute("SELECT * FROM students WHERE codigo_uso = ?", (req.codigoUso.strip(),)).fetchone()

    if not student:
        conn.close()
        return JSONResponse(status_code=404, content={
            "valid": False,
            "status": "NOT_FOUND",
            "message": "Documento não localizado com este Código de Uso."
        })

    norm_in = "".join(filter(str.isdigit, req.birthDate))
    norm_db = "".join(filter(str.isdigit, student["birth_date"]))

    matches = (norm_in == norm_db)
    if not matches and len(norm_in) == 8 and len(norm_db) == 8:
        # Check YYYYMMDD vs DDMMYYYY
        rev = norm_in[4:8] + norm_in[2:4] + norm_in[0:2]
        if rev == norm_db:
            matches = True

    if not matches:
        conn.close()
        return JSONResponse(status_code=400, content={
            "valid": False,
            "status": "MISMATCH",
            "message": "Data de nascimento não confere com o titular deste documento."
        })

    is_active = student["status"] == "ACTIVE"
    conn.execute("INSERT INTO verification_logs (student_id, codigo_uso, status, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
                 (student["id"], student["codigo_uso"], "SUCCESS" if is_active else "INACTIVE", ip, ua))
    conn.commit()
    conn.close()

    cpf_val = student["cpf"]
    cpf_masked = f"***.{cpf_val[4:7]}.{cpf_val[8:11]}-**" if len(cpf_val) >= 14 else "***.***.***-**"

    return {
        "valid": is_active,
        "status": student["status"],
        "message": "Documento de Identificação Estudantil autêntico, válido e regular." if is_active else "Documento inativo ou cancelado.",
        "student": {
            "name": student["name"],
            "cpfMasked": cpf_masked,
            "rg": f"{student['rg']}/{student['rg_uf']}",
            "birthDate": student["birth_date"],
            "registration": student["registration"],
            "course": student["course"],
            "educationLevel": student["education_level"],
            "institutionName": student["institution_name"],
            "photoUrl": student["photo_url"],
            "codigoUso": student["codigo_uso"],
            "validUntil": student["valid_until"],
            "status": student["status"]
        },
        "checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@app.get("/api/public/qrcode/{codigo_uso}")
def get_qrcode(codigo_uso: str, request: Request):
    # Public validation link pointing to GitHub Pages frontend
    validate_url = f"https://enb1one.github.io/FENEC/?codigo={codigo_uso}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=8,
        border=1,
    )
    qr.add_data(validate_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    qr_data_url = f"data:image/png;base64,{b64}"
    
    return {"qrDataUrl": qr_data_url, "validateUrl": validate_url}

# ----------------- ADMIN API -----------------
@app.get("/api/admin/students")
def list_students(search: Optional[str] = None, status: Optional[str] = None, admin=Depends(require_admin)):
    conn = get_db()
    query = "SELECT * FROM students WHERE 1=1"
    params = []
    if status and status != "ALL":
        query += " AND status = ?"
        params.append(status)
    if search:
        query += " AND (name LIKE ? OR cpf LIKE ? OR registration LIKE ? OR codigo_uso LIKE ? OR course LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s, s])
    query += " ORDER BY created_at DESC"
    
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return {"students": [dict(r) for r in rows]}

@app.get("/api/admin/students/{student_id}")
def get_student(student_id: int, admin=Depends(require_admin)):
    conn = get_db()
    row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Estudante não encontrado.")
    return {"student": dict(row)}

@app.post("/api/admin/students")
async def create_student(
    name: str = Form(...),
    cpf: str = Form(...),
    rg: Optional[str] = Form(""),
    rg_uf: Optional[str] = Form("SP"),
    birth_date: str = Form(...),
    registration: str = Form(...),
    course: str = Form(...),
    education_level: Optional[str] = Form("Graduação"),
    notes: Optional[str] = Form(""),
    photo_url: Optional[str] = Form(""),
    photo: Optional[UploadFile] = File(None),
    admin=Depends(require_admin)
):
    conn = get_db()
    if conn.execute("SELECT id FROM students WHERE cpf = ?", (cpf.strip(),)).fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Já existe um estudante cadastrado com este CPF.")
    if conn.execute("SELECT id FROM students WHERE registration = ?", (registration.strip(),)).fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Já existe um estudante com esta matrícula.")

    final_photo = photo_url or ""
    if photo and photo.filename:
        filename = f"photo-{int(datetime.datetime.now().timestamp())}-{photo.filename}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        contents = await photo.read()
        with open(filepath, "wb") as f:
            f.write(contents)
        final_photo = f"https://alfa-api.servicesbr.duckdns.org/fenec-api/uploads/{filename}"
    elif not final_photo:
        final_photo = f"https://api.dicebear.com/7.x/initials/svg?seed={name}&backgroundColor=1e3a8a,0f172a"

    codigo_uso = generate_codigo_uso()
    valid_until = calculate_default_validity()
    institution = "FENEC - Faculdade e Escola de Negócios e Educação Continuada"

    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO students (
        name, cpf, rg, rg_uf, birth_date, registration,
        course, education_level, institution_name,
        photo_url, codigo_uso, valid_until, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    """, (
        name.strip(), cpf.strip(), (rg or "").strip(), (rg_uf or "SP").upper().strip(),
        birth_date.strip(), registration.strip(), course.strip(), education_level,
        institution, final_photo, codigo_uso, valid_until, notes or ""
    ))
    new_id = cursor.lastrowid
    conn.commit()
    new_student = conn.execute("SELECT * FROM students WHERE id = ?", (new_id,)).fetchone()
    conn.close()

    return {"message": "Estudante e Carteirinha criados com sucesso!", "student": dict(new_student)}

@app.put("/api/admin/students/{student_id}")
async def update_student(
    student_id: int,
    name: Optional[str] = Form(None),
    cpf: Optional[str] = Form(None),
    rg: Optional[str] = Form(None),
    rg_uf: Optional[str] = Form(None),
    birth_date: Optional[str] = Form(None),
    registration: Optional[str] = Form(None),
    course: Optional[str] = Form(None),
    education_level: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    valid_until: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    photo_url: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    admin=Depends(require_admin)
):
    conn = get_db()
    current = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if not current:
        conn.close()
        raise HTTPException(status_code=404, detail="Estudante não encontrado.")

    final_photo = photo_url or current["photo_url"]
    if photo and photo.filename:
        filename = f"photo-{int(datetime.datetime.now().timestamp())}-{photo.filename}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        contents = await photo.read()
        with open(filepath, "wb") as f:
            f.write(contents)
        final_photo = f"https://alfa-api.servicesbr.duckdns.org/fenec-api/uploads/{filename}"

    conn.execute("""
    UPDATE students SET
        name = ?, cpf = ?, rg = ?, rg_uf = ?, birth_date = ?,
        registration = ?, course = ?, education_level = ?,
        photo_url = ?, status = ?, valid_until = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (
        name or current["name"],
        cpf or current["cpf"],
        rg if rg is not None else current["rg"],
        rg_uf or current["rg_uf"],
        birth_date or current["birth_date"],
        registration or current["registration"],
        course or current["course"],
        education_level or current["education_level"],
        final_photo,
        status or current["status"],
        valid_until or current["valid_until"],
        notes if notes is not None else current["notes"],
        student_id
    ))
    conn.commit()
    updated = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    conn.close()
    return {"message": "Estudante atualizado com sucesso.", "student": dict(updated)}

@app.patch("/api/admin/students/{student_id}/status")
def patch_status(student_id: int, req: StatusUpdateRequest, admin=Depends(require_admin)):
    conn = get_db()
    conn.execute("UPDATE students SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (req.status, student_id))
    conn.commit()
    updated = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    conn.close()
    return {"message": f"Status alterado para {req.status}.", "student": dict(updated)}

@app.delete("/api/admin/students/{student_id}")
def delete_student(student_id: int, admin=Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM students WHERE id = ?", (student_id,))
    conn.commit()
    conn.close()
    return {"message": "Estudante excluído com sucesso."}

@app.get("/api/admin/stats")
def get_stats(admin=Depends(require_admin)):
    conn = get_db()
    total = conn.execute("SELECT count(*) as c FROM students").fetchone()["c"]
    active = conn.execute("SELECT count(*) as c FROM students WHERE status = 'ACTIVE'").fetchone()["c"]
    inactive = total - active
    verifications = conn.execute("SELECT count(*) as c FROM verification_logs").fetchone()["c"]
    recent = conn.execute("""
        SELECT v.*, s.name as student_name, s.course as student_course
        FROM verification_logs v
        LEFT JOIN students s ON v.student_id = s.id
        ORDER BY v.verified_at DESC
        LIMIT 8
    """).fetchall()
    conn.close()

    return {
        "totalStudents": total,
        "activeStudents": active,
        "inactiveStudents": inactive,
        "totalVerifications": verifications,
        "recentLogs": [dict(r) for r in recent]
    }
