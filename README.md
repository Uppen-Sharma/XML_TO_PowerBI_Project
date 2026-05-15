# PBI Accelerator (Cognos XML to Power BI Project)

A high-performance enterprise solution that seamlessly converts Cognos XML report definitions into Power BI Project (PBIP) format. This application combines a robust **FastAPI** backend for complex XML parsing with a premium **React + Vite** frontend, designed for professional users who need to migrate legacy reporting assets to modern Power BI environments.

---

## ✨ Key Features

- **Premium UI/UX**: Modern, split-screen interface with SRM Tech branding, high-fidelity micro-animations, and responsive design optimized for productivity.
- **Enterprise Security**: Built-in support for **Microsoft Entra ID (Azure AD)** authentication via `oauth2-proxy` and header-based verification.
- **Smart Parsing Engine**: Automatically extracts dimensions, fields, and measures from Cognos XML, translating them into the Power BI Tabular Object Model (TOM).
- **Automated PBIP Generation**: Generates a complete Power BI Project structure, including `model.bim`, `report.json`, and `dataSources.json`, delivered as a ready-to-use `.zip` archive.
- **Secure Processing**: Transient file handling ensures that uploaded XMLs and generated projects are processed in-memory or in temporary storage, adhering to data privacy standards.

---

## 🏗️ Architecture

The project is structured as a modern monorepo:

- **`/backend`**: Python FastAPI application.
  - `main.py`: Enterprise-grade API with authentication middleware and global exception handling.
  - `pbip_generator.py`: The core transformation engine using XML heuristics and TOM mapping.
- **`/frontend`**: React 19 SPA.
  - **Vite 6** & **Tailwind CSS 4**: Optimized for lightning-fast development and minimal bundle size.
  - **Lucide React**: Premium iconography.
  - **Protected Routes**: Integrated authentication flow with support for local development and production SSO.

---

## 🚀 Getting Started

### 1. Environment Configuration

Both tiers require environment variables. Copy the examples to get started:

```bash
# In /backend
cp .env.example .env

# In /frontend
cp .env.example .env
```

| Variable          | Description                                     | Default        |
| :---------------- | :---------------------------------------------- | :------------- |
| `AUTH_MODE`       | Set to `dev` for local testing, `prod` for SSO. | `dev`          |
| `ALLOWED_DOMAINS` | Restricted email domains (comma-separated).     | `@srmtech.com` |

### 2. Start the Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
```

_API will be live at `http://localhost:8000`._

### 3. Start the Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

_UI will be live at `http://localhost:5173`._

---

## 🔐 Authentication Flow

The application supports two primary authentication modes defined via `.env`:

1.  **Development (`dev`)**: A mock login screen for local testing. Any email passing domain validation can access the dashboard.
2.  **Production (`prod`)**: Designed to run behind a reverse proxy (like NGINX) with `oauth2-proxy`. The backend validates `X-Auth-Request-Email` and `X-Auth-Request-User` headers injected by the proxy after a successful Microsoft Entra ID login.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS 4, Axios, React Router 7, Lucide React.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, XML.etree, Python-Dotenv.
- **Deployment**: Docker-ready with multi-stage builds and static file serving.

---

## 🧪 Output Verification

Once you download the generated `.zip` project:

1.  **Tabular Editor**: Open the `semantic-model` folder to inspect the logical model (measures, columns, relationships).
2.  **Power BI Desktop**: Place the extracted contents into a folder named `MyProject.Dataset`, create a `MyProject.pbip` file next to it, and open it directly.
3.  **Fabric/Git Integration**: Push the unzipped folder structure to Azure DevOps or GitHub to sync with a Power BI Workspace.

---

_Developed by SRM Tech — Accelerating the journey from legacy BI to Power BI._
