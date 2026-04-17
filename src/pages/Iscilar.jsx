import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Phone, Mail } from "lucide-react";
import DeleteButton from "../components/DeleteButton";
import { useAdmin } from "../hooks/useAdmin";

const vezifeler = ["Sahə işçisi","Supervisor","Dispatcher","Sürücü","Anbardar","Menecer"];
const statuslar = ["Aktiv","Məzuniyyətdə","Xəstə","İşdən çıxıb"];

export default function Iscilar() {
  const isAdmin = useAdmin();
  const [iscilar, setIscilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ ad_soyad: "", vezife: "Sahə işçisi", telefon: "", email: "", maas: "", komanda: "", ise_baslama: "", dogum_tarixi: "", unvan: "" });

  const fetchData = () => { base44.entities.Isci.list("-created_date", 100).then(setIscilar).finally(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    await base44.entities.Isci.create({ ...form, maas: parseFloat(form.maas) || 0, status: "Aktiv" });
    setShowDialog(false);
    setForm({ ad_soyad: "", vezife: "Sahə işçisi", telefon: "", email: "", maas: "", komanda: "", ise_baslama: "", dogum_tarixi: "", unvan: "" });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const statusColor = { "Aktiv": "bg-green-100 text-green-700", "Məzuniyyətdə": "bg-blue-100 text-blue-700", "Xəstə": "bg-yellow-100 text-yellow-700", "İşdən çıxıb": "bg-red-100 text-red-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">İşçilər</h1>
          <p className="text-muted-foreground text-sm mt-1">{iscilar.length} işçi</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Yeni İşçi</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {iscilar.map(i => (
          <div key={i.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {i.ad_soyad?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold">{i.ad_soyad}</h3>
                  <p className="text-xs text-muted-foreground">{i.vezife}</p>
                </div>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor[i.status] || ""}`}>{i.status}</span>
            </div>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{i.telefon}</div>
              {i.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{i.email}</div>}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
              <span>Komanda: {i.komanda || "—"}</span>
              <span className="font-semibold text-foreground">{(i.maas || 0).toFixed(2)} ₼</span>
              {isAdmin && <DeleteButton onDelete={async () => { await base44.entities.Isci.delete(i.id); fetchData(); }} />}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Yeni İşçi</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ad Soyad *</Label><Input value={form.ad_soyad} onChange={e => setForm(f => ({...f, ad_soyad: e.target.value}))} /></div>
              <div><Label>Telefon *</Label><Input value={form.telefon} onChange={e => setForm(f => ({...f, telefon: e.target.value}))} placeholder="+994..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vəzifə *</Label>
                <Select value={form.vezife} onValueChange={v => setForm(f => ({...f, vezife: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{vezifeler.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Maaş (₼)</Label><Input type="number" value={form.maas} onChange={e => setForm(f => ({...f, maas: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
              <div><Label>Komanda</Label><Input value={form.komanda} onChange={e => setForm(f => ({...f, komanda: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>İşə başlama tarixi</Label><Input type="date" value={form.ise_baslama} onChange={e => setForm(f => ({...f, ise_baslama: e.target.value}))} /></div>
              <div><Label>Doğum tarixi</Label><Input type="date" value={form.dogum_tarixi} onChange={e => setForm(f => ({...f, dogum_tarixi: e.target.value}))} /></div>
            </div>
            <Button className="w-full" onClick={handleCreate}>Yarat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}