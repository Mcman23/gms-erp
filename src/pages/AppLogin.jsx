import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { setSession } from "@/hooks/useAppSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";

const DEMO_CODE = "123456";

export default function AppLogin({ onSuccess }) {
  const [step, setStep] = useState(1); // 1=email, 2=code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [davet, setDavet] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email.trim()) { setError("E-poçt ünvanını daxil edin."); return; }
    setLoading(true);
    setError("");
    try {
      // Bootstrap: hardcoded admin always allowed
      if (email.trim().toLowerCase() === "admin@temizlik.az") {
        const bootstrapUser = { email: "admin@temizlik.az", ad_soyad: "Sistem Admin", rol: "Admin", status: "Aktiv", id: "bootstrap" };
        setDavet(bootstrapUser);
        setStep(2);
        setLoading(false);
        return;
      }
      const results = await base44.entities.DavetEdilmisIstifadeci.filter({ email: email.trim().toLowerCase() });
      if (!results || results.length === 0) {
        setError("Bu e-poçt sistemə icazəli deyil. Adminlə əlaqə saxlayın.");
        setLoading(false);
        return;
      }
      const user = results[0];
      if (user.status === "Bloklandı") {
        setError("Hesabınız bloklanmışdır. Adminlə əlaqə saxlayın.");
        setLoading(false);
        return;
      }
      setDavet(user);
      setStep(2);
    } catch (e) {
      setError("Sistem xətası. Yenidən cəhd edin.");
    }
    setLoading(false);
  };

  const handleCodeSubmit = () => {
    if (locked) { setError("Çox sayda yanlış cəhd. 5 dəqiqə gözləyin."); return; }
    if (code !== DEMO_CODE) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setLocked(true);
        setTimeout(() => { setLocked(false); setAttempts(0); }, 5 * 60 * 1000);
        setError("Çox sayda yanlış cəhd. 5 dəqiqə gözləyin.");
      } else {
        setError(`Yanlış kod. ${3 - newAttempts} cəhd qalıb.`);
      }
      return;
    }
    // Success - update last login
    base44.entities.DavetEdilmisIstifadeci.update(davet.id, {
      status: "Aktiv",
      son_giris: new Date().toISOString(),
      giris_sayi: (davet.giris_sayi || 0) + 1,
    }).catch(() => {});

    setSession({
      email: davet.email,
      rol: davet.rol,
      adSoyad: davet.ad_soyad || davet.email,
      davetId: davet.id,
    });
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary/20 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">CleanPro</h1>
            <p className="text-white/50 text-xs">ERP İdarəetmə Sistemi</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">Sistemə Giriş</h2>
                <p className="text-sm text-muted-foreground mt-1">E-poçt ünvanınızı daxil edin</p>
              </div>
              <div className="space-y-2">
                <Label>E-poçt ünvanı</Label>
                <Input
                  type="email"
                  placeholder="siz@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleEmailSubmit()}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
              <Button className="w-full" onClick={handleEmailSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Davam et
              </Button>
              <p className="text-xs text-muted-foreground text-center">Giriş icazəsi olmayan istifadəçilər sistemə daxil ola bilməz</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <button onClick={() => { setStep(1); setCode(""); setError(""); setAttempts(0); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
                  <ArrowLeft className="w-3.5 h-3.5" /> Geri
                </button>
                <h2 className="text-xl font-bold">Doğrulama Kodu</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-primary">{email}</span> üçün 6 rəqəmli kod daxil edin
                </p>
              </div>
              <div className="space-y-2">
                <Label>Doğrulama kodu</Label>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleCodeSubmit()}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                  disabled={locked}
                />
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
              <Button className="w-full" onClick={handleCodeSubmit} disabled={locked || code.length < 6}>
                Daxil ol
              </Button>
              <p className="text-xs text-muted-foreground text-center">Demo sistem: kod <strong>123456</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}