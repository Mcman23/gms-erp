import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Save, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Shield, LogOut, Plus, Lock, UserX, UserCheck } from "lucide-react";
import moment from "moment";

const ROLLER = ["Super Admin","Admin","Direktor","Amaliyyat meneceri","Dispatcher","Supervisor","Sahe iscisi","Satis meneceri","HR meneceri","Maliyye meneceri","Kassir","Anbar muduru","Audit/Baxis"];

const ROL_MODULLER = {
  "Kassir": ["Kassa","Fakturalar","Sifarisler"],
  "HR meneceri": ["Iscilar","Mezuniyyet","Maas"],
  "Dispatcher": ["Sifarisler","Planlama"],
  "Maliyye meneceri": ["Maliyye","Fakturalar","Hesabatlar","Kassa"],
  "Sahe iscisi": ["Oz tapsirilari"],
  "Supervisor": ["Sifarisler","Iscilar"],
  "Anbar muduru": ["Anbar"],
  "Admin": ["Hamisi"],
  "Super Admin": ["Hamisi"],
  "Direktor": ["Hamisi"],
};

const BUTUN_MODULLER = ["Dashboard","Kassa","Musteriler","Sifarisler","Planlama","Iscilar","Mezuniyyet","Maas","Anbar","Fakturalar","Maliyye","Avadanliq","Sikayetler","Hesabatlar","Ayarlar"];

export default function Ayarlar() {
  const [users, setUsers] = useState([]);
  const [davetler, setDavetler] = useState([]);
  const [qiymetler, setQiymetler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qiymetForm, setQiymetForm] = useState({ xidmet_adi: "", b2c_qiymet: "", b2b_qiymet: "", vahid: "m²" });
  const [editingQiymet, setEditingQiymet] = useState(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", ad_soyad: "", telefon: "", rol: "Kassir", departament: "", modul_erisimi: [] });
  const { toast } = useToast();

  const fetchData = () => {
    Promise.all([
      base44.entities.User.list().catch(() => []),
      base44.entities.DavetEdilmisIstifadeci.list("-created_date", 100).catch(() => []),
      base44.entities.QiymetAyarlari.list().catch(() => []),
    ]).then(([u, d, q]) => { setUsers(u); setDavetler(d); setQiymetler(q); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const handleRolChange = (rol) => {
    const moduller = ROL_MODULLER[rol] || [];
    setInviteForm(f => ({ ...f, rol, modul_erisimi: moduller[0] === "Hamısı" ? BUTUN_MODULLER : moduller }));
  };

  const toggleModul = (modul) => {
    setInviteForm(f => ({
      ...f,
      modul_erisimi: f.modul_erisimi.includes(modul)
        ? f.modul_erisimi.filter(m => m !== modul)
        : [...f.modul_erisimi, modul]
    }));
  };

  const handleInvite = async () => {
    if (!inviteForm.email) return;
    // Invite to platform
    await base44.users.inviteUser(inviteForm.email, ["Super Admin","Admin","Direktor"].includes(inviteForm.rol) ? "admin" : "user");
    // Save to DavetEdilmisIstifadeci
    await base44.entities.DavetEdilmisIstifadeci.create({
      email: inviteForm.email,
      ad_soyad: inviteForm.ad_soyad,
      telefon: inviteForm.telefon,
      rol: inviteForm.rol,
      departament: inviteForm.departament,
      modul_erisimi: inviteForm.modul_erisimi,
      status: "Dəvət göndərilib",
      davet_tarixi: new Date().toISOString(),
      giris_sayi: 0,
      token_aktiv: true,
    });
    toast({ title: "Dəvət göndərildi", description: `${inviteForm.email} adresinə dəvət göndərildi.` });
    setShowInviteDialog(false);
    setInviteForm({ email: "", ad_soyad: "", telefon: "", rol: "Kassir", departament: "", modul_erisimi: [] });
    fetchData();
  };

  const handleBlok = async (davet, blok) => {
    await base44.entities.DavetEdilmisIstifadeci.update(davet.id, { status: blok ? "Bloklandı" : "Aktiv" });
    fetchData();
  };

  const handleTokenReset = async (davet) => {
    await base44.entities.DavetEdilmisIstifadeci.update(davet.id, { token_aktiv: true });
    toast({ title: "Token sifirlandir" });
    fetchData();
  };

  const handleQiymetSave = async () => {
    if (!qiymetForm.xidmet_adi) return;
    if (editingQiymet) {
      await base44.entities.QiymetAyarlari.update(editingQiymet, {
        xidmet_adi: qiymetForm.xidmet_adi,
        b2c_qiymet: parseFloat(qiymetForm.b2c_qiymet) || 0,
        b2b_qiymet: parseFloat(qiymetForm.b2b_qiymet) || 0,
        vahid: qiymetForm.vahid || "m²",
        aktiv: true,
      });
      setEditingQiymet(null);
    } else {
      await base44.entities.QiymetAyarlari.create({
        xidmet_adi: qiymetForm.xidmet_adi,
        b2c_qiymet: parseFloat(qiymetForm.b2c_qiymet) || 0,
        b2b_qiymet: parseFloat(qiymetForm.b2b_qiymet) || 0,
        vahid: qiymetForm.vahid || "m²",
        aktiv: true,
      });
    }
    setQiymetForm({ xidmet_adi: "", b2c_qiymet: "", b2b_qiymet: "", vahid: "m²" });
    toast({ title: "Qiymet saxlanildi" });
    fetchData();
  };

  const handleQiymetDelete = async (id) => {
    await base44.entities.QiymetAyarlari.delete(id);
    fetchData();
  };

  const startEdit = (q) => {
    setEditingQiymet(q.id);
    setQiymetForm({ xidmet_adi: q.xidmet_adi, b2c_qiymet: q.b2c_qiymet, b2b_qiymet: q.b2b_qiymet, vahid: q.vahid || "m²" });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const statusColors = { "Dəvət göndərilib": "bg-yellow-100 text-yellow-700", "Aktiv": "bg-green-100 text-green-700", "Bloklandı": "bg-red-100 text-red-700", "Deaktiv": "bg-gray-100 text-gray-600" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sistem Ayarları</h1>
        <p className="text-muted-foreground text-sm mt-1">İstifadəçilər, rollar və sistem konfiqurasiyası</p>
      </div>

      <Tabs defaultValue="idareetme">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="idareetme">Istifadeci Idareetmesi</TabsTrigger>
          <TabsTrigger value="platform">Platform Istifadeciler</TabsTrigger>
          <TabsTrigger value="qiymet">Qiymet Ayarlari</TabsTrigger>
          <TabsTrigger value="roller">Rollar</TabsTrigger>
          <TabsTrigger value="sistem">Sistem</TabsTrigger>
        </TabsList>

        {/* İSTİFADƏÇİ İDARƏETMƏSİ */}
        <TabsContent value="idareetme" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { handleRolChange("Kassir"); setShowInviteDialog(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Yeni İstifadəçi Dəvət Et
            </Button>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Ad Soyad</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">Rol</th>
                    <th className="text-left px-4 py-3 font-medium">Departament</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Modul Erişimi</th>
                    <th className="text-left px-4 py-3 font-medium">Son Giriş</th>
                    <th className="text-right px-4 py-3 font-medium">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody>
                  {davetler.map(d => (
                    <tr key={d.id} className="border-t border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{d.ad_soyad || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{d.rol}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.departament || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[d.status] || ""}`}>{d.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                        {(d.modul_erisimi || []).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {d.son_giris ? moment(d.son_giris).format("DD.MM.YYYY") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          {d.status === "Bloklandı" ? (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600" onClick={() => handleBlok(d, false)} title="Aç">
                              <UserCheck className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600" onClick={() => handleBlok(d, true)} title="Blokla">
                              <UserX className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground" onClick={() => handleTokenReset(d)} title="Token sıfırla">
                            <Lock className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {davetler.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">İstifadəçi tapılmadı</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* PLATFORM İSTİFADƏÇİLƏRİ */}
        <TabsContent value="platform" className="mt-4 space-y-4">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Ad</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Rol</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{u.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* QIYMET AYARLARI */}
        <TabsContent value="qiymet" className="mt-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-sm">{editingQiymet ? "Qiymeti Duzelis Et" : "Yeni Xidmet Qiymeti"}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label>Xidmet adi</Label><Input value={qiymetForm.xidmet_adi} onChange={e => setQiymetForm(f => ({...f, xidmet_adi: e.target.value}))} placeholder="Ev temizliyi" /></div>
              <div><Label>B2C (₼/vahid)</Label><Input type="number" value={qiymetForm.b2c_qiymet} onChange={e => setQiymetForm(f => ({...f, b2c_qiymet: e.target.value}))} placeholder="2.5" /></div>
              <div><Label>B2B (₼/vahid)</Label><Input type="number" value={qiymetForm.b2b_qiymet} onChange={e => setQiymetForm(f => ({...f, b2b_qiymet: e.target.value}))} placeholder="2.0" /></div>
              <div><Label>Vahid</Label><Input value={qiymetForm.vahid} onChange={e => setQiymetForm(f => ({...f, vahid: e.target.value}))} placeholder="m²" /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleQiymetSave} className="gap-2"><Save className="w-4 h-4" /> {editingQiymet ? "Yenile" : "Elave et"}</Button>
              {editingQiymet && <Button variant="outline" onClick={() => { setEditingQiymet(null); setQiymetForm({ xidmet_adi: "", b2c_qiymet: "", b2b_qiymet: "", vahid: "m²" }); }}>Ləğv et</Button>}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 text-sm font-semibold">Tesdiqlenmis Qiymet Listesi</div>
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr>
                <th className="text-left px-4 py-2 font-medium">Xidmet adi</th>
                <th className="text-right px-4 py-2 font-medium">B2C</th>
                <th className="text-right px-4 py-2 font-medium">B2B</th>
                <th className="text-left px-4 py-2 font-medium">Vahid</th>
                <th className="px-4 py-2"></th>
              </tr></thead>
              <tbody>
                {qiymetler.map(q => (
                  <tr key={q.id} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{q.xidmet_adi}</td>
                    <td className="px-4 py-2.5 text-right">{q.b2c_qiymet} ₼</td>
                    <td className="px-4 py-2.5 text-right">{q.b2b_qiymet} ₼</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{q.vahid || "m²"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => startEdit(q)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600" onClick={() => handleQiymetDelete(q.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {qiymetler.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Hec bir qiymet elave edilmeyib. Yuxaridan elave edin.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="roller" className="mt-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-4">Mövcud Rollar və Modul Erişimi</h3>
            <div className="space-y-3">
              {ROLLER.map(r => (
                <div key={r} className="flex items-start gap-3 py-2 border-b border-border/50">
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{r}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(ROL_MODULLER[r] || ["—"]).map(m => (
                      <span key={m} className="text-xs bg-muted px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sistem" className="mt-4 space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-sm">Vergi Ayarları</h3>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div><Label>ƏDV faizi</Label><Input value="18%" disabled /></div>
              <div><Label>Valyuta</Label><Input value="AZN" disabled /></div>
              <div><Label>DSMF İşçi</Label><Input value="3%" disabled /></div>
              <div><Label>DSMF İşvərən</Label><Input value="22%" disabled /></div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-3">Hesab</h3>
            <Button variant="destructive" onClick={() => base44.auth.logout()} className="gap-2">
              <LogOut className="w-4 h-4" /> Çıxış
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Yeni İstifadəçi Dəvət Et</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ad Soyad</Label><Input value={inviteForm.ad_soyad} onChange={e => setInviteForm(f => ({...f, ad_soyad: e.target.value}))} /></div>
              <div><Label>Email *</Label><Input value={inviteForm.email} onChange={e => setInviteForm(f => ({...f, email: e.target.value}))} type="email" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefon</Label><Input value={inviteForm.telefon} onChange={e => setInviteForm(f => ({...f, telefon: e.target.value}))} /></div>
              <div><Label>Departament</Label><Input value={inviteForm.departament} onChange={e => setInviteForm(f => ({...f, departament: e.target.value}))} /></div>
            </div>
            <div>
              <Label>Rol *</Label>
              <Select value={inviteForm.rol} onValueChange={handleRolChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLLER.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Modul Erişimi</Label>
              <div className="grid grid-cols-2 gap-2">
                {BUTUN_MODULLER.map(m => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={inviteForm.modul_erisimi.includes(m)}
                      onChange={() => toggleModul(m)}
                      className="rounded"
                    />
                    {m}
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleInvite}>Dəvət göndər</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}