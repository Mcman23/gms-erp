import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TRANSLATIONS = {
  az: {
    subtitle: "Şirkətlər üçün tam funksional və korporativ daxili ERP sistemi",
    devBy: "Developed by GMS Facility",
    cardTitle: "Sisteme Giriş",
    cardDesc: "Daxil olmaq üçün sistem şifrəsini daxil edin",
    passLabel: "Sistem şifrəsi",
    btnLogin: "Daxil ol",
    btnLoading: "Yoxlanılır...",
    errorMsg: "Şifrə yanlışdır. Yenidən cəhd edin.",
    forgotMsg: "Parolunuzu unutmusunuzsa, sistem admininizlə əlaqə saxlayın.",
    confidential: "GMS ERP • Məxfi sistem — icazəsiz giriş qadağandır",
  },
  en: {
    subtitle: "A fully functional and corporate internal ERP system for companies",
    devBy: "Developed by GMS Facility",
    cardTitle: "System Login",
    cardDesc: "Enter the system password to sign in",
    passLabel: "System password",
    btnLogin: "Sign in",
    btnLoading: "Checking...",
    errorMsg: "Incorrect password. Please try again.",
    forgotMsg: "If you forgot your password, contact your system administrator.",
    confidential: "GMS ERP • Confidential system — unauthorized access is prohibited",
  },
  ru: {
    subtitle: "Полнофункциональная корпоративная внутренняя ERP-система для компаний",
    devBy: "Разработано GMS Facility",
    cardTitle: "Вход в систему",
    cardDesc: "Введите системный пароль для входа",
    passLabel: "Системный пароль",
    btnLogin: "Войти",
    btnLoading: "Проверка...",
    errorMsg: "Неверный пароль. Попробуйте снова.",
    forgotMsg: "Если вы забыли пароль, свяжитесь с системным администратором.",
    confidential: "GMS ERP • Конфиденциальная система — несанкционированный доступ запрещён",
  },
};

function detectLang() {
  const nav = navigator.language || navigator.userLanguage || "az";
  const code = nav.slice(0, 2).toLowerCase();
  if (code === "ru") return "ru";
  if (code === "en") return "en";
  return "az";
}

const SYSTEM_PASSWORD = "gms2026";

export default function SystemLogin({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [davetler, setDavetler] = useState([]);
  const [lang, setLang] = useState(detectLang);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    // Load invited users to check muvveqetiParol
    base44.entities.DavetEdilmisIstifadeci.list().then(setDavetler).catch(() => {});
  }, []);

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    setError("");

    // 1. Check system master password
    if (password === SYSTEM_PASSWORD) {
      sessionStorage.setItem("gms_sys_auth", "1");
      sessionStorage.removeItem("gms_sys_user");
      setLoading(false);
      onSuccess();
      return;
    }

    // 2. Check muvveqetiParol from DavetEdilmisIstifadeci
    const matchedUser = davetler.find(
      d => d.muvveqetiParol && d.muvveqetiParol === password && d.status !== "Bloklandı" && d.status !== "Deaktiv"
    );

    if (matchedUser) {
      sessionStorage.setItem("gms_sys_auth", "1");
      sessionStorage.setItem("gms_sys_user", JSON.stringify({
        email: matchedUser.email,
        ad_soyad: matchedUser.ad_soyad,
        rol: matchedUser.rol,
        id: matchedUser.id,
        modul_erisimi: matchedUser.modul_erisimi || [],
      }));
      setLoading(false);
      onSuccess();
      return;
    }

    setError(t.errorMsg);
    setPassword("");
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-[9999]">
      {/* Language switcher */}
      <div className="absolute top-4 right-4 flex gap-1">
        {["az", "en", "ru"].map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${lang === l ? "bg-primary text-white" : "bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white"}`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm mx-4">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">GMS ERP</h1>
          <p className="text-slate-300 text-sm mt-2 leading-snug px-2">{t.subtitle}</p>
          <p className="text-slate-500 text-xs mt-2">{t.devBy}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-1">{t.cardTitle}</h2>
          <p className="text-slate-400 text-sm mb-6">{t.cardDesc}</p>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">{t.passLabel}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary focus-visible:border-primary"
                />
                <button
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-10"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? t.btnLoading : t.btnLogin}
            </Button>
          </div>

          <p className="text-slate-500 text-xs text-center mt-4">{t.forgotMsg}</p>
          <p className="text-slate-600 text-xs text-center mt-1">{t.confidential}</p>
        </div>
      </div>
    </div>
  );
}