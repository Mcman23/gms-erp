import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Printer, ChevronDown, ChevronUp, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";
import moment from "moment";
import DeleteButton from "@/components/DeleteButton";

const ODENIS_STATUS_COLORS = {
  "Gözlənilir": "bg-yellow-100 text-yellow-700",
  "Podratçıya Ödənilib": "bg-green-100 text-green-700",
  "Ləğv Edilib": "bg-red-100 text-red-700",
};

export default function PodratciHesabati() {
  const [podratcilar, setPodratcilar] = useState([]);
  const [sifarisler, setSifarisler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAy, setFilterAy] = useState("");
  const [filterIl, setFilterIl] = useState(new Date().getFullYear().toString());
  const [filterXidmet, setFilterXidmet] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [podratcilar2, setPodratcilar2] = useState([]);
  const [form, setForm] = useState({
    podratci_id: "", sifaris_no: "", xidmet_tarixi: "", xidmet_novu: "",
    isin_deyeri: "", odenis_statusu: "Gözlənilir", qeyd: ""
  });

  const fetchData = async () => {
    const [p, s, p2] = await Promise.all([
      base44.entities.PodratciSifarisi.list("-xidmet_tarixi", 200).catch(() => []),
      base44.entities.Sifaris.list().catch(() => []),
      base44.entities.Podratci.list().catch(() => []),
    ]);
    setSifarisler(s);
    setPodratcilar2(p2);

    // Merge with podratci names
    const merged = p.map(ps => ({
      ...ps,
      podratci_adi: ps.podratci_adi || p2.find(pp => pp.id === ps.podratci_id)?.ad || "—"
    }));
    setPodratcilar(merged);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredSifarisler = podratcilar.filter(ps => {
    if (filterAy && ps.xidmet_tarixi && !ps.xidmet_tarixi.startsWith(`${filterIl}-${filterAy}`)) return false;
    if (!filterAy && filterIl && ps.xidmet_tarixi && !ps.xidmet_tarixi.startsWith(filterIl)) return false;
    if (filterXidmet && ps.xidmet_novu !== filterXidmet) return false;
    return true;
  });

  // Group by podratci
  const podratciStats = podratcilar2.map(p => {
    const rows = filteredSifarisler.filter(ps => ps.podratci_id === p.id);
    const umumi_deyeri = rows.reduce((s, r) => s + (r.isin_deyeri || 0), 0);
    const podratci_payi = rows.reduce((s, r) => s + (r.podratci_payi || 0), 0);
    const sirket_qazanci = rows.reduce((s, r) => s + (r.sirkət_qazanci || r.sirket_qazanci || 0), 0);
    return { ...p, rows, is_sayi: rows.length, umumi_deyeri, podratci_payi, sirket_qazanci };
  }).filter(p => p.is_sayi > 0 || true);

  const totalDeyeri = podratciStats.reduce((s, p) => s + p.umumi_deyeri, 0);
  const totalPodratci = podratciStats.reduce((s, p) => s + p.podratci_payi, 0);
  const totalQazanc = podratciStats.reduce((s, p) => s + p.sirket_qazanci, 0);

  const handleAddSave = async () => {
    if (!form.podratci_id || !form.xidmet_tarixi || !form.isin_deyeri) return;
    const podratci = podratcilar2.find(p => p.id === form.podratci_id);
    const komissiya = podratci?.komissiya_faizi || 20;
    const isin_deyeri = parseFloat(form.isin_deyeri) || 0;
    const podratci_payi = parseFloat(((isin_deyeri * komissiya) / 100).toFixed(2));
    const sirket_qazanci = parseFloat((isin_deyeri - podratci_payi).toFixed(2));
    await base44.entities.PodratciSifarisi.create({
      ...form,
      isin_deyeri,
      podratci_payi,
      sirkət_qazanci: sirket_qazanci,
      podratci_adi: podratci?.ad || "",
    });
    setShowAddDialog(false);
    setForm({ podratci_id: "", sifaris_no: "", xidmet_tarixi: "", xidmet_novu: "", isin_deyeri: "", odenis_statusu: "Gözlənilir", qeyd: "" });
    fetchData();
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.PodratciSifarisi.update(id, { odenis_statusu: status });
    fetchData();
  };

  const handleDelete = async (id) => {
    await base44.entities.PodratciSifarisi.delete(id);
    fetchData();
  };

  const handlePrint = () => window.print();

  const xidmetNovleri = [...new Set(podratcilar.map(p => p.xidmet_novu).filter(Boolean))];
  const illər = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const aylar = [
    { value: "01", label: "Yanvar" }, { value: "02", label: "Fevral" }, { value: "03", label: "Mart" },
    { value: "04", label: "Aprel" }, { value: "05", label: "May" }, { value: "06", label: "İyun" },
    { value: "07", label: "İyul" }, { value: "08", label: "Avqust" }, { value: "09", label: "Sentyabr" },
    { value: "10", label: "Oktyabr" }, { value: "11", label: "Noyabr" }, { value: "12", label: "Dekabr" },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Podratçı Hesabatı</h1>
          <p className="text-muted-foreground text-sm mt-1">Podratçılar üzrə maliyyə analizi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2"><Printer className="w-4 h-4" /> Çap et</Button>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Yeni Qeyd</Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-blue-600" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Ümumi iş dəyəri</p>
            <p className="text-xl font-bold">{totalDeyeri.toFixed(2)} ₼</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-orange-600" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Podratçılara ödənən</p>
            <p className="text-xl font-bold">{totalPodratci.toFixed(2)} ₼</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Şirkətin qazancı</p>
            <p className="text-xl font-bold text-green-600">{totalQazanc.toFixed(2)} ₼</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-card border border-border rounded-xl p-4">
        <Select value={filterIl} onValueChange={setFilterIl}>
          <SelectTrigger className="w-28"><SelectValue placeholder="İl" /></SelectTrigger>
          <SelectContent>{illər.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterAy || "all"} onValueChange={v => setFilterAy(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Ay" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Bütün aylar</SelectItem>
            {aylar.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterXidmet || "all"} onValueChange={v => setFilterXidmet(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Xidmət növü" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Bütün növlər</SelectItem>
            {xidmetNovleri.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Main Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Podratçı adı</th>
                <th className="text-center px-4 py-3 font-medium">İş sayı</th>
                <th className="text-right px-4 py-3 font-medium">Ümumi dəyər</th>
                <th className="text-right px-4 py-3 font-medium">Podratçıya ödənən</th>
                <th className="text-right px-4 py-3 font-medium">Şirkət qazancı</th>
                <th className="text-center px-4 py-3 font-medium">Detallar</th>
              </tr>
            </thead>
            <tbody>
              {podratciStats.filter(p => p.is_sayi > 0).map(p => (
                <>
                  <tr key={p.id} className="border-t border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => setExpandedRow(expandedRow === p.id ? null : p.id)}>
                    <td className="px-4 py-3 font-medium">{p.ad}</td>
                    <td className="px-4 py-3 text-center">{p.is_sayi}</td>
                    <td className="px-4 py-3 text-right">{p.umumi_deyeri.toFixed(2)} ₼</td>
                    <td className="px-4 py-3 text-right text-orange-600">{p.podratci_payi.toFixed(2)} ₼</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{p.sirket_qazanci.toFixed(2)} ₼</td>
                    <td className="px-4 py-3 text-center">
                      {expandedRow === p.id ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}
                    </td>
                  </tr>
                  {expandedRow === p.id && (
                    <tr key={`${p.id}-detail`} className="bg-muted/30">
                      <td colSpan={6} className="px-4 pb-4 pt-2">
                        <div className="rounded-lg border border-border bg-card overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left px-3 py-2 font-medium">Sifariş</th>
                                <th className="text-left px-3 py-2 font-medium">Tarix</th>
                                <th className="text-left px-3 py-2 font-medium">Xidmət</th>
                                <th className="text-right px-3 py-2 font-medium">Dəyər</th>
                                <th className="text-right px-3 py-2 font-medium">Pod. payı</th>
                                <th className="text-right px-3 py-2 font-medium">Qazanc</th>
                                <th className="text-center px-3 py-2 font-medium">Status</th>
                                <th className="px-3 py-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.rows.map(r => (
                                <tr key={r.id} className="border-t border-border/50">
                                  <td className="px-3 py-2">{r.sifaris_no || "—"}</td>
                                  <td className="px-3 py-2">{r.xidmet_tarixi ? moment(r.xidmet_tarixi).format("DD.MM.YYYY") : "—"}</td>
                                  <td className="px-3 py-2">{r.xidmet_novu || "—"}</td>
                                  <td className="px-3 py-2 text-right">{(r.isin_deyeri || 0).toFixed(2)} ₼</td>
                                  <td className="px-3 py-2 text-right text-orange-600">{(r.podratci_payi || 0).toFixed(2)} ₼</td>
                                  <td className="px-3 py-2 text-right text-green-600">{(r.sirkət_qazanci || r.sirket_qazanci || 0).toFixed(2)} ₼</td>
                                  <td className="px-3 py-2 text-center">
                                    <Select value={r.odenis_statusu} onValueChange={v => handleStatusChange(r.id, v)}>
                                      <SelectTrigger className="h-6 text-xs w-40">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Gözlənilir">Gözlənilir</SelectItem>
                                        <SelectItem value="Podratçıya Ödənilib">Ödənilib</SelectItem>
                                        <SelectItem value="Ləğv Edilib">Ləğv Edilib</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="px-3 py-2">
                                    <DeleteButton onDelete={() => handleDelete(r.id)} size="sm" />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {podratciStats.filter(p => p.is_sayi > 0).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Məlumat tapılmadı</td></tr>
              )}
              {/* Footer totals */}
              {podratciStats.filter(p => p.is_sayi > 0).length > 0 && (
                <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                  <td className="px-4 py-3">Ümumi cəm</td>
                  <td className="px-4 py-3 text-center">{filteredSifarisler.length}</td>
                  <td className="px-4 py-3 text-right">{totalDeyeri.toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right text-orange-600">{totalPodratci.toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right text-green-600">{totalQazanc.toFixed(2)} ₼</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Yeni Podratçı Sifarişi</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Podratçı *</Label>
              <Select value={form.podratci_id} onValueChange={v => setForm(f => ({...f, podratci_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Podratçı seçin" /></SelectTrigger>
                <SelectContent>{podratcilar2.map(p => <SelectItem key={p.id} value={p.id}>{p.ad}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sifariş nömrəsi</Label><Input value={form.sifaris_no} onChange={e => setForm(f => ({...f, sifaris_no: e.target.value}))} /></div>
              <div><Label>Xidmət tarixi *</Label><Input type="date" value={form.xidmet_tarixi} onChange={e => setForm(f => ({...f, xidmet_tarixi: e.target.value}))} /></div>
            </div>
            <div><Label>Xidmət növü</Label><Input value={form.xidmet_novu} onChange={e => setForm(f => ({...f, xidmet_novu: e.target.value}))} placeholder="Ev təmizliyi..." /></div>
            <div><Label>İşin dəyəri (₼) *</Label><Input type="number" value={form.isin_deyeri} onChange={e => setForm(f => ({...f, isin_deyeri: e.target.value}))} /></div>
            {form.podratci_id && form.isin_deyeri && (
              <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Komissiya faizi:</span><span>{podratcilar2.find(p => p.id === form.podratci_id)?.komissiya_faizi || 20}%</span></div>
                <div className="flex justify-between text-orange-600"><span>Podratçı payı:</span><span>{((parseFloat(form.isin_deyeri) || 0) * (podratcilar2.find(p => p.id === form.podratci_id)?.komissiya_faizi || 20) / 100).toFixed(2)} ₼</span></div>
                <div className="flex justify-between text-green-600 font-semibold"><span>Şirkət qazancı:</span><span>{((parseFloat(form.isin_deyeri) || 0) * (1 - (podratcilar2.find(p => p.id === form.podratci_id)?.komissiya_faizi || 20) / 100)).toFixed(2)} ₼</span></div>
              </div>
            )}
            <div>
              <Label>Ödəniş statusu</Label>
              <Select value={form.odenis_statusu} onValueChange={v => setForm(f => ({...f, odenis_statusu: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gözlənilir">Gözlənilir</SelectItem>
                  <SelectItem value="Podratçıya Ödənilib">Podratçıya Ödənilib</SelectItem>
                  <SelectItem value="Ləğv Edilib">Ləğv Edilib</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddSave}>Yadda saxla</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}