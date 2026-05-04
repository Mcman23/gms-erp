// Sistem login olan user-i sessionStorage-dan oxuyur
// Master şifrə ilə girənlər üçün null qaytarır (tam giriş var)
export function getSystemUser() {
  try {
    const raw = sessionStorage.getItem("gms_sys_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Modul adı → route path xəritəsi (Sidebar ilə uyğun)
export const MODUL_ROUTE_MAP = {
  "Ana Panel": "/",
  "Kassa Əməliyyatları": "/kassa",
  "Maliyyə Hesabatları": "/maliyye",
  "Qiymət Kalkulyatoru": "/qiymet-kalkulyatoru",
  "Qiymət Təklifləri": "/qiymet-teklifleri",
  "Fakturalar": "/fakturalar",
  "Sifarişlər": "/sifarisler",
  "Müştərilər": "/musteriler",
  "Podratçılar": "/podratcilar",
  "Podratçı Hesabatı": "/podratci-hesabati",
  "Şikayətlər": "/sikayetler",
  "Anbar": "/anbar",
  "Avadanlıq": "/avadanliq",
  "Əməkdaşlar": "/iscilar",
  "Planlama": "/planlama",
  "Məzuniyyət": "/mezuniyyet",
  "Maaş Hesablaması": "/maas",
  "Ad Günü Bildirişləri": "/ad-gunleri",
  "Sənədlər": "/senedler",
  "Hesabatlar": "/hesabatlar",
  "Sistem Ayarları": "/ayarlar",
  "CEO Paneli": "/ceo-paneli",
};

// İstifadəçinin həmin route-a girişi varmı?
export function hasRouteAccess(systemUser, path) {
  // Master şifrə ilə girənlər — tam giriş
  if (!systemUser) return true;
  // Admin/Super Admin/Direktor — tam giriş
  if (["Super Admin", "Admin", "Direktor"].includes(systemUser.rol)) return true;

  const allowed = systemUser.modul_erisimi || [];
  // Ana Panel həmişə açıqdır
  if (path === "/") return true;

  return Object.entries(MODUL_ROUTE_MAP).some(([modul, route]) => {
    if (route === "/") return false;
    return allowed.includes(modul) && path.startsWith(route);
  });
}