import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import SystemLogin from "./SystemLogin";
import { useState, useEffect } from "react";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sysAuthed, setSysAuthed] = useState(() => sessionStorage.getItem("gms_sys_auth") === "1");

  if (!sysAuthed) {
    return <SystemLogin onSuccess={() => setSysAuthed(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}