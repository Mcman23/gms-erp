import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Check, X } from "lucide-react";
import moment from "moment";

export default function Mezuniyyet() {
  const [mezuniyyetler, setMezuniyyetler] = useState([]);
  const [iscilar, setIscilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ isci_id: "", tip: "İllik", baslama_tarixi: "", bitis_tarixi: "", sebebi: "" });

  const fetchData = () => {
    Promise.all([
      base44.entities.Mezuniyyet.list("-created_date", 100),
      base44.entities.Isci.list(),
    ]).then(([m, i]) => { setMezuniyyetler(m); setIscilar(i); setLoading(false); });
  };
  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    const isci = iscilar.find(i => i.id === form.isci_id);
    const start = moment(form.baslama_tarixi);
    const end = moment(form.bitis_tarixi);
    const gunSayi = end.diff(start, "days") + 1;

    await base44.entities.Mezuniyyet.create({
      ...form, isci_adi: isci?.ad_soyad || "", gun_sayi: gunSayi, status: "Gözləyir"
    });
    setShowDialog(false);
    setForm({ isci_id: "", tip: "İllik", baslama_tarixi: "", bitis_tarixi: "", sebebi: "" });
    fetchData();
  };

  const handleStatus = async (id, status) => {
    await base44.entities.Mezuniyyet.update(id, { status });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const statusColors = { "Gözləyir": "bg-yellow-100 text-yellow-700", "Təsdiqləndi": "bg-green-100 text-green-700", "Rədd edildi": "bg-red-100 text-red-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Məzuniyyət</h1>
          <p className="text-muted-foreground text-sm mt-1">Sorğular və təsdiqlər</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Yeni Sorğu</Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">İşçi</th>
                <th className="text-left px-4 py-3 font-medium">Tip</th>
                <th className="text-left px-4 py-3 font-medium">Tarix</th>
                <th className="text-center px-4 py-3 font-medium">Gün</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {mezuniyyetler.map(m => (
                <tr key={m.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{m.isci_adi}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.tip}</td>
                  <td className="px-4 py-3">{moment(m.baslama_tarixi).format("DD.MM.YYYY")} — {moment(m.bitis_tarixi).format("DD.MM.YYYY")}</td>
                  <td className="px-4 py-3 text-center">{m.gun_sayi}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[m.status] || ""}`}>{m.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.status === "Gözləyir" && (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" onClick={() => handleStatus(m.id, "Təsdiqləndi")}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => handleStatus(m.id, "Rədd edildi")}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {mezuniyyetler.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sorğu yoxdur</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Məzuniyyət Sorğusu</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>İşçi *</Label>
              <Select value={form.isci_id} onValueChange={v => setForm(f => ({...f, isci_id: v}))}>
                <SelectTrigger><SelectValue placeholder="İşçi seçin" /></SelectTrigger>
                <SelectContent>{iscilar.map(i => <SelectItem key={i.id} value={i.id}>{i.ad_soyad}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tip</Label>
              <Select value={form.tip} onValueChange={v => setForm(f => ({...f, tip: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["İllik","Xəstəlik","Ödənişsiz","Doğum","Təhsil"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Başlama tarixi *</Label><Input type="date" value={form.baslama_tarixi} onChange={e => setForm(f => ({...f, baslama_tarixi: e.target.value}))} /></div>
              <div><Label>Bitmə tarixi *</Label><Input type="date" value={form.bitis_tarixi} onChange={e => setForm(f => ({...f, bitis_tarixi: e.target.value}))} /></div>
            </div>
            <div><Label>Səbəbi</Label><Textarea value={form.sebebi} onChange={e => setForm(f => ({...f, sebebi: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleCreate}>Sorğu göndər</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}