# PBI Accelerator (Cognos XML to Power BI Project)

A high-performance enterprise solution that seamlessly converts Cognos XML report definitions into Power BI Project (PBIP) format. This application combines a robust **FastAPI** backend with a premium **React + Vite** frontend, featuring **AI-assisted DAX generation** and an **interactive relationship designer**.

---

## ✨ Key Features

- **End-to-End Migration Wizard**: A structured 5-step workflow guiding users from raw XML upload to a verified Power BI Project.
- **AI-Powered DAX Engine**: Integrated support for **Google Gemini AI** to automatically translate Cognos expressions into optimized DAX, with built-in validation and performance linting.
- **Visual Relationship Designer**: Interactive **ReactFlow**-powered tool to define and manage relationships between datasets, ensuring model integrity.
- **Pro-Grade DAX Editor**: Integrated **Monaco Editor** for a VS Code-like editing experience during field mapping.
- **Advanced Metadata Preview**: Deep inspection of extracted queries, columns, and measures before final generation.
- **Premium UI/UX**: Modern interface with SRM Tech branding, high-fidelity micro-animations, and responsive design optimized for productivity.
- **Enterprise Security**: Built-in support for **Microsoft Entra ID (Azure AD)** authentication and domain-restricted access.

---

## 🚀 The Migration Workflow

1.  **Upload**: Drag & drop your Cognos Metadata XML file.
2.  **Review**: Inspect the extracted logical model (Queries, Fields, Measures).
3.  **Design Relations**: Use the visual designer to connect datasets (1:1, 1:N).
4.  **AI Mapping & DAX**: Refine field mappings and use AI to generate/validate complex DAX measures.
5.  **Generate**: Download a production-ready `.zip` archive containing the full PBIP structure.

---

## 🏗️ Architecture

The project is structured as a modular monorepo:

### 🐍 Backend (FastAPI)
- **`/engine`**: The core transformation logic.
  - `parser`: specialized Cognos XML parsing logic.
  - `model`: builders for the Tabular Object Model (TOM).
  - `validator`: schema and integrity checks.
- **`/ai`**: AI orchestration layer.
  - `dax_generator.py`: Prompt engineering and LLM integration (Gemini/Rule-based).
  - `dax_validator.py`: Static analysis and reference checking for DAX.
- **`main.py`**: Enterprise API with auth middleware and global exception handling.

### ⚛️ Frontend (React 19)
- **`MigrationWizard.jsx`**: Orchestrates the multi-step migration state.
- **`RelationshipDesigner.jsx`**: Visual schema mapping using **ReactFlow**.
- **`DaxEditor.jsx`**: Pro-grade DAX editor powered by **Monaco Editor**.
- **Tech Stack**: Vite 6, Tailwind CSS 4, Axios, Lucide React, ReactFlow, Monaco Editor.

---

## 🛠️ Setup & Installation

### 1. Environment Configuration

Copy the example files and configure your keys:

```bash
# Backend (.env)
AUTH_MODE=dev
GEMINI_API_KEY=your_key_here
ALLOWED_DOMAINS=@srmtech.com

# Frontend (.env)
VITE_API_URL=http://localhost:8000
VITE_AUTH_MODE=dev
```

### 2. Start the Backend

```bash
cd backend
python -m venv venv
# Activate venv (Windows: .\venv\Scripts\activate | Unix: source venv/bin/activate)
pip install -r requirements.txt
python main.py
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Output Verification

The generated `.zip` includes:
1.  **`model.bim`**: The full Tabular Object Model.
2.  **`definition.pbir`**: Report and visual definitions.
3.  **`dataSources.json`**: Connectivity metadata.

_Compatible with Power BI Desktop, Tabular Editor 3, and Microsoft Fabric Git Integration._

---

_Developed by SRM Tech — Accelerating the journey from legacy BI to Power BI._
