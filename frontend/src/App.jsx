import { useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Lock,
  LogOut,
} from "lucide-react";
import Login from "./Login";

/**
 * ProtectedRoute Component
 * Redirects to login if not authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const authMode = import.meta.env.VITE_AUTH_MODE || "dev";
  
  if (authMode === "prod") {
    return children; // NGINX + oauth2-proxy already verified the user
  }
  
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

/**
 * BrandSection Component
 * Handles the left-side branding, logo, and main heading.
 */
const BrandSection = () => (
  <div className="relative flex flex-col px-6 py-12 sm:px-10 lg:px-[7vw] lg:pt-[10vh] lg:pb-12 lg:w-[45%] flex-shrink-0 lg:h-screen lg:overflow-y-auto custom-scrollbar">
    <div className="flex flex-col items-start space-y-10 lg:space-y-[8vh]">
      <div className="flex items-start">
        <img
          src="/logo.png"
          alt="SRM Tech Logo"
          className="h-[clamp(3rem,8vh,5rem)] w-auto object-contain"
        />
      </div>
      <div className="w-full">
        <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-black tracking-tight leading-tight text-[#0b132b] whitespace-nowrap">
          PBI Accelerator
        </h1>
        <p className="mt-4 text-[clamp(1.1rem,1.6vw,1.4rem)] font-medium text-black leading-relaxed tracking-wide whitespace-nowrap">
          Convert Cognos XML to Power BI Projects
        </p>
      </div>
    </div>
  </div>
);

/**
 * UploadCard Component
 * Refactored for stability at high zoom levels.
 */
const UploadCard = ({ 
  file, 
  isUploading, 
  error, 
  isDragOver, 
  downloadInfo, 
  onDrop, 
  onFileChange, 
  onGenerate, 
  fileInputRef 
}) => (
  <div className="bg-card-bg rounded-[var(--radius-card)] shadow-card hover:shadow-card-hover transition-shadow border border-card-border flex flex-col min-h-0 w-full overflow-hidden">
    <div className="p-5 sm:p-8 lg:p-[4vh] flex flex-col min-h-0 flex-grow">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all duration-200 ease-in-out cursor-pointer flex flex-col items-center justify-center flex-grow min-h-[200px] lg:min-h-[26vh]
          ${isDragOver || file ? "border-primary bg-primary/10" : "border-border hover:border-primary hover:bg-container-bg"}
          ${isDragOver ? "scale-[1.01]" : ""}
        `}
        onDragOver={(e) => { e.preventDefault(); }}
        onDragEnter={(e) => { e.preventDefault(); }}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xml"
          onChange={onFileChange}
        />

        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none break-all">
          <div className={`h-14 w-14 sm:h-16 sm:w-16 lg:h-[8vh] lg:w-[8vh] rounded-full flex items-center justify-center mb-1 ${file ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
            {file ? <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 lg:h-[4vh] lg:w-[4vh]" /> : <UploadCloud className="h-7 w-7 sm:h-8 sm:w-8 lg:h-[4vh] lg:w-[4vh]" />}
          </div>
          <div className="text-[clamp(1rem,1.4vw,1.25rem)] font-medium text-black leading-snug whitespace-nowrap">
            {file ? file.name : "Drag & drop your XML here"}
          </div>
          <p className="text-[clamp(0.875rem,1.2vw,1.1rem)] font-medium text-slate-500 whitespace-nowrap">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "or click to browse"}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start space-x-3 text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-medium break-words leading-tight">{error}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4 justify-center">
        <button
          onClick={onGenerate}
          disabled={!file || isUploading}
          className={`px-8 py-3.5 rounded-[var(--radius-btn)] font-bold text-sm lg:text-base text-white shadow-btn transition-all flex items-center justify-center space-x-2 min-w-[160px] whitespace-nowrap
            ${!file || isUploading ? "bg-text-muted opacity-50 cursor-not-allowed" : "bg-primary hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0"}
          `}
        >
          {isUploading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /><span>Processing…</span></>
          ) : (
            <span>Accelerate PBI</span>
          )}
        </button>

        {downloadInfo && (
          <a
            href={`/download?filename=${encodeURIComponent(downloadInfo.diskFilename)}`}
            className="px-8 py-3.5 rounded-[var(--radius-btn)] font-bold text-sm lg:text-base text-primary bg-primary/10 hover:bg-primary/20 transition-all flex items-center justify-center space-x-2 border border-primary/20 shadow-btn min-w-[160px] whitespace-nowrap"
          >
            <Download className="h-5 w-5" />
            <span>Download Project</span>
          </a>
        )}
      </div>
    </div>

    <div className="bg-container-bg p-4 lg:p-[2vh] border-t border-card-border text-center flex items-center justify-center space-x-2 flex-shrink-0 mt-auto">
      <Lock className="h-4 w-4 text-text-muted flex-shrink-0" />
      <p className="text-[10px] sm:text-xs lg:text-[clamp(0.7rem,1vw,0.875rem)] text-text-muted leading-tight whitespace-nowrap">
        Your files are processed securely and are not stored permanently.
      </p>
    </div>
  </div>
);

const Dashboard = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  };

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
      const response = await axios.post("/generate", formData);
      const { disk_filename, download_name } = response.data;
      if (!disk_filename) throw new Error("Server did not return a filename.");

      setDownloadInfo({ diskFilename: disk_filename, downloadName: download_name });

      const downloadUrl = `/download?filename=${encodeURIComponent(disk_filename)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", download_name);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? "An error occurred.");
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  return (
    <div className="min-h-screen lg:h-screen bg-dashboard lg:overflow-hidden flex flex-col" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Top Header for Logout */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-btn)] bg-white/80 backdrop-blur-sm border border-card-border text-sm font-semibold text-slate-700 hover:bg-white hover:text-primary transition-all shadow-sm"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row flex-grow w-full min-h-0 lg:overflow-hidden">
        <BrandSection />
        
        <div className="flex flex-col lg:w-[55%] flex-grow min-h-0 lg:h-full lg:overflow-hidden">
          <div className="w-full flex flex-col px-4 py-8 lg:px-[5vw] lg:py-[6vh] min-h-full">
            <div className="flex flex-col flex-grow items-center justify-center min-h-0">
              <div className="w-full max-w-2xl flex flex-col min-h-0">
                <div className="text-center mb-6 lg:mb-[4vh] flex-shrink-0">
                  <h3 className="text-[clamp(1.1rem,1.6vw,1.4rem)] font-black text-[#0b132b] tracking-tight leading-tight whitespace-nowrap">
                    Extract Data
                  </h3>
                </div>
                
                <UploadCard 
                  file={file}
                  isUploading={isUploading}
                  error={error}
                  isDragOver={isDragOver}
                  downloadInfo={downloadInfo}
                  onDrop={handleDrop}
                  onFileChange={handleFileChange}
                  onGenerate={handleGenerate}
                  fileInputRef={fileInputRef}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
