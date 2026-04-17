import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Wallet, Users, ClipboardList, Calendar,
  UserCog, Palmtree, Banknote, Package, Receipt, FileText,
  Wrench, MessageSquareWarning, BarChart3, Settings, X, Sparkles,
  Calculator, FileCheck, FolderOpen, Handshake, ChevronDown,
  ChevronRight, TrendingUp, Truck, ShieldCheck, Cake, Building2
} from "lucide-react";

const sections = [
  {
    id: "dashboard",
    label: "Ana Panel",
    icon: LayoutDashboard,
    direct: true,
    path: "/",
  },
  {
    id: "kassa",
    label: "Kassa və Maliyyə",
    icon: Wallet,
    items: [
      { label: "Kassa Əməliyyatları", path: "/kassa", icon: Wallet },
      { label: "Maliyyə Hesabatları", path: "/maliyye", icon: TrendingUp },
      { label: "Qiymət Kalkulyatoru", path: "/qiymet-kalkulyatoru", icon: Calculator },
      { label: "Qiymət Təklifləri", path: "/qiymet-teklifleri", icon: FileCheck },
      { label: "Fakturalar", path: "/fakturalar", icon: Receipt },
    ],
  },
  {
    id: "satis",
    label: "Satış və CRM",
    icon: ClipboardList,
    items: [
      { label: "Sifarişlər", path: "/sifarisler", icon: ClipboardList },
      { label: "Müştərilər", path: "/musteriler", icon: Users },
      { label: "Podratçılar", path: "/podratcilar", icon: Handshake },
      { label: "Podratçı Hesabatı", path: "/podratci-hesabati", icon: BarChart3 },
      { label: "Şikayətlər", path: "/sikayetler", icon: MessageSquareWarning },
    ],
  },
  {
    id: "anbar",
    label: "Anbar və Təchizat",
    icon: Package,
    items: [
      { label: "Anbar", path: "/anbar", icon: Package },
      { label: "Avadanlıq", path: "/avadanliq", icon: Wrench },
    ],
  },
  {
    id: "hr",
    label: "HR və Əməkdaşlar",
    icon: UserCog,
    items: [
      { label: "Əməkdaşlar", path: "/iscilar", icon: UserCog },
      { label: "Planlama", path: "/planlama", icon: Calendar },
      { label: "Məzuniyyət", path: "/mezuniyyet", icon: Palmtree },
      { label: "Maaş Hesablaması", path: "/maas", icon: Banknote },
      { label: "Ad Günü Bildirişləri", path: "/ad-gunleri", icon: Cake },
    ],
  },
  {
    id: "sened",
    label: "Sənəd İdarəetməsi",
    icon: FolderOpen,
    items: [
      { label: "Bütün Sənədlər", path: "/senedler", icon: FileText },
    ],
  },
  {
    id: "hesabatlar",
    label: "Hesabatlar",
    icon: BarChart3,
    items: [
      { label: "Hesabatlar", path: "/hesabatlar", icon: BarChart3 },
    ],
  },
  {
    id: "ayarlar",
    label: "Tənzimləmələr",
    icon: Settings,
    adminOnly: true,
    items: [
      { label: "Sistem Ayarları", path: "/ayarlar", icon: Settings },
      { label: "İstifadəçi İdarəetməsi", path: "/ayarlar", icon: ShieldCheck },
    ],
  },
];

export default function Sidebar({ open, onClose, user }) {
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  // Auto-open section based on current path
  const getDefaultOpen = () => {
    const openSections = new Set();
    sections.forEach(sec => {
      if (sec.direct) return;
      if (sec.items?.some(item => location.pathname === item.path || location.pathname.startsWith(item.path))) {
        openSections.add(sec.id);
      }
    });
    if (openSections.size === 0) openSections.add("kassa");
    return openSections;
  };

  const [openSections, setOpenSections] = useState(getDefaultOpen);

  const toggleSection = (id) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground 
          flex flex-col transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-base text-sidebar-primary-foreground leading-tight">GMS ERP</h1>
            <p className="text-[11px] text-sidebar-foreground/60">İdarəetmə Sistemi</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {sections.map((section) => {
            if (section.adminOnly && !isAdmin) return null;

            if (section.direct) {
              const Icon = section.icon;
              const active = isActive(section.path);
              return (
                <Link
                  key={section.path}
                  to={section.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span>{section.label}</span>
                </Link>
              );
            }

            const SectionIcon = section.icon;
            const isOpen = openSections.has(section.id);
            const hasActive = section.items?.some(item => isActive(item.path));

            return (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${hasActive
                      ? "text-sidebar-primary-foreground bg-sidebar-accent/60"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                >
                  <SectionIcon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className="flex-1 text-left">{section.label}</span>
                  {isOpen
                    ? <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    : <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  }
                </button>

                {isOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path + item.label}
                          to={item.path}
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150
                            ${active
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            }`}
                        >
                          <ItemIcon className="w-[15px] h-[15px] flex-shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <p className="text-[11px] text-sidebar-foreground/40 text-center">© 2026 GMS ERP</p>
        </div>
      </aside>
    </>
  );
}