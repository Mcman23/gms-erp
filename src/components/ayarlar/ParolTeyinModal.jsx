import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

function generateStrongPassword() {
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "#@!$%&";
  const all = upper + lower + digits + special;
  let pass = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = 4; i < 10; i++) pass.push(all[Math.floor(Math.random() * all.length)]);
  return pass.sort(() => Math.random() - 0.5).join("");
}

export default function ParolTeyinModal({ target, currentAdmin, onClose }) {
  const [parol, setParol] = useState("");
  const [parol2, setParol2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [mustChange, setMustChange] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!target) return null;

  // Super Admin cannot change another Super Admin's password
  const isSuperAdminTarget = target.rol === "Super Admin";
  const currentIsSuperAdmin = currentAdmin?.rol === "Super Admin";
  // Only block if target is ALSO super admin and target != current admin
  const blocked = isSuperAdminTarget && target.email !== currentAdmin?.email;

  const handleAutoGenerate = () => {
    const p = generateStrongPassword();
    setParol(p);
    setParol2(p);
    setShow1(true);
  };

  const handleSave = async () => {
    if (!parol || parol.length < 8) {
      toast({ title: "Xəta", description: "Parol minimum 8 simvol olmalıdır", variant: "destructive" });
      return;
    }
    if (parol !== parol2) {
      toast({ title: "Xəta", description: "Parollar uyğun gəlmir", variant: "destructive" });
      return;
    }

    setLoading(true);
    // Save new password to DavetEdilmisIstifadeci
    await base44.entities.DavetEdilmisIstifadeci.update(target.id, {
      muvveqetiParol: parol,
      ilkGirisTamamlandi: !mustChange ? true : false,
    });

    // Log the change
    await base44.entities.ParolDeyisiklikJurnali.create({
      istifadeci: target.email,
      istifadeci_adi: target.ad_soyad || target.email,
      deyisdiren_admin: currentAdmin?.email || "—",
      deyisiklik_tarixi: new Date().toISOString(),
      email_gonderildi: sendEmail,
      qeyd: mustChange ? "İstifadəçi növbəti girişdə parolu dəyişməlidir" : "",
    });

    // Send email if requested
    if (sendEmail) {
      await base44.integrations.Core.SendEmail({
        to: target.email,
        subject: "GMS ERP — Giriş məlumatlarınız yeniləndi",
        body: `Hörmətli ${target.ad_soyad || target.email},\n\nGMS ERP sisteminə giriş məlumatlarınız yeniləndi.\n\nSistem: https://kassir.click\nEmail: ${target.email}\nYeni parol: ${parol}\n\nBu parol Super Admin tərəfindən təyin edilmişdir.\nZəhmət olmasa ilk girişdə parolunuzu dəyişin.\n\nGMS Facility Group`,
      }).catch(() => {});
    }

    setLoading(false);
    toast({ title: "Parol uğurla təyin edildi", description: sendEmail ? "İstifadəçiyə email göndərildi" : "" });
    onClose();
  };

  return (
    <Dialog open={!!target} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Parol Təyin Et — {target.ad_soyad || target.email}</DialogTitle>
        </DialogHeader>

        {blocked ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-red-600 font-semibold">Giriş qadağandır</p>
            <p className="text-sm text-muted-foreground">Super Admin başqa Super Admin-in parolunu dəyişə bilməz.</p>
            <Button variant="outline" onClick={onClose}>Bağla</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Yeni parol</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    type={show1 ? "text" : "password"}
                    value={parol}
                    onChange={e => setParol(e.target.value)}
                    placeholder="Min. 8 simvol"
                    className="pr-9"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShow1(s => !s)}>
                    {show1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button variant="outline" type="button" onClick={handleAutoGenerate} className="gap-1 shrink-0">
                  <RefreshCw className="w-3.5 h-3.5" /> Avtomatik
                </Button>
              </div>
            </div>
            <div>
              <Label>Təkrar parol</Label>
              <div className="relative mt-1">
                <Input
                  type={show2 ? "text" : "password"}
                  value={parol2}
                  onChange={e => setParol2(e.target.value)}
                  placeholder="Parolu təkrar daxil edin"
                  className="pr-9"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShow2(s => !s)}>
                  {show2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {parol && parol2 && parol !== parol2 && (
                <p className="text-xs text-red-500 mt-1">Parollar uyğun gəlmir</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={mustChange} onChange={e => setMustChange(e.target.checked)} className="rounded" />
                İstifadəçi növbəti girişdə parolu dəyişməlidir
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="rounded" />
                Bu parol haqqında istifadəçiyə email göndər
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Ləğv et</Button>
              <Button className="flex-1" onClick={handleSave} disabled={loading}>
                {loading ? "Gözləyin..." : "Təsdiqlə"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}