import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Printer, Trash2 } from "lucide-react";
import moment from "moment";
import DeleteButton from "../components/DeleteButton";
import { useAdmin } from "../hooks/useAdmin";

const STATUSLAR = ["Gonderilmeyib", "Gonderilib", "Qebul edildi", "Redd edildi", "Muqavilеye cevrildi"];
const STATUS_RENK = {
  "Gonderilmeyib": "bg-gray-100 text-gray-700",
  "Gonderilib": "bg-blue-100 text-blue-700",
  "Qebul edildi": "bg-green-100 text-green-700",
  "Redd edildi": "bg-red-100 text-red-700",
  "Muqavilеye cevrildi": "bg-purple-100 text-purple-700",
};
const XIDMETLER = ["Ev temizliyi","Ofis temizliyi","Pencere temizliyi","Xalca yuma","Divan yuma","Tikintiden sonra","Derin temizlik","Metbex temizliyi","Diger"];

const BOSH_XIDMET = { ad: "", vahid_qiymet: "", miqdar: "1", mebleg: "" };

export default function QiymetTeklifleri() {
  const isAdmin = useAdmin();
  const [teklifler, setTeklifler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [printTeklif, setPrintTeklif] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({
    musteri_adi: "", musteri_telefon: "", voen: "", unvan: "",
    xidmet_tipi: "Ev temizliyi", xidmet_aciklamasi: "",
    edv_odeyicisi: false, qeydler: "", etibarliliq_muddeti: "", imza_telebedilir: false,
    xidmetler: [{ ...BOSH_XIDMET }],
  });

  const xidmetlerCemi = form.xidmetler.reduce((s, x) => s + (parseFloat(x.mebleg) || (parseFloat(x.vahid_qiymet) || 0) * (parseFloat(x.miqdar) || 1)), 0);
  const edvMeblegi = form.edv_odeyicisi ? xidmetlerCemi * 0.18 : 0;
  const umumi = xidmetlerCemi + edvMeblegi;

  const fetchData = () => {
    base44.entities.QiymetTeklifi.list("-created_date", 100).catch(() => []).then(data => {
      setTeklifler(data); setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const addXidmet = () => setForm(f => ({ ...f, xidmetler: [...f.xidmetler, { ...BOSH_XIDMET }] }));
  const removeXidmet = (i) => setForm(f => ({ ...f, xidmetler: f.xidmetler.filter((_, idx) => idx !== i) }));
  const updateXidmet = (i, key, val) => setForm(f => {
    const xs = [...f.xidmetler];
    xs[i] = { ...xs[i], [key]: val };
    if (key === "vahid_qiymet" || key === "miqdar") {
      xs[i].mebleg = ((parseFloat(xs[i].vahid_qiymet) || 0) * (parseFloat(xs[i].miqdar) || 1)).toFixed(2);
    }
    return { ...f, xidmetler: xs };
  });

  const handleCreate = async () => {
    const no = `TKL-${Date.now().toString().slice(-6)}`;
    const aciklama = form.xidmetler.map(x => x.ad).filter(Boolean).join(", ") || form.xidmet_tipi;
    await base44.entities.QiymetTeklifi.create({
      teklif_no: no,
      musteri_adi: form.musteri_adi,
      musteri_telefon: form.musteri_telefon,
      voen: form.voen,
      unvan: form.unvan,
      xidmet_tipi: form.xidmet_tipi,
      xidmet_aciklamasi: aciklama,
      ara_cem: xidmetlerCemi,
      edv_faizi: form.edv_odeyicisi ? 18 : 0,
      edv_meblegi: edvMeblegi,
      umumi_mebleg: umumi,
      edv_odeyicisi: form.edv_odeyicisi,
      tarix: new Date().toISOString().slice(0, 10),
      etibarliliq_muddeti: form.etibarliliq_muddeti,
      imza_telebedilir: form.imza_telebedilir,
      status: "Gonderilmeyib",
      qeydler: form.qeydler,
    });
    setShowDialog(false);
    setForm({ musteri_adi: "", musteri_telefon: "", voen: "", unvan: "", xidmet_tipi: "Ev temizliyi", xidmet_aciklamasi: "", edv_odeyicisi: false, qeydler: "", etibarliliq_muddeti: "", imza_telebedilir: false, xidmetler: [{ ...BOSH_XIDMET }] });
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
          <h1 className="text-2xl font-bold tracking-tight">Qiymet Teklifleri</h1>
          <p className="text-muted-foreground text-sm mt-1">VOEN · EDV 18% · Imza · Status</p>
        </div>
        <Button className="gap-2" onClick={() => setShowDialog(true)}><Plus className="w-4 h-4" /> Yeni Teklif</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>Hamisi</Button>
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
                <th className="text-left px-4 py-3 font-medium">Musteri</th>
                <th className="text-left px-4 py-3 font-medium">Xidmet</th>
                <th className="text-left px-4 py-3 font-medium">Tarix</th>
                <th className="text-right px-4 py-3 font-medium">Ara cem</th>
                <th className="text-right px-4 py-3 font-medium">EDV</th>
                <th className="text-right px-4 py-3 font-medium">Umumi</th>
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
                    {t.voen && <p className="text-xs text-muted-foreground">VOEN: {t.voen}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">{t.xidmet_aciklamasi || t.xidmet_tipi}</td>
                  <td className="px-4 py-3">{t.tarix ? moment(t.tarix).format("DD.MM.YYYY") : "—"}</td>
                  <td className="px-4 py-3 text-right">{(t.ara_cem || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right text-purple-700">{(t.edv_meblegi || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right font-semibold">{(t.umumi_mebleg || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3">
                    <Select value={t.status} onValueChange={v => handleStatusChange(t.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-36">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_RENK[t.status] || "bg-gray-100 text-gray-700"}`}>{t.status}</span>
                      </SelectTrigger>
                      <SelectContent>{STATUSLAR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setPrintTeklif(t)}>
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                      {isAdmin && <DeleteButton onDelete={async () => { await base44.entities.QiymetTeklifi.delete(t.id); fetchData(); }} />}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Teklif tapilmadi</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Dialog — Temiz, linksiz */}
      {printTeklif && (
        <Dialog open={!!printTeklif} onOpenChange={() => setPrintTeklif(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Qiymet Teklifi — {printTeklif.teklif_no}</DialogTitle>
                <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" /> Cap et</Button>
              </div>
            </DialogHeader>
            <div className="bg-white border border-border rounded-xl p-8 text-sm space-y-4" id="print-area">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-bold">GMS ERP</h2>
                  <p className="text-muted-foreground">Qiymet Teklifi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{printTeklif.teklif_no}</p>
                  <p className="text-muted-foreground">{printTeklif.tarix ? moment(printTeklif.tarix).format("DD.MM.YYYY") : ""}</p>
                  {printTeklif.etibarliliq_muddeti && <p className="text-xs text-muted-foreground">Etibarliliq: {moment(printTeklif.etibarliliq_muddeti).format("DD.MM.YYYY")}</p>}
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-semibold text-base">{printTeklif.musteri_adi}</p>
                {printTeklif.voen && <p className="text-muted-foreground">VOEN: {printTeklif.voen}</p>}
                {printTeklif.musteri_telefon && <p className="text-muted-foreground">{printTeklif.musteri_telefon}</p>}
                {printTeklif.unvan && <p className="text-muted-foreground">{printTeklif.unvan}</p>}
              </div>
              <table className="w-full border-collapse border border-border text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="border border-border px-3 py-2 text-left">Xidmet</th>
                    <th className="border border-border px-3 py-2 text-right">Meblег</th>
                  </tr>
                </thead>
                <tbody>
                  {(printTeklif.xidmet_aciklamasi || printTeklif.xidmet_tipi).split(",").map((x, i) => (
                    <tr key={i}><td className="border border-border px-3 py-2">{x.trim()}</td><td className="border border-border px-3 py-2 text-right">—</td></tr>
                  ))}
                  <tr><td className="border border-border px-3 py-2 text-muted-foreground">Ara cem</td><td className="border border-border px-3 py-2 text-right">{(printTeklif.ara_cem || 0).toFixed(2)} ₼</td></tr>
                  {printTeklif.edv_meblegi > 0 && <tr><td className="border border-border px-3 py-2 text-muted-foreground">EDV ({printTeklif.edv_faizi}%)</td><td className="border border-border px-3 py-2 text-right text-purple-700">+{(printTeklif.edv_meblegi || 0).toFixed(2)} ₼</td></tr>}
                  <tr className="bg-primary/10 font-bold"><td className="border border-border px-3 py-2">CEMİ</td><td className="border border-border px-3 py-2 text-right">{(printTeklif.umumi_mebleg || 0).toFixed(2)} ₼</td></tr>
                </tbody>
              </table>
              {printTeklif.qeydler && <p className="text-xs text-muted-foreground border-t border-border pt-3">Qeyd: {printTeklif.qeydler}</p>}
              {printTeklif.imza_telebedilir && (
                <div className="grid grid-cols-2 gap-10 mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
                  <div>Sifarisc: _______________________<br />Tarix: _______________</div>
                  <div>Icraçi: _______________________<br />Mohur: _______________</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Yeni Qiymet Teklifi</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Musteri adi *</Label><Input value={form.musteri_adi} onChange={e => setForm(f => ({...f, musteri_adi: e.target.value}))} /></div>
              <div><Label>Telefon</Label><Input value={form.musteri_telefon} onChange={e => setForm(f => ({...f, musteri_telefon: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>VOEN</Label><Input value={form.voen} onChange={e => setForm(f => ({...f, voen: e.target.value}))} /></div>
              <div><Label>Unvan</Label><Input value={form.unvan} onChange={e => setForm(f => ({...f, unvan: e.target.value}))} /></div>
            </div>
            <div>
              <Label>Esas xidmet kateqoriyasi</Label>
              <Select value={form.xidmet_tipi} onValueChange={v => setForm(f => ({...f, xidmet_tipi: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{XIDMETLER.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Çoxlu xidmet bolmeleri */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Xidmetler ve Qiymetler</Label>
                <Button size="sm" variant="outline" onClick={addXidmet} className="gap-1 h-7 text-xs"><Plus className="w-3.5 h-3.5" /> Xidmet elave et</Button>
              </div>
              {form.xidmetler.map((x, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Xidmet {i + 1}</span>
                    {form.xidmetler.length > 1 && (
                      <button onClick={() => removeXidmet(i)} className="text-muted-foreground hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                  <div><Label className="text-xs">Xidmet adi / Acıqlama</Label><Input className="h-8" value={x.ad} onChange={e => updateXidmet(i, "ad", e.target.value)} placeholder="Meselen: Ev temizliyi 80 m²" /></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-xs">Vahid qiymet (₼)</Label><Input className="h-8" type="number" value={x.vahid_qiymet} onChange={e => updateXidmet(i, "vahid_qiymet", e.target.value)} placeholder="0" /></div>
                    <div><Label className="text-xs">Miqdar</Label><Input className="h-8" type="number" value={x.miqdar} onChange={e => updateXidmet(i, "miqdar", e.target.value)} placeholder="1" /></div>
                    <div><Label className="text-xs">Meblег (₼)</Label><Input className="h-8" type="number" value={x.mebleg} onChange={e => updateXidmet(i, "mebleg", e.target.value)} placeholder="0" /></div>
                  </div>
                </div>
              ))}
              <div className="bg-muted/30 rounded-lg px-4 py-2 flex justify-between text-sm font-semibold">
                <span>Xidmetler cemi</span>
                <span>{xidmetlerCemi.toFixed(2)} ₼</span>
              </div>
            </div>

            <div className="flex items-center gap-3"><Switch checked={form.edv_odeyicisi} onCheckedChange={v => setForm(f => ({...f, edv_odeyicisi: v}))} /><Label>EDV odeyicisi (18%)</Label></div>
            {form.edv_odeyicisi && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
                <div className="flex justify-between"><span>EDV meblegi:</span><span className="font-semibold text-purple-700">{edvMeblegi.toFixed(2)} ₼</span></div>
                <div className="flex justify-between font-bold mt-1"><span>Umumi:</span><span>{umumi.toFixed(2)} ₼</span></div>
              </div>
            )}
            {!form.edv_odeyicisi && <div className="bg-muted/30 rounded-lg px-4 py-2 flex justify-between text-sm font-bold"><span>Umumi:</span><span>{umumi.toFixed(2)} ₼</span></div>}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Etibarlılıq tarixi</Label><Input type="date" value={form.etibarliliq_muddeti} onChange={e => setForm(f => ({...f, etibarliliq_muddeti: e.target.value}))} /></div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={form.imza_telebedilir} onCheckedChange={v => setForm(f => ({...f, imza_telebedilir: v}))} /><Label>Imza telebedilir</Label></div>
            <div><Label>Qeydler</Label><Textarea value={form.qeydler} onChange={e => setForm(f => ({...f, qeydler: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleCreate}>Teklif yarat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}