import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import SystemLogin from "./SystemLogin";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sysAuthed, setSysAuthed] = useState(() => sessionStorage.getItem("gms_sys_auth") === "1");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (!sysAuthed) {
    return <SystemLogin onSuccess={() => setSysAuthed(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}