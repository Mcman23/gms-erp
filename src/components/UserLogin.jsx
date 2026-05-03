import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function UserLogin({ onSuccess, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email və şifrəni daxil edin.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const davetler = await base44.entities.DavetEdilmisIstifadeci.list();
      const matched = davetler.find(
        d =>
          d.email?.toLowerCase() === email.toLowerCase() &&
          d.muvveqetiParol === password &&
          d.status !== "Bloklandı" &&
          d.status !== "Deaktiv"
      );

      if (!matched) {
        setError("Email və ya şifrə yanlışdır.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("gms_sys_user", JSON.stringify({
        email: matched.email,
        ad_soyad: matched.ad_soyad,
        rol: matched.rol,
        id: matched.id,
        modul_erisimi: matched.modul_erisimi || [],
      }));

      // Update last login
      await base44.entities.DavetEdilmisIstifadeci.update(matched.id, {
        son_giris: new Date().toISOString(),
        giris_sayi: (matched.giris_sayi || 0) + 1,
      });

      setLoading(false);
      onSuccess(matched);
    } catch {
      setError("Xəta baş verdi. Yenidən cəhd edin.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-[9999]">
      <div className="w-full max-w-sm mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">GMS ERP</h1>
          <p className="text-slate-400 text-sm mt-1">İstifadəçi girişi</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-1">Hesabınıza daxil olun</h2>
          <p className="text-slate-400 text-sm mb-6">Email və müvvəqəti parolunuzu daxil edin</p>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="email@sirket.az"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Şifrə</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary focus-visible:border-primary"
                />
                <button
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-10"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Yoxlanılır..." : "Daxil ol"}
            </Button>
          </div>

          <p className="text-slate-500 text-xs text-center mt-4">
            Şifrənizi unutmusunuzsa, sistem admininizlə əlaqə saxlayın.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="text-slate-500 hover:text-slate-300 text-xs text-center mt-2 block w-full transition-colors"
            >
              ← Geri qayıt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}