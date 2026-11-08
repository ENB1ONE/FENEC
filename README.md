# FENEC — Sistema de Carteirinhas Estudantis Digitais & Validador Oficial

Sistema completo para emissão, controle institucional e validação em tempo real de **Carteirinhas de Estudante 100% Online** para a **FENEC (Faculdade e Escola de Negócios e Educação Continuada)**, em conformidade com o padrão nacional do Documento Nacional do Estudante (DNE / Lei Federal nº 12.933/2013 e Decreto nº 8.537/2015).

---

## 🌟 Módulos do Sistema

### 1. 🎓 Portal do Estudante (Carteirinha Digital)
* **Acesso Simplificado:** Login do estudante por **CPF** e **Data de Nascimento** (ou Matrícula).
* **Carteira Digital Interativa:**
  * Design móvel moderno no formato padrão CIE (3:2), com frente e verso giratórios em 3D.
  * Dados obrigatórios: Nome completo, Foto 3x4, Curso, Nível acadêmico, Matrícula (RA), CPF, RG/UF, Data de nascimento e Validade.
  * **Código de Uso exclusivo** (número da CIE no padrão DNE: `FENEC-YYYY-XXXXXXX`) com botão de cópia rápida para compras de ingressos online.
  * **QR Code Oficial:** Gera link direto e seguro para o validador público da FENEC.
  * **Mecanismos Anti-Fraude (Anti-Print):**
    * Relógio digital dinâmico sincronizado em tempo real com segundos correndo (`HH:mm:ss`).
    * Radar pulsante verde indicando documento ativo em tempo real.
    * Efeito holográfico cintilante em gradiente CSS sobre o cartão.
  * Botões de ação: Girar frente/verso, Imprimir / Salvar em PDF e Validar.

### 2. 🔍 Validador Oficial de Carteirinhas
* **Leitura Automática por QR Code:** Ao apontar a câmera do celular para o QR Code da carteirinha, a página abre e consulta instantaneamente a base acadêmica.
* **Consulta Manual no Padrão DNE:** Permite consultar inserindo o **Código de Uso** + **Data de Nascimento** (exatamente como no validador do `documentodoestudante.com.br/validador/`).
* **Atestado Visual de Autenticidade:**
  * Selo verde **"DOCUMENTO VÁLIDO E REGULAR"** com foto oficial do titular, curso, matrícula, data limite e chave de segurança da FENEC.
  * Alerta vermelho claro em caso de documento inexistente, matrícula trancada ou dados divergentes.

### 3. 🔐 Painel Administrativo / Secretaria
* **Gestão de Estudantes:**
  * Cadastro completo de alunos com upload de foto recente (com pré-visualização imediata) ou URL.
  * Geração automática do **Código de Uso** alfanumérico único.
  * Cálculo automático da validade legal para **31 de março do ano subsequente**.
  * Ativação e bloqueio imediato de carteirinhas (para matrículas trancadas ou canceladas).
  * Edição e exclusão de cadastros.
* **Métricas em Tempo Real:** Total de alunos, carteirinhas ativas, inativas e contagem de verificações realizadas.
* **Trilha de Auditoria (Logs):** Registro de todas as consultas e leituras de QR Code realizadas por portarias, eventos ou bilheterias, com IP, status e horário.

---

## 🔑 Credenciais de Teste / Demonstração

O sistema já vem populado com dados de teste para demonstração imediata:

| Perfil | Acesso | Credenciais |
| :--- | :--- | :--- |
| **Secretaria (Admin)** | Aba "Secretaria" | **E-mail:** `admin@fenec.edu.br`<br>**Senha:** `admin123` |
| **Estudante 1** | Aba "Aluno" | **CPF:** `123.456.789-00`<br>**Nascimento:** `15/05/2002`<br>*(Ana Clara - Eng. de Software)* |
| **Estudante 2** | Aba "Aluno" | **CPF:** `987.654.321-99`<br>**Nascimento:** `28/11/1999`<br>*(Lucas Ferreira - MBA Admin)* |

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* Node.js v18+ instalado.

### Passo a Passo

1. **Instalar dependências (caso seja clonado em novo ambiente):**
```bash
npm install
cd client && npm install && cd ..
```

2. **Compilar o frontend:**
```bash
npm run build
```

3. **Iniciar o servidor da aplicação:**
```bash
npm start
```
O sistema ficará disponível em: **`http://localhost:3001`**

Para desenvolvimento com hot-reload no frontend (opcional):
```bash
npm run client
```
*(Acessível em `http://localhost:5173` com proxy automático para a API em `http://localhost:3001`)*

4. **Executar testes automatizados da API:**
```bash
npm test
```

---

## 📂 Estrutura de Pastas

```text
carteirinha/
├── client/                     # Aplicação Frontend (Vite + React + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── DigitalCard.tsx       # Componente 3D da Carteira Estudantil Digital
│   │   │   ├── ValidatorView.tsx     # Página do Validador Oficial (DNE)
│   │   │   ├── StudentPortal.tsx     # Login e portal do aluno
│   │   │   ├── AdminPanel.tsx        # Dashboard e gestão de estudantes
│   │   │   ├── NewStudentModal.tsx   # Modal de emissão/cadastro com upload de foto
│   │   │   └── Navbar.tsx            # Barra de navegação e atalhos rápidos
│   │   ├── App.tsx                   # Roteamento e estados principais
│   │   ├── types.ts                  # Tipagens TypeScript
│   │   └── utils.ts                  # Máscaras de CPF e data
│   └── dist/                   # Build compilado estático para produção
├── server/                     # Backend Node.js / Express
│   ├── db.js                   # Banco de dados SQLite (better-sqlite3) e seeds
│   ├── server.js               # APIs REST, autenticação JWT, uploads e validação
│   ├── test_api.js             # Testes automatizados das rotas
│   └── uploads/                # Armazenamento das fotos enviadas
├── package.json
└── README.md
```
