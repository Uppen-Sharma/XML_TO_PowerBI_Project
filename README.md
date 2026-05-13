# PBI Accelerator (Cognos XML to Power BI Project)

A full-stack application that seamlessly converts Cognos XML report definitions into Power BI Project (PBIP) format. The application is split into a **FastAPI** backend that handles the XML parsing and PBIP generation, and a modern **React + Vite** frontend with Tailwind CSS for an intuitive drag-and-drop user experience.

---

## 🏗️ Architecture

The project has been refactored into a clear two-tier architecture:

* **`/backend`**: A FastAPI Python application.
  * `main.py`: The API server that handles `/generate` and `/download` requests.
  * `pbip_generator.py`: The core engine that parses Cognos XML to extract dimensions, fields, and measures, and translates them into Tabular Object Model (TOM) JSON.
  * `requirements.txt`: Python dependencies.
* **`/frontend`**: A React Single Page Application (SPA).
  * Bootstrapped with **Vite** and styled using **Tailwind CSS v4**.
  * `src/App.jsx`: The main user interface for uploading XML files and downloading the generated PBIP `.zip` archive.
  * Uses Vite's proxy feature during development to seamlessly communicate with the backend.

---

## 🚀 How it Works

1. **Upload**: The user drops a Cognos `.xml` file into the React frontend.
2. **Process**: The React frontend sends the file to the FastAPI backend (`POST /generate`).
3. **Parse**: The `pbip_generator.py` script traverses the XML to identify data items. It uses heuristics to classify them into standard `Int64`, `Double`, or `String` data types, and generates DAX measure definitions.
4. **Compile**: The parsed components are organized into standard Power BI Semantic Model tables (`Sales`, `DimDate`, `DimOrderMethod`) and saved using the standard `model.bim` (JSON) format.
5. **Return**: The backend bundles the `semantic-model` directory, `report.json`, and `dataSources.json` into a `.zip` file and sends the filename back to the frontend.
6. **Download**: The frontend automatically hits `GET /download` with a hidden anchor tag to trigger a cross-browser compatible file download.

---

## 💻 Running the Application Locally

You will need two terminal windows to run both the frontend and backend simultaneously in development mode.

### 1. Start the Backend (FastAPI)

Open your first terminal and navigate to the project's root folder:

```bash
cd backend

# (Optional) Create and activate a virtual environment
# python -m venv venv
# .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python -m uvicorn main:app --reload --port 8000
```
*The backend API will be available at `http://localhost:8000`.*

### 2. Start the Frontend (Vite/React)

Open your second terminal and navigate to the project's root folder:

```bash
cd frontend

# Install Node modules
npm install

# Run the development server
npm run dev
```
*The frontend UI will be available at `http://localhost:5173`.*

---

## 🧪 Testing & Verifying the Output

Once the `.zip` file is downloaded, it contains the internal configuration of a Power BI Project.

### Method 1: Content Inspection
1. Unzip the generated file.
2. Open the `semantic-model/model.bim` file in a text editor like VS Code.
3. You will see the Tabular Object Model (TOM) JSON representation of your data structures and DAX measures.

### Method 2: Visualizing in Tabular Editor
1. Download and open [Tabular Editor 2 or 3](https://tabulareditor.com/).
2. Select **File -> Open -> From Folder...** and choose the extracted `semantic-model` directory.
3. Tabular Editor will parse the `.bim` files and display your complete logical Semantic Model (Tables, Columns, Relationships, Measures).

### Method 3: Using Power BI Desktop
To open the project locally in Power BI:
1. Make sure the preview feature **Power BI Project (.pbip) save option** is enabled in Power BI Desktop settings.
2. Put the generated files (`semantic-model`, `report.json`, etc.) into a folder named `<YourProjectName>.Dataset`.
3. Create an empty file next to the folder named `<YourProjectName>.pbip`.
4. Double-click the `.pbip` file to open it.

### Method 4: Power BI Online (Git Integration)
While Power BI Service does not allow direct upload of `.zip` or `.pbip` files, you can deploy them using Fabric/Premium Git Integration:
1. Unzip the file.
2. Commit and push the folder structure to a Git Repository (Azure DevOps or GitHub).
3. Connect your Power BI Workspace to the repository via the **Git Integration** settings.
4. Power BI will automatically compile the raw code into a live Semantic Model and Report in the cloud.
