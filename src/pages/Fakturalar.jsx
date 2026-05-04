import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import moment from "moment";
import DeleteButton from "../components/DeleteButton";
import { useAdmin } from "../hooks/useAdmin";

const TIP_COLORS = {
  "Satış": "bg-blue-100 text-blue-700",
  "Alış": "bg-purple-100 text-purple-700",
};

export default function Fakturalar() {
  const isAdmin = useAdmin();
  const [fakturalar, setFakturalar] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [edvli, setEdvli] = useState(false);
  const [filterTip, setFilterTip] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({
    musteri_id: "", ara_cem: "", son_odenis_tarixi: "",
    qeydler: "", tip: "Satış", xidmet_tipi: ""
  });

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
    const umumi = araCem + edvMeblegi;
    const tarix = new Date().toISOString().slice(0, 10);

    const faktura = await base44.entities.Faktura.create({
      faktura_no: fakturaNo,
      musteri_id: form.musteri_id,
      musteri_adi: musteri?.ad_soyad || "",
      tarix,
      son_odenis_tarixi: form.son_odenis_tarixi,
      ara_cem: araCem,
      edv_faizi: edvFaizi,
      edv_meblegi: edvMeblegi,
      umumi_mebleg: umumi,
      odenis_statusu: "Ödənilməyib",
      odenilmis_mebleg: 0,
      qeydler: form.qeydler,
      tip: form.tip || "Satış",
      xidmet_tipi: form.xidmet_tipi,
    });

    // Satış fakturası olarsa → Debitor (müştəri bizə borcludur)
    if ((form.tip || "Satış") === "Satış") {
      base44.entities.Kreditor.create({
        faktura_id: faktura.id,
        faktura_no: fakturaNo,
        musteri_id: form.musteri_id,
        musteri_adi: musteri?.ad_soyad || "",
        tarix,
        son_odenis_tarixi: form.son_odenis_tarixi,
        ara_cem: araCem,
        edv_faizi: edvFaizi,
        edv_meblegi: edvMeblegi,
        umumi_mebleg: umumi,
        odenilmis_mebleg: 0,
        odenis_statusu: "Ödənilməyib",
        xidmet_tipi: form.xidmet_tipi,
        qeydler: form.qeydler,
      }).catch(() => {});
    }

    setShowDialog(false);
    setForm({ musteri_id: "", ara_cem: "", son_odenis_tarixi: "", qeydler: "", tip: "Satış", xidmet_tipi: "" });
    setEdvli(false);
    fetchData();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const filtered = fakturalar.filter(f => {
    const tipOk = filterTip === "all" || (f.tip || "Satış") === filterTip;
    const statusOk = filterStatus === "all" || f.odenis_statusu === filterStatus;
    return tipOk && statusOk;
  });

  const totalBorc = fakturalar
    .filter(f => f.odenis_statusu !== "Ödənilib")
    .reduce((s, f) => s + (f.umumi_mebleg || 0) - (f.odenilmis_mebleg || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fakturalar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {fakturalar.length} faktura • Ödənilməmiş: {totalBorc.toFixed(2)} ₼
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Yeni Faktura
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex gap-1">
          {["all", "Satış", "Alış"].map(t => (
            <Button key={t} size="sm" variant={filterTip === t ? "default" : "outline"}
              onClick={() => setFilterTip(t)}>
              {t === "all" ? "Hamısı" : t}
            </Button>
          ))}
        </div>
        <div className="w-px h-5 bg-border mx-1" />
        <div className="flex gap-1">
          {["all", "Ödənilməyib", "Qismən ödənilib", "Ödənilib"].map(s => (
            <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"}
              onClick={() => setFilterStatus(s)}>
              {s === "all" ? "Bütün statuslar" : s}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Faktura №</th>
              <th className="text-left px-4 py-3 font-medium">Tip</th>
              <th className="text-left px-4 py-3 font-medium">Müştəri</th>
              <th className="text-left px-4 py-3 font-medium">Xidmət</th>
              <th className="text-left px-4 py-3 font-medium">Tarix</th>
              <th className="text-right px-4 py-3 font-medium">Ara cəm</th>
              <th className="text-right px-4 py-3 font-medium">ƏDV</th>
              <th className="text-right px-4 py-3 font-medium">Ümumi</th>
              <th className="text-right px-4 py-3 font-medium">Ödənilib</th>
              <th className="text-right px-4 py-3 font-medium">Qalıq</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => {
              const qalig = Math.max(0, (f.umumi_mebleg || 0) - (f.odenilmis_mebleg || 0));
              return (
                <tr key={f.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium font-mono text-xs">{f.faktura_no}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIP_COLORS[f.tip || "Satış"]}`}>
                      {f.tip || "Satış"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{f.musteri_adi}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{f.xidmet_tipi || "—"}</td>
                  <td className="px-4 py-3">{f.tarix ? moment(f.tarix).format("DD.MM.YYYY") : "—"}</td>
                  <td className="px-4 py-3 text-right">{(f.ara_cem || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {f.edv_faizi ? `${f.edv_faizi}% (${(f.edv_meblegi || 0).toFixed(2)} ₼)` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{(f.umumi_mebleg || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right text-green-600">{(f.odenilmis_mebleg || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <span className={qalig > 0 ? "text-red-600" : "text-green-600"}>{qalig.toFixed(2)} ₼</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      f.odenis_statusu === "Ödənilib" ? "bg-green-100 text-green-700" :
                      f.odenis_statusu === "Qismən ödənilib" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>{f.odenis_statusu || "Ödənilməyib"}</span>
                  </td>
                  <td className="px-2 py-3">
                    {isAdmin && (
                      <DeleteButton onDelete={async () => { await base44.entities.Faktura.delete(f.id); fetchData(); }} />
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">Faktura tapılmadı</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Faktura</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Tip seçimi */}
            <div>
              <Label>Faktura tipi *</Label>
              <div className="flex gap-2 mt-1">
                {["Satış", "Alış"].map(t => (
                  <button key={t}
                    onClick={() => setForm(f => ({ ...f, tip: t }))}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${form.tip === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/50"}`}>
                    {t === "Satış" ? "📤 Satış (Debitor)" : "📥 Alış (Kreditor)"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {form.tip === "Satış" ? "Müştəri bizə borclu olacaq → Debitor siyahısına düşür" : "Biz kiminsə məhsulunu/xidmətini aldıq → Kreditor siyahısına düşür"}
              </p>
            </div>

            <div>
              <Label>Müştəri / Təchizatçı *</Label>
              <Select value={form.musteri_id} onValueChange={v => {
                const m = musteriler.find(mu => mu.id === v);
                setEdvli(m?.edv_odeyicisi || false);
                setForm(f => ({ ...f, musteri_id: v }));
              }}>
                <SelectTrigger><SelectValue placeholder="Müştəri seçin" /></SelectTrigger>
                <SelectContent>{musteriler.map(m => <SelectItem key={m.id} value={m.id}>{m.ad_soyad}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <Label>Xidmət / Məhsul adı</Label>
              <Input
                value={form.xidmet_tipi}
                onChange={e => setForm(f => ({ ...f, xidmet_tipi: e.target.value }))}
                placeholder="Məs: Ofis təmizliyi, Material alışı..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ara cəm (₼) *</Label><Input type="number" value={form.ara_cem} onChange={e => setForm(f => ({ ...f, ara_cem: e.target.value }))} /></div>
              <div><Label>Son ödəniş tarixi</Label><Input type="date" value={form.son_odenis_tarixi} onChange={e => setForm(f => ({ ...f, son_odenis_tarixi: e.target.value }))} /></div>
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

            <Button className="w-full" onClick={handleCreate} disabled={!form.musteri_id || !form.ara_cem}>
              Faktura yarat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}