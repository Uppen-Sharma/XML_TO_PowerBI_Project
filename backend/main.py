from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import tempfile
import os
import shutil
from dotenv import load_dotenv
from pbip_generator import generate_pbip

load_dotenv()

AUTH_MODE = os.getenv("AUTH_MODE", "dev")
ADMIN_EMAILS = os.getenv("ADMIN_EMAILS", "admin@test.com").split(",")
ALLOWED_DOMAINS = os.getenv("ALLOWED_DOMAINS", "@srmtech.com").split(",")

app = FastAPI(
    title='PBI Accelerator API',
    description='Upload a Cognos XML and download PBIP.',
    version='1.0'
)

async def get_current_user(
    x_auth_request_email: str = Header(None, alias="X-Auth-Request-Email"),
    x_auth_request_user: str = Header(None, alias="X-Auth-Request-User")
):
    if AUTH_MODE == "dev":
        # In dev mode, if headers are missing, inject a mock user
        email = x_auth_request_email or "admin@test.com"
        user = x_auth_request_user or "Dev Admin"
        return {"email": email, "name": user}
    
    if not x_auth_request_email:
        raise HTTPException(status_code=401, detail="Unauthorized: Missing auth headers")
    
    return {"email": x_auth_request_email, "name": x_auth_request_user}

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
async def generate(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        import uuid
        xml_stem = Path(file.filename).stem
        zip_filename = f"{xml_stem}.zip"
        
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

        return JSONResponse(content={
            "success": True,
            "disk_filename": disk_filename,
            "download_name": zip_filename,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get('/download')
async def download(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    if '..' in filename or '/' in filename or '\\' in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = GENERATED_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found. Please generate it first.")

    download_name = filename.split("_", 1)[1] if "_" in filename else filename

    return FileResponse(
        path=str(file_path),
        media_type='application/zip',
        filename=download_name,
    )


# Serve built React frontend (production)
static_path = BASE_DIR.parent / "frontend" / "dist"
if static_path.exists():
    app.mount("/", StaticFiles(directory=str(static_path), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
