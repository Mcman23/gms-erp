import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Wallet, Users, ClipboardList, Calendar,
  UserCog, Palmtree, Banknote, Package, Receipt, FileText,
  Wrench, MessageSquareWarning, BarChart3, Settings, X, Sparkles
} from "lucide-react";
import { getSession, ROL_MENYU } from "@/hooks/useAppSession";

const ALL_MENU = [
  { label: "Ana Panel", path: "/", icon: LayoutDashboard },
  { label: "Kassa", path: "/kassa", icon: Wallet },
  { label: "Müştərilər", path: "/musteriler", icon: Users },
  { label: "Sifarişlər", path: "/sifarisler", icon: ClipboardList },
  { label: "Planlama", path: "/planlama", icon: Calendar },
  { label: "İşçilər", path: "/iscilar", icon: UserCog },
  { label: "Məzuniyyət", path: "/mezuniyyet", icon: Palmtree },
  { label: "Maaş", path: "/maas", icon: Banknote },
  { label: "Anbar", path: "/anbar", icon: Package },
  { label: "Fakturalar", path: "/fakturalar", icon: Receipt },
  { label: "Maliyyə", path: "/maliyye", icon: FileText },
  { label: "Avadanlıq", path: "/avadanliq", icon: Wrench },
  { label: "Şikayətlər", path: "/sikayetler", icon: MessageSquareWarning },
  { label: "Hesabatlar", path: "/hesabatlar", icon: BarChart3 },
  { label: "Ayarlar", path: "/ayarlar", icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const session = getSession();
  const rol = session?.rol || "";
  const allowedPaths = ROL_MENYU[rol]; // null = all

  const menuItems = ALL_MENU.filter(item => {
    if (!allowedPaths) return true; // admin/director = all
    if (item.path === "/") return true;
    return allowedPaths.some(p => item.path.startsWith(p));
  });

  // Ayarlar sadece admin/superadmin görür
  const showAyarlar = !allowedPaths || ["Admin","Super Admin"].includes(rol);

  const visibleMenu = showAyarlar ? menuItems : menuItems.filter(m => m.path !== "/ayarlar");

  const isActive = (path) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-base text-sidebar-primary-foreground leading-tight">CleanPro</h1>
            <p className="text-[11px] text-sidebar-foreground/60">ERP Sistemi</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {visibleMenu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 truncate">{session?.adSoyad}</div>
          <div className="text-[11px] text-sidebar-foreground/40">{session?.rol}</div>
        </div>
      </aside>
    </>
  );
}