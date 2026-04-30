import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Receipt } from "lucide-react";
import moment from "moment";

export default function Fakturalar() {
  const [fakturalar, setFakturalar] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [edvli, setEdvli] = useState(false);
  const [form, setForm] = useState({ musteri_id: "", ara_cem: "", son_odenis_tarixi: "", qeydler: "" });

  const fetchData = () => {
    Promise.all([
      base44.entities.Faktura.list("-created_date", 100),
      base44.entities.Musteri.list("-created_date", 200),
    ]).then(([f, m]) => { setFakturalar(f); setMusteriler(m); setLoading(false); });
  };
  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    const musteri = musteriler.find(m => m.id === form.musteri_id);
    const araCem = parseFloat(form.ara_cem) || 0;
    const edvFaizi = (edvli || musteri?.edv_odeyicisi) ? 18 : 0;
    const edvMeblegi = araCem * edvFaizi / 100;
    const fakturaNo = `FAK-${Date.now().toString().slice(-6)}`;

    await base44.entities.Faktura.create({
      faktura_no: fakturaNo,
      musteri_id: form.musteri_id,
      musteri_adi: musteri?.ad_soyad || "",
      tarix: new Date().toISOString().slice(0, 10),
      son_odenis_tarixi: form.son_odenis_tarixi,
      ara_cem: araCem,
      edv_faizi: edvFaizi,
      edv_meblegi: edvMeblegi,
      umumi_mebleg: araCem + edvMeblegi,
      odenis_statusu: "Ödənilməyib",
      odenilmis_mebleg: 0,
      qeydler: form.qeydler,
    });
    setShowDialog(false);
    setForm({ musteri_id: "", ara_cem: "", son_odenis_tarixi: "", qeydler: "" });
    setEdvli(false);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const totalBorc = fakturalar.filter(f => f.odenis_statusu !== "Ödənilib").reduce((s, f) => s + (f.umumi_mebleg || 0) - (f.odenilmis_mebleg || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fakturalar</h1>
          <p className="text-muted-foreground text-sm mt-1">{fakturalar.length} faktura • Ödənilməmiş: {totalBorc.toFixed(2)} ₼</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Yeni Faktura</Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Faktura №</th>
                <th className="text-left px-4 py-3 font-medium">Müştəri</th>
                <th className="text-left px-4 py-3 font-medium">Tarix</th>
                <th className="text-right px-4 py-3 font-medium">Ara cəm</th>
                <th className="text-right px-4 py-3 font-medium">ƏDV</th>
                <th className="text-right px-4 py-3 font-medium">Ümumi</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {fakturalar.map(f => (
                <tr key={f.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{f.faktura_no}</td>
                  <td className="px-4 py-3">{f.musteri_adi}</td>
                  <td className="px-4 py-3">{f.tarix ? moment(f.tarix).format("DD.MM.YYYY") : "—"}</td>
                  <td className="px-4 py-3 text-right">{(f.ara_cem || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{f.edv_faizi ? `${f.edv_faizi}% (${(f.edv_meblegi || 0).toFixed(2)} ₼)` : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{(f.umumi_mebleg || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      f.odenis_statusu === "Ödənilib" ? "bg-green-100 text-green-700" :
                      f.odenis_statusu === "Qismən" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                    }`}>{f.odenis_statusu}</span>
                  </td>
                </tr>
              ))}
              {fakturalar.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Faktura yoxdur</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Faktura</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Müştəri *</Label>
              <Select value={form.musteri_id} onValueChange={v => {
                const m = musteriler.find(mu => mu.id === v);
                setEdvli(m?.edv_odeyicisi || false);
                setForm(f => ({...f, musteri_id: v}));
              }}>
                <SelectTrigger><SelectValue placeholder="Müştəri seçin" /></SelectTrigger>
                <SelectContent>{musteriler.map(m => <SelectItem key={m.id} value={m.id}>{m.ad_soyad}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ara cəm (₼) *</Label><Input type="number" value={form.ara_cem} onChange={e => setForm(f => ({...f, ara_cem: e.target.value}))} /></div>
              <div><Label>Son ödəniş tarixi</Label><Input type="date" value={form.son_odenis_tarixi} onChange={e => setForm(f => ({...f, son_odenis_tarixi: e.target.value}))} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={edvli} onCheckedChange={setEdvli} />
              <Label>ƏDV tətbiq et (18%)</Label>
            </div>
            {edvli && form.ara_cem && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Ara cəm:</span><span>{parseFloat(form.ara_cem).toFixed(2)} ₼</span></div>
                <div className="flex justify-between"><span>ƏDV (18%):</span><span>{(parseFloat(form.ara_cem) * 0.18).toFixed(2)} ₼</span></div>
                <div className="flex justify-between font-semibold border-t pt-1"><span>Ümumi:</span><span>{(parseFloat(form.ara_cem) * 1.18).toFixed(2)} ₼</span></div>
              </div>
            )}
            <Button className="w-full" onClick={handleCreate}>Faktura yarat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}