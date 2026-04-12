import { Menu, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Bildirisler from "./Bildirisler";
import { getSession, clearSession } from "@/hooks/useAppSession";

export default function TopBar({ onMenuClick, onLogout }) {
  const session = getSession();

  const handleLogout = () => {
    clearSession();
    if (onLogout) onLogout();
    else window.location.reload();
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center gap-4 px-4 md:px-6 shrink-0">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="w-5 h-5" />
      </Button>

      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Axtar..." className="pl-9 bg-muted/50 border-0 focus-visible:ring-1" />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Bildirisler />
        <div className="flex items-center gap-2 ml-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {session?.adSoyad?.charAt(0) || "U"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-tight">{session?.adSoyad || "İstifadəçi"}</p>
            <p className="text-[11px] text-muted-foreground">{session?.rol || ""}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Çıxış">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}