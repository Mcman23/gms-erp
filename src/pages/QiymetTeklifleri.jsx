import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Printer } from "lucide-react";
import moment from "moment";

const STATUSLAR = ["Göndərilməyib", "Göndərilib", "Qəbul edildi", "Rədd edildi", "Müqaviləyə çevrildi"];
const STATUS_RENK = {
  "Göndərilməyib": "bg-gray-100 text-gray-700",
  "Göndərilib": "bg-blue-100 text-blue-700",
  "Qəbul edildi": "bg-green-100 text-green-700",
  "Rədd edildi": "bg-red-100 text-red-700",
  "Müqaviləyə çevrildi": "bg-purple-100 text-purple-700",
};
const XIDMETLER = ["Ev təmizliyi","Ofis təmizliyi","Pəncərə təmizliyi","Xalça yuma","Divan yuma","Tikintidən sonra","Dərin təmizlik","Mətbəx təmizliyi","Digər"];

export default function QiymetTeklifleri() {
  const [teklifler, setTeklifler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [printTeklif, setPrintTeklif] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({
    musteri_adi: "", musteri_telefon: "", voen: "", unvan: "",
    xidmet_tipi: "Ev təmizliyi", xidmet_aciklamasi: "", sahesi: "",
    ara_cem: "", edv_odeyicisi: false, qeydler: "", etibarliliq_muddeti: "", imza_telebedilir: false,
  });

  const edvMeblegi = form.edv_odeyicisi ? (parseFloat(form.ara_cem) || 0) * 0.18 : 0;
  const umumi = (parseFloat(form.ara_cem) || 0) + edvMeblegi;

  const fetchData = () => {
    base44.entities.QiymetTeklifi.list("-created_date", 100).catch(() => []).then(data => {
      setTeklifler(data); setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    const no = `TKL-${Date.now().toString().slice(-6)}`;
    await base44.entities.QiymetTeklifi.create({
      ...form,
      teklif_no: no,
      sahesi: parseFloat(form.sahesi) || 0,
      ara_cem: parseFloat(form.ara_cem) || 0,
      edv_faizi: form.edv_odeyicisi ? 18 : 0,
      edv_meblegi: edvMeblegi,
      umumi_mebleg: umumi,
      tarix: new Date().toISOString().slice(0, 10),
      status: "Göndərilməyib",
    });
    setShowDialog(false);
    setForm({ musteri_adi: "", musteri_telefon: "", voen: "", unvan: "", xidmet_tipi: "Ev təmizliyi", xidmet_aciklamasi: "", sahesi: "", ara_cem: "", edv_odeyicisi: false, qeydler: "", etibarliliq_muddeti: "", imza_telebedilir: false });
    fetchData();
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.QiymetTeklifi.update(id, { status });
    fetchData();
  };

  const filtered = filterStatus === "all" ? teklifler : teklifler.filter(t => t.status === filterStatus);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Qiymət Teklifləri</h1>
          <p className="text-muted-foreground text-sm mt-1">VÖEN · ƏDV 18% · İmza · Status</p>
        </div>
        <Button className="gap-2" onClick={() => setShowDialog(true)}><Plus className="w-4 h-4" /> Yeni Teklif</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>Hamısı</Button>
        {STATUSLAR.map(s => (
          <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"} onClick={() => setFilterStatus(s)}>{s}</Button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">№</th>
                <th className="text-left px-4 py-3 font-medium">Müştəri</th>
                <th className="text-left px-4 py-3 font-medium">Xidmət</th>
                <th className="text-left px-4 py-3 font-medium">Tarix</th>
                <th className="text-right px-4 py-3 font-medium">Məbləğ</th>
                <th className="text-right px-4 py-3 font-medium">ƏDV</th>
                <th className="text-right px-4 py-3 font-medium">Ümumi</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-t border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono font-medium">{t.teklif_no}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.musteri_adi}</p>
                    {t.voen && <p className="text-xs text-muted-foreground">VÖEN: {t.voen}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.xidmet_tipi}</td>
                  <td className="px-4 py-3">{t.tarix ? moment(t.tarix).format("DD.MM.YYYY") : "—"}</td>
                  <td className="px-4 py-3 text-right">{(t.ara_cem || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right text-purple-700">{(t.edv_meblegi || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right font-semibold">{(t.umumi_mebleg || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3">
                    <Select value={t.status} onValueChange={v => handleStatusChange(t.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-36">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_RENK[t.status] || ""}`}>{t.status}</span>
                      </SelectTrigger>
                      <SelectContent>{STATUSLAR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setPrintTeklif(t)}>
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Teklif tapılmadı</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Dialog */}
      {printTeklif && (
        <Dialog open={!!printTeklif} onOpenChange={() => setPrintTeklif(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Qiymət Teklifi — {printTeklif.teklif_no}</DialogTitle>
                <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" /> Çap et</Button>
              </div>
            </DialogHeader>
            <div className="bg-white border border-border rounded-xl p-8 text-sm space-y-4">
              <div className="flex justify-between">
                <div><h2 className="text-lg font-bold">CleanPro MMC</h2><p className="text-muted-foreground">Qiymət Teklifi</p></div>
                <div className="text-right"><p className="font-bold">{printTeklif.teklif_no}</p><p className="text-muted-foreground">{printTeklif.tarix ? moment(printTeklif.tarix).format("DD.MM.YYYY") : ""}</p></div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-semibold">{printTeklif.musteri_adi}</p>
                {printTeklif.voen && <p className="text-muted-foreground">VÖEN: {printTeklif.voen}</p>}
                {printTeklif.unvan && <p className="text-muted-foreground">{printTeklif.unvan}</p>}
              </div>
              <table className="w-full border-collapse border border-border text-sm">
                <thead className="bg-muted/30"><tr><th className="border border-border px-3 py-2 text-left">Xidmət</th><th className="border border-border px-3 py-2 text-right">Məbləğ</th></tr></thead>
                <tbody>
                  <tr><td className="border border-border px-3 py-2">{printTeklif.xidmet_tipi}{printTeklif.xidmet_aciklamasi ? ` — ${printTeklif.xidmet_aciklamasi}` : ""}</td><td className="border border-border px-3 py-2 text-right">{(printTeklif.ara_cem || 0).toFixed(2)} ₼</td></tr>
                  {printTeklif.edv_meblegi > 0 && <tr><td className="border border-border px-3 py-2 text-muted-foreground">ƏDV ({printTeklif.edv_faizi}%)</td><td className="border border-border px-3 py-2 text-right text-purple-700">+{(printTeklif.edv_meblegi || 0).toFixed(2)} ₼</td></tr>}
                  <tr className="bg-primary/10 font-bold"><td className="border border-border px-3 py-2">CƏMİ</td><td className="border border-border px-3 py-2 text-right">{(printTeklif.umumi_mebleg || 0).toFixed(2)} ₼</td></tr>
                </tbody>
              </table>
              {printTeklif.imza_telebedilir && (
                <div className="grid grid-cols-2 gap-10 mt-8 pt-4 border-t border-border text-xs text-muted-foreground">
                  <div>Sifarişçi: _______________________<br />Tarix: _______________</div>
                  <div>İcraçı: _______________________<br />Möhür: _______________</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Yeni Qiymət Teklifi</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Müştəri adı *</Label><Input value={form.musteri_adi} onChange={e => setForm(f => ({...f, musteri_adi: e.target.value}))} /></div>
              <div><Label>Telefon</Label><Input value={form.musteri_telefon} onChange={e => setForm(f => ({...f, musteri_telefon: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>VÖEN</Label><Input value={form.voen} onChange={e => setForm(f => ({...f, voen: e.target.value}))} /></div>
              <div><Label>Ünvan</Label><Input value={form.unvan} onChange={e => setForm(f => ({...f, unvan: e.target.value}))} /></div>
            </div>
            <div>
              <Label>Xidmət tipi</Label>
              <Select value={form.xidmet_tipi} onValueChange={v => setForm(f => ({...f, xidmet_tipi: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{XIDMETLER.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Xidmət açıqlaması</Label><Textarea value={form.xidmet_aciklamasi} onChange={e => setForm(f => ({...f, xidmet_aciklamasi: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sahəsi (m²)</Label><Input type="number" value={form.sahesi} onChange={e => setForm(f => ({...f, sahesi: e.target.value}))} /></div>
              <div><Label>Ara cəm (₼) *</Label><Input type="number" value={form.ara_cem} onChange={e => setForm(f => ({...f, ara_cem: e.target.value}))} /></div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={form.edv_odeyicisi} onCheckedChange={v => setForm(f => ({...f, edv_odeyicisi: v}))} /><Label>ƏDV ödəyicisi (18%)</Label></div>
            {form.edv_odeyicisi && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
                <div className="flex justify-between"><span>ƏDV məbləği:</span><span className="font-semibold text-purple-700">{edvMeblegi.toFixed(2)} ₼</span></div>
                <div className="flex justify-between font-bold mt-1"><span>Ümumi:</span><span>{umumi.toFixed(2)} ₼</span></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Etibarlılıq tarixi</Label><Input type="date" value={form.etibarliliq_muddeti} onChange={e => setForm(f => ({...f, etibarliliq_muddeti: e.target.value}))} /></div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={form.imza_telebedilir} onCheckedChange={v => setForm(f => ({...f, imza_telebedilir: v}))} /><Label>İmza tələb edilir</Label></div>
            <div><Label>Qeydlər</Label><Textarea value={form.qeydler} onChange={e => setForm(f => ({...f, qeydler: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleCreate}>Teklif yarat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}