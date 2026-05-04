import { Menu, Search, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Bildirisler from "./Bildirisler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function TopBar({ onMenuClick }) {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-card flex items-center gap-4 px-4 md:px-6 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Axtar..."
            className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <Bildirisler />

        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-tight">{user?.full_name || "İstifadəçi"}</p>
              <p className="text-[11px] text-muted-foreground">{user?.role || "user"}</p>
            </div>
          </button>
          {menuOpen && (
            <div ref={menuRef} className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 py-1">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-medium">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <button
                onClick={() => base44.auth.logout()}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Çıxış
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}