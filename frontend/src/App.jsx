import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Lock,
} from "lucide-react";

function App() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState(null);
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

  const handleFileChange = (e) => {
    validateAndSetFile(e.target.files?.[0]);
  };

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
      const response = await axios.post("/generate", formData);

      const { disk_filename, download_name } = response.data;

      if (!disk_filename) {
        throw new Error("Server did not return a filename.");
      }

      setDownloadInfo({
        diskFilename: disk_filename,
        downloadName: download_name,
      });

      const downloadUrl = `/download?filename=${encodeURIComponent(
        disk_filename,
      )}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", download_name);

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
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
      className="min-h-screen bg-dashboard"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] min-h-screen">
        {/* Left Column */}
        <div className="relative flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-20 lg:py-0">
          {/* Logo */}
          <div className="absolute top-6 left-6 sm:top-10 sm:left-10 lg:top-20 lg:left-20">
            <img
              src="/logo.png"
              alt="SRM Tech Logo"
              className="h-10 sm:h-12 lg:h-16 w-auto object-contain"
            />
          </div>

          {/* Brand Content */}
          <div className="max-w-3xl mt-20 lg:mt-0">
            <h1 className="text-[40px] sm:text-[52px] lg:text-[64px] font-black tracking-[-2px] leading-[0.95] text-[#0b132b]">
              PBI Accelerator
            </h1>

            <p className="mt-4 text-[18px] sm:text-[22px] lg:text-[28px] font-medium text-[#0b132b] leading-snug">
              Convert Cognos XML to Power BI Projects
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col justify-center items-center px-4 py-10 sm:px-6 lg:px-16 lg:py-20">
          <div className="w-full max-w-xl">
            <div className="text-center mb-8 lg:mb-10">
              <h3 className="text-[20px] sm:text-[22px] lg:text-[28px] font-medium text-[#0b132b] leading-snug">
                Extract Data
              </h3>
            </div>

            <div className="bg-card-bg rounded-[var(--radius-card)] shadow-card hover:shadow-card-hover transition-shadow overflow-hidden border border-card-border">
              <div className="p-5 sm:p-8 sm:py-10">
                {/* Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-2xl min-h-[240px] sm:min-h-[300px] p-6 sm:p-10 text-center transition-all duration-200 ease-in-out cursor-pointer flex items-center justify-center
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

                  <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none break-all">
                    {file ? (
                      <div className="h-14 w-14 sm:h-16 sm:w-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-2">
                        <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8" />
                      </div>
                    ) : (
                      <div className="h-14 w-14 sm:h-16 sm:w-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-2">
                        <UploadCloud className="h-7 w-7 sm:h-8 sm:w-8" />
                      </div>
                    )}

                    <div className="text-base sm:text-lg font-medium text-text-main">
                      {file ? file.name : "Drag & drop your XML here"}
                    </div>

                    <p className="text-xs sm:text-sm text-text-muted">
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

                    <p className="text-sm font-medium break-words">{error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-center">
                  <button
                    onClick={handleGenerate}
                    disabled={!file || isUploading}
                    className={`w-full sm:w-fit whitespace-nowrap px-6 sm:px-8 py-3.5 rounded-[var(--radius-btn)] font-semibold text-white shadow-btn transition-all flex items-center justify-center space-x-2
                  ${
                    !file || isUploading
                      ? "bg-text-muted opacity-50 cursor-not-allowed"
                      : "bg-primary hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0"
                  }
                `}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Processing…</span>
                      </>
                    ) : (
                      <span>Accelerate PBI</span>
                    )}
                  </button>

                  {downloadInfo && (
                    <a
                      href={`/download?filename=${encodeURIComponent(
                        downloadInfo.diskFilename,
                      )}`}
                      className="w-full sm:w-fit whitespace-nowrap px-6 sm:px-8 py-3.5 rounded-[var(--radius-btn)] font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-all flex items-center justify-center space-x-2 border border-primary/20 shadow-btn"
                    >
                      <Download className="h-5 w-5" />

                      <span className="truncate max-w-full">
                        Download {downloadInfo.downloadName}
                      </span>
                    </a>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-container-bg p-4 sm:p-6 border-t border-card-border text-center flex items-center justify-center space-x-2">
                <Lock className="h-4 w-4 text-text-muted flex-shrink-0" />

                <p className="text-xs sm:text-sm text-text-muted">
                  Your files are processed securely and are not stored
                  permanently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
