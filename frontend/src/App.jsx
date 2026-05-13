import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
} from "lucide-react";

function App() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState(null); // { diskFilename, downloadName }
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndSetFile = (selected) => {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".xml")) {
      setError("Please upload a valid XML file.");
      return;
    }
    setFile(selected);
    setError(null);
    setDownloadInfo(null);
  };

  const handleFileChange = (e) => validateAndSetFile(e.target.files?.[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const handleGenerate = useCallback(async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setDownloadInfo(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Step 1: POST XML → get back { disk_filename, download_name }
      // Exactly mirrors the reference app: no blob, no header parsing
      const response = await axios.post("/generate", formData);
      const { disk_filename, download_name } = response.data;

      if (!disk_filename) throw new Error("Server did not return a filename.");

      setDownloadInfo({
        diskFilename: disk_filename,
        downloadName: download_name,
      });

      // Step 2: Use a hidden <a> tag to reliably trigger the download in Chromium browsers
      const downloadUrl = `/download?filename=${encodeURIComponent(disk_filename)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", download_name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      const msg =
        err.response?.data?.error ??
        err.message ??
        "An error occurred while generating the PBIP file.";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center mb-6">
            <img src="/logo.png" alt="SRM Tech Logo" className="h-16 w-auto object-contain" />
          </div>
          <h2 className="text-4xl font-extrabold text-text-main tracking-tight">
            PBIP Generator
          </h2>
          <p className="mt-2 text-lg text-text-secondary">
            Convert Cognos XML to Power BI Project format instantly.
          </p>
        </div>

        <div className="bg-card-bg rounded-[var(--radius-card)] shadow-card hover:shadow-card-hover transition-shadow overflow-hidden border border-card-border">
          <div className="p-8 sm:p-10">
            {/* Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all
                duration-200 ease-in-out cursor-pointer
                ${
                  isDragOver || file
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary hover:bg-container-bg"
                }
                ${isDragOver ? "scale-[1.02]" : ""}
              `}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xml"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
                {file ? (
                  <div className="h-16 w-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-2">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                )}
                <div className="text-lg font-medium text-text-main">
                  {file ? file.name : "Drag & drop your XML here"}
                </div>
                <p className="text-sm text-text-muted">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : "or click to browse from your computer"}
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start space-x-3 text-red-600">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center">
              <button
                onClick={handleGenerate}
                disabled={!file || isUploading}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-[var(--radius-btn)] font-semibold text-white shadow-btn
                  transition-all flex items-center justify-center space-x-2
                  ${
                    !file || isUploading
                      ? "bg-text-muted opacity-50 cursor-not-allowed"
                      : "bg-primary hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0"
                  }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <span>Generate PBIP</span>
                )}
              </button>

              {/* Re-download button shown after generation */}
              {downloadInfo && (
                <a
                  href={`/download?filename=${encodeURIComponent(downloadInfo.diskFilename)}`}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-[var(--radius-btn)] font-semibold text-primary
                    bg-primary/10 hover:bg-primary/20 transition-all flex items-center justify-center
                    space-x-2 border border-primary/20 shadow-btn"
                >
                  <Download className="h-5 w-5" />
                  <span>Download {downloadInfo.downloadName}</span>
                </a>
              )}
            </div>
          </div>

          <div className="bg-container-bg p-6 border-t border-card-border text-center">
            <p className="text-sm text-text-muted">
              Your files are processed securely and are not stored permanently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
