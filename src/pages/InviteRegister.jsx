import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Lock, AlertCircle } from "lucide-react";

export default function InviteRegister() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const email = urlParams.get("email");

  const [davet, setDavet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ ad_soyad: "", parol: "", parol2: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError("Keçərsiz link. Zəhmət olmasa admindən yeni link istəyin.");
      setLoading(false);
      return;
    }
    base44.entities.DavetEdilmisIstifadeci.filter({ davet_token: token })
      .then(results => {
        if (!results || results.length === 0) {
          setError("Link tapılmadı və ya artıq istifadə edilib.");
        } else {
          const d = results[0];
          if (d.status === "Deaktiv" || d.status === "Bloklandı") {
            setError("Bu dəvət linki deaktiv edilib. Adminlə əlaqə saxlayın.");
          } else {
            setDavet(d);
            setForm(f => ({ ...f, ad_soyad: d.ad_soyad || "" }));
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Xəta baş verdi. Yenidən cəhd edin.");
        setLoading(false);
      });
  }, [token, email]);

  const handleSubmit = async () => {
    if (!form.ad_soyad) return alert("Ad Soyad daxil edin.");
    if (form.parol.length < 6) return alert("Parol ən az 6 simvol olmalıdır.");
    if (form.parol !== form.parol2) return alert("Parollar uyğun deyil.");

    setSaving(true);
    try {
      // Invite user to platform
      await base44.users.inviteUser(email, ["Super Admin", "Admin", "Direktor"].includes(davet.rol) ? "admin" : "user");

      // Mark as active
      await base44.entities.DavetEdilmisIstifadeci.update(davet.id, {
        status: "Aktiv",
        ad_soyad: form.ad_soyad,
        token_aktiv: false,
        davet_token: null,
      });

      setDone(true);
    } catch (e) {
      alert("Qeydiyyat zamanı xəta baş verdi: " + e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Link Keçərsizdir</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button variant="outline" onClick={() => window.location.href = "/"}>Ana Səhifəyə Qayıt</Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold">Qeydiyyat tamamlandı!</h2>
          <p className="text-muted-foreground text-sm">
            Hesabınız aktivləşdirildi. İndi sistemə giriş edə bilərsiniz.
          </p>
          <Button className="w-full" onClick={() => window.location.href = "/"}>Sistemə Daxil Ol</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">GMS ERP Qeydiyyat</h1>
          <p className="text-muted-foreground text-sm mt-1">Hesabınızı aktivləşdirin</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="font-medium">{email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rol:</span><span className="font-medium">{davet?.rol}</span></div>
          </div>

          <div>
            <Label>Ad Soyad *</Label>
            <Input
              value={form.ad_soyad}
              onChange={e => setForm(f => ({ ...f, ad_soyad: e.target.value }))}
              placeholder="Adınız Soyadınız"
            />
          </div>
          <div>
            <Label>Parol *</Label>
            <Input
              type="password"
              value={form.parol}
              onChange={e => setForm(f => ({ ...f, parol: e.target.value }))}
              placeholder="Ən az 6 simvol"
            />
          </div>
          <div>
            <Label>Parolu Təkrar Daxil Edin *</Label>
            <Input
              type="password"
              value={form.parol2}
              onChange={e => setForm(f => ({ ...f, parol2: e.target.value }))}
              placeholder="Parolu təkrar yazın"
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={saving}>
            {saving ? "Qeydiyyat edilir..." : "Qeydiyyatı Tamamla"}
          </Button>
        </div>
      </div>
    </div>
  );
}