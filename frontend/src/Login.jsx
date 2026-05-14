import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    const authMode = import.meta.env.VITE_AUTH_MODE || "dev";

    if (authMode === "prod") {
      // Prod mode delegates auth to oauth2-proxy via NGINX
      window.location.href = "/oauth2/sign_in";
    } else {
      // Keep existing auth flow behavior for local development
      localStorage.setItem("isLoggedIn", "true");
      navigate("/");
    }
  };

  return (
    <div className="relative min-h-screen lg:h-screen lg:overflow-hidden bg-dashboard">
      <div className="relative z-10 min-h-screen lg:h-screen flex items-center justify-center p-4">
        <div className="w-[430px] flex-shrink-0">
          <div className="rounded-2xl border border-[#DCE1EA] bg-white/95 px-9 py-9 shadow-[0_24px_60px_rgba(0,27,77,0.28)] backdrop-blur-[2px]">
            <div className="flex flex-col items-center justify-center gap-2 mb-6 text-center">
              <h1 className="text-xl font-black text-[#0b132b] leading-snug whitespace-nowrap">
                Welcome to the PBI Accelerator
              </h1>
            </div>
            <div className="my-4 h-px bg-[#E5E8EF]" />
            <div className="flex justify-center">
              <img src="/logo.png" alt="SRM" className="h-[clamp(1.5rem,2.5vh,2.5rem)] w-auto object-contain" />
            </div>

            <div className="my-8 h-px bg-[#E5E8EF]" />

            <form onSubmit={handleLogin}>
              <button
                type="submit"
                className="group flex h-12 w-full items-center justify-center gap-3 rounded-md bg-primary px-4 font-medium text-base text-white transition-all duration-200 hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2"
              >
                <img src="/microsoft.png" alt="Microsoft" className="h-5 w-5 object-contain" />
                <span className="whitespace-nowrap">Login With Microsoft Credentials</span>
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-0.5 ml-auto"
                />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
