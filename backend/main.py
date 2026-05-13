from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import tempfile
import os
import shutil
from pbip_generator import generate_pbip

app = FastAPI(
    title='PBIP Generator API',
    description='Upload a Cognos XML and download PBIP.',
    version='1.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
GENERATED_DIR = BASE_DIR / "generated"
GENERATED_DIR.mkdir(exist_ok=True)


@app.post('/generate')
async def generate(file: UploadFile = File(...)):
    try:
        import uuid
        xml_stem = Path(file.filename).stem          # "Global Sales View"
        zip_filename = f"{xml_stem}.zip"             # "Global Sales View.zip"  (user-facing name)
        
        # Append a unique ID to prevent concurrent users from overwriting each other's files
        unique_id = uuid.uuid4().hex[:8]
        disk_filename = f"{unique_id}_{xml_stem}.zip"

        with tempfile.TemporaryDirectory() as tmpdir:
            xml_path = os.path.join(tmpdir, file.filename)
            with open(xml_path, 'wb') as f:
                f.write(await file.read())

            output_folder = os.path.join(tmpdir, 'pbip-output')
            out_zip = generate_pbip(xml_path, output_folder=output_folder, zip_name=xml_stem)

            dest = GENERATED_DIR / disk_filename
            if dest.exists():
                dest.unlink()
            shutil.move(out_zip, dest)

        # Return JSON with BOTH names — same pattern as the reference app
        return JSONResponse(content={
            "success": True,
            "disk_filename": disk_filename,    # what's on disk (used to call /download)
            "download_name": zip_filename,     # what the user will see saved on their machine
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get('/download')
async def download(filename: str):
    """
    Exactly mirrors the reference app's /api/download endpoint.
    filename = disk_filename (e.g. "Global Sales View.zip")
    FileResponse(filename=download_name) tells the browser what to save it as.
    Frontend calls window.location.href = /download?filename=... — no blobs needed.
    """
    if '..' in filename or '/' in filename or '\\' in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = GENERATED_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found. Please generate it first.")

    # Strip any prefix to get clean download name (matches reference app pattern)
    download_name = filename.split("_", 1)[1] if "_" in filename else filename

    return FileResponse(
        path=str(file_path),
        media_type='application/zip',
        filename=download_name,      # <-- this is what the browser saves the file as
    )


# Serve built React frontend (production)
static_path = BASE_DIR / "frontend" / "dist"
if static_path.exists():
    app.mount("/", StaticFiles(directory=str(static_path), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)