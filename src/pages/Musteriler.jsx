import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Phone, MapPin } from "lucide-react";

export default function Musteriler() {
  const [musteriler, setMusteriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    ad_soyad: "", telefon: "", telefon2: "", email: "", unvan: "", seher: "Bakı",
    edv_odeyicisi: false, voen: "", musteri_tipi: "Fərdi", menbe: "Telefon", qeydler: ""
  });

  const fetchData = () => {
    base44.entities.Musteri.list("-created_date", 100).then(setMusteriler).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    await base44.entities.Musteri.create({ ...form, status: "Aktiv" });
    setShowDialog(false);
    setForm({ ad_soyad: "", telefon: "", telefon2: "", email: "", unvan: "", seher: "Bakı", edv_odeyicisi: false, voen: "", musteri_tipi: "Fərdi", menbe: "Telefon", qeydler: "" });
    fetchData();
  };

  const filtered = musteriler.filter(m =>
    m.ad_soyad?.toLowerCase().includes(search.toLowerCase()) ||
    m.telefon?.includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Müştərilər</h1>
          <p className="text-muted-foreground text-sm mt-1">{musteriler.length} müştəri</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Yeni Müştəri</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Ad və ya telefon axtar..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(m => (
          <div key={m.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{m.ad_soyad}</h3>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${m.status === "Aktiv" ? "bg-green-100 text-green-700" : m.status === "Qara siyahı" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                  {m.status}
                </span>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{m.musteri_tipi}</span>
            </div>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{m.telefon}</div>
              {m.unvan && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{m.unvan}</span></div>}
            </div>
            {m.edv_odeyicisi && <p className="text-xs text-primary mt-2">ƏDV ödəyicisi • {m.voen}</p>}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
              <span>Sifarişlər: {m.sifaris_sayi || 0}</span>
              <span>{(m.umumi_xercle || 0).toFixed(2)} ₼</span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Yeni Müştəri</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ad Soyad *</Label><Input value={form.ad_soyad} onChange={e => setForm(f => ({...f, ad_soyad: e.target.value}))} /></div>
              <div><Label>Telefon *</Label><Input value={form.telefon} onChange={e => setForm(f => ({...f, telefon: e.target.value}))} placeholder="+994..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
              <div><Label>Şəhər</Label><Input value={form.seher} onChange={e => setForm(f => ({...f, seher: e.target.value}))} /></div>
            </div>
            <div><Label>Ünvan</Label><Input value={form.unvan} onChange={e => setForm(f => ({...f, unvan: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Müştəri tipi</Label>
                <Select value={form.musteri_tipi} onValueChange={v => setForm(f => ({...f, musteri_tipi: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fərdi">Fərdi</SelectItem>
                    <SelectItem value="Korporativ">Korporativ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mənbə</Label>
                <Select value={form.menbe} onValueChange={v => setForm(f => ({...f, menbe: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Telefon","Vebsayt","Sosial media","Tövsiyə","Digər"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.edv_odeyicisi} onCheckedChange={v => setForm(f => ({...f, edv_odeyicisi: v}))} />
              <Label>ƏDV ödəyicisi</Label>
            </div>
            {form.edv_odeyicisi && <div><Label>VÖEN</Label><Input value={form.voen} onChange={e => setForm(f => ({...f, voen: e.target.value}))} /></div>}
            <div><Label>Qeydlər</Label><Textarea value={form.qeydler} onChange={e => setForm(f => ({...f, qeydler: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleCreate}>Yarat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}