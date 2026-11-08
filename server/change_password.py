import sqlite3
import bcrypt
import sys

db_path = sys.argv[1] if len(sys.argv) > 1 else "/home/ubuntu/fenec/backend/fenec.db"
new_password = "enb1palms"

new_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

cursor.execute("UPDATE admins SET password_hash = ? WHERE email = ?", (new_hash, "admin@fenec.edu.br"))
if cursor.rowcount == 0:
    cursor.execute("INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)",
                   ("admin@fenec.edu.br", new_hash, "Administrador FENEC"))
    print("Admin inserido com nova senha!")
else:
    print(f"Senha atualizada para {cursor.rowcount} administrador(es)!")

conn.commit()

# Verify
admin = conn.execute("SELECT id, email, password_hash, name FROM admins WHERE email = 'admin@fenec.edu.br'").fetchone()
if admin and bcrypt.checkpw(new_password.encode("utf-8"), admin["password_hash"].encode("utf-8")):
    print("✅ Verificacao de senha BCRYPT bem-sucedida para admin@fenec.edu.br!")
else:
    print("❌ Falha na verificacao da senha!")

conn.close()
