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
  ArrowRight,
} from "lucide-react";
import Login from "./Login";
import {
  PreviewStep,
  RelationshipStep,
  MappingStep,
} from "./components/MigrationWizard";

const STEPS = {
  UPLOAD: "upload",
  PREVIEW: "preview",
  RELATIONSHIPS: "relationships",
  MAPPING: "mapping",
  DOWNLOAD: "download",
};

const STEP_ORDER = [
  STEPS.UPLOAD,
  STEPS.PREVIEW,
  STEPS.RELATIONSHIPS,
  STEPS.MAPPING,
  STEPS.DOWNLOAD,
];

const STEP_LABELS = {
  [STEPS.UPLOAD]: "Upload",
  [STEPS.PREVIEW]: "Review",
  [STEPS.RELATIONSHIPS]: "Relations",
  [STEPS.MAPPING]: "Mapping",
  [STEPS.DOWNLOAD]: "Finish",
};

/**
 * ProtectedRoute Component
 */
const ProtectedRoute = ({ children }) => {
  const authMode = import.meta.env.VITE_AUTH_MODE || "dev";
  if (authMode === "prod") return children;
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

/**
 * Stepper Component
 */
const Stepper = ({ currentStep }) => {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-4 mb-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary z-0 transition-all duration-500"
          style={{
            width: `${(currentIndex / (STEP_ORDER.length - 1)) * 100}%`,
          }}
        />

        {STEP_ORDER.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div
              key={step}
              className="relative z-10 flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isCompleted
                    ? "bg-primary border-primary text-white"
                    : isActive
                      ? "bg-white border-primary text-primary shadow-[0_0_0_4px_rgba(12,161,182,0.1)]"
                      : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle size={20} />
                ) : (
                  <span className="text-sm font-bold">{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-colors duration-300 ${
                  isActive ? "text-primary" : "text-slate-400"
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * BrandSection Component
 */
const BrandSection = () => (
  <div className="relative flex flex-col px-6 py-12 sm:px-10 lg:px-[7vw] lg:pt-[10vh] lg:pb-12 lg:w-[45%] shrink-0 lg:h-screen lg:overflow-y-auto custom-scrollbar">
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
 */
const UploadCard = ({
  file,
  isProcessing,
  error,
  isDragOver,
  onDrop,
  onFileChange,
  onGenerate,
  fileInputRef,
  isNested = false,
}) => (
  <div
    className={`flex flex-col h-full min-h-0 w-full overflow-hidden transition-all duration-300 ${
      !isNested
        ? "bg-card-bg rounded-card shadow-card hover:shadow-card-hover border border-card-border"
        : ""
    }`}
  >
    <div className="flex flex-col min-h-0 h-full grow">
      {/* Dropbox Area - Grows to fill space */}
      <div
        className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 ease-in-out cursor-pointer flex flex-col grow min-h-0 overflow-hidden
          ${isDragOver || file ? "border-primary bg-primary/10" : "border-border hover:border-primary hover:bg-container-bg"}
          ${isDragOver ? "scale-[1.01]" : ""}
        `}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
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

        {/* Scrollable content wrapper */}
        <div className="grow overflow-y-auto custom-scrollbar p-6 sm:p-10 flex flex-col items-center justify-center min-h-0 w-full">
          <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none break-all w-full">
            <div
              className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mb-1 shrink-0 ${file ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}
            >
              {file ? (
                <CheckCircle size={32} />
              ) : (
                <UploadCloud size={32} />
              )}
            </div>
            <div className="text-xl font-bold text-[#0b132b] leading-snug text-center">
              {file ? file.name : "Drag & drop your XML here"}
            </div>
            <p className="text-sm font-medium text-slate-500 text-center">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB`
                : "Support for Cognos Metadata XML files"}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start space-x-3 text-red-600 shrink-0">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-medium wrap-break-word leading-tight">
            {error}
          </p>
        </div>
      )}

      {/* Bottom Button Bar - Stuck to bottom */}
      <div className="mt-4 pt-4 border-t border-slate-100 shrink-0">
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onGenerate}
            disabled={!file || isProcessing}
            className={`flex-1 px-6 py-3 rounded-xl font-bold text-white shadow-btn transition-all flex items-center justify-center gap-2 min-w-[200px] whitespace-nowrap
              ${!file || isProcessing ? "bg-slate-300 opacity-50 cursor-not-allowed" : "bg-primary hover:bg-primary-hover active:scale-95"}
            `}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing…</span>
              </>
            ) : (
              <>
                Accelerate PBI <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [model, setModel] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handlePreview = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post("/preview", formData);
      setModel(response.data);
      setStep(STEPS.PREVIEW);
    } catch (err) {
      console.error("Preview error:", err);
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to parse XML.";
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }, [file]);

  const handleConvert = async () => {
    if (!model) return;
    setIsProcessing(true);
    setError(null);
    try {
      const response = await axios.post("/convert", model);
      const { disk_filename, download_name } = response.data;
      setDownloadInfo({
        diskFilename: disk_filename,
        downloadName: download_name,
      });
      setStep(STEPS.DOWNLOAD);

      const downloadUrl = `/download?filename=${encodeURIComponent(disk_filename)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", download_name);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to convert model.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="min-h-screen lg:h-screen bg-dashboard lg:overflow-hidden flex flex-col"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Top Header for Logout */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-btn bg-white/80 backdrop-blur-sm border border-card-border text-sm font-semibold text-slate-700 hover:bg-white hover:text-primary transition-all shadow-sm"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row grow w-full min-h-0 lg:overflow-hidden">
        <BrandSection />

        <div className="flex flex-col lg:w-[55%] grow min-h-0 lg:h-full lg:overflow-hidden">
          <div className="w-full flex flex-col px-4 py-8 lg:px-[5vw] lg:py-[6vh] min-h-full">
            <div className="flex flex-col grow items-center justify-center min-h-0">
              <div className="w-full max-w-5xl flex flex-col min-h-0 h-full">
                <div className="text-center mb-6 lg:mb-[4vh] shrink-0">
                  <h2 className="text-[clamp(1.1rem,1.6vw,1.4rem)] font-black text-[#0b132b] tracking-tight mb-4">
                    {step === STEPS.UPLOAD && "Extract Data"}
                    {step === STEPS.PREVIEW && "Review Extracted Metadata"}
                    {step === STEPS.RELATIONSHIPS && "Design Your Model Relations"}
                    {step === STEPS.MAPPING && "Configure Field Mappings"}
                    {step === STEPS.DOWNLOAD && "Success! Your File is Ready"}
                  </h2>
                  <Stepper currentStep={step} />
                </div>

                <div className="bg-white rounded-3xl shadow-card border border-card-border flex flex-col overflow-hidden grow min-h-0">
                  <div className="grow overflow-hidden flex flex-col min-h-0 p-6 sm:p-8 pb-0">
                    {step === STEPS.UPLOAD && (
                      <UploadCard
                        file={file}
                        isProcessing={isProcessing}
                        error={error}
                        isDragOver={isDragOver}
                        downloadInfo={downloadInfo}
                        onDrop={handleDrop}
                        onFileChange={handleFileChange}
                        onGenerate={handlePreview}
                        fileInputRef={fileInputRef}
                        isNested={true}
                      />
                    )}

                    {step === STEPS.PREVIEW && (
                      <PreviewStep
                        model={model}
                        onNext={() => setStep(STEPS.RELATIONSHIPS)}
                        onBack={() => setStep(STEPS.UPLOAD)}
                      />
                    )}

                    {step === STEPS.RELATIONSHIPS && (
                      <RelationshipStep
                        model={model}
                        setModel={setModel}
                        onNext={() => setStep(STEPS.MAPPING)}
                        onBack={() => setStep(STEPS.PREVIEW)}
                      />
                    )}

                    {step === STEPS.MAPPING && (
                      <MappingStep
                        model={model}
                        setModel={setModel}
                        onNext={handleConvert}
                        onBack={() => setStep(STEPS.RELATIONSHIPS)}
                      />
                    )}

                    {step === STEPS.DOWNLOAD && (
                      <div className="flex flex-col h-full min-h-0 overflow-hidden">
                        <div className="flex flex-col items-center justify-center text-center space-y-8 grow min-h-0 overflow-y-auto custom-scrollbar px-4">
                          <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-green-400 blur-3xl opacity-20 animate-pulse" />
                            <div className="relative h-28 w-28 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-inner">
                              <CheckCircle size={56} />
                            </div>
                          </div>
                          <div className="space-y-2 shrink-0">
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">Conversion Success!</h4>
                            <p className="text-slate-500 font-medium text-base max-w-md mx-auto">Your Cognos report has been successfully transformed into a Power BI Project.</p>
                          </div>
                        </div>

                        {/* Stuck to bottom button bar for final step */}
                        <div className="flex gap-4 mt-auto shrink-0 pt-4 border-t border-slate-100 bg-white">
                          <button 
                            type="button"
                            onClick={() => {
                              setFile(null);
                              setStep(STEPS.UPLOAD);
                              setModel(null);
                              setDownloadInfo(null);
                              setError(null);
                            }}
                            className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                          >
                            New Migration
                          </button>
                          <a
                            href={`/download?filename=${encodeURIComponent(downloadInfo.diskFilename)}`}
                            className="flex-2 px-6 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                          >
                            <Download size={20} /> Download Project
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shared Card Footer */}
                  <div className="bg-container-bg border-t border-slate-100 px-6 py-4 flex flex-col items-center justify-center space-y-2 shrink-0">
                    <div className="flex items-center justify-center space-x-2">
                      <Lock className="h-4 w-4 text-text-muted shrink-0" />
                      <p className="text-[10px] sm:text-xs text-text-muted font-medium whitespace-nowrap">
                        Your files are processed securely and are not stored permanently.
                      </p>
                    </div>
                  </div>
                </div>
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
