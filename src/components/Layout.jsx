import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import SystemLogin from "./SystemLogin";
import UserLogin from "./UserLogin";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getSystemUser, hasRouteAccess } from "@/lib/systemUser";

// step: "system" | "user" | "done"
function getInitialStep() {
  if (sessionStorage.getItem("gms_sys_auth") !== "1") return "system";
  // master giriş — gms_sys_user yoxdur
  if (!sessionStorage.getItem("gms_sys_user")) return "done";
  // user giriş — var
  return "done";
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [step, setStep] = useState(getInitialStep);
  const [user, setUser] = useState(null);
  const [systemUser, setSystemUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    setSystemUser(getSystemUser());
  }, []);

  // Step 1: Sistem şifrəsi
  if (step === "system") {
    return (
      <SystemLogin
        onSuccess={(type) => {
          if (type === "master") {
            sessionStorage.setItem("gms_sys_auth", "1");
            sessionStorage.removeItem("gms_sys_user");
            setSystemUser(null);
            setStep("done");
          }
        }}
        onUserLogin={() => setStep("user")}
      />
    );
  }

  // Step 2: İstifadəçi email + şifrə
  if (step === "user") {
    return (
      <UserLogin
        onSuccess={() => {
          setSystemUser(getSystemUser());
          setStep("done");
        }}
        onBack={() => setStep("system")}
      />
    );
  }

  // Erişim yoxlaması
  if (!hasRouteAccess(systemUser, location.pathname)) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} systemUser={systemUser} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-xl font-bold text-foreground mb-2">Giriş icazəniz yoxdur</h2>
              <p className="text-muted-foreground text-sm">Bu bölməyə daxil olmaq üçün admin ilə əlaqə saxlayın.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} systemUser={systemUser} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}