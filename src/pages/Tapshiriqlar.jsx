import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, CheckCircle2, Clock, AlertTriangle, BarChart2, User, Calendar } from "lucide-react";
import moment from "moment";
import DeleteButton from "../components/DeleteButton";
import { useAdmin } from "../hooks/useAdmin";

const PRIORITET_COLORS = {
  "Aşağı": "bg-slate-100 text-slate-600",
  "Orta": "bg-blue-100 text-blue-700",
  "Yüksək": "bg-orange-100 text-orange-700",
  "Kritik": "bg-red-100 text-red-700",
};

const STATUS_COLORS = {
  "Gözləyir": "bg-yellow-100 text-yellow-700",
  "İcrada": "bg-blue-100 text-blue-700",
  "Tamamlandı": "bg-green-100 text-green-700",
  "Ləğv edildi": "bg-red-100 text-red-700",
};

const KATEQORIYALAR = ["Əməliyyat", "Texniki", "İnzibati", "Satış", "HR", "Maliyyə", "Digər"];
const STATUSLAR = ["Gözləyir", "İcrada", "Tamamlandı", "Ləğv edildi"];
const PRIORITETLER = ["Aşağı", "Orta", "Yüksək", "Kritik"];

const DEFAULT_FORM = {
  bashliq: "", aciklama: "", isci_id: "", isci_adi: "", kateqoriya: "Əməliyyat",
  prioritet: "Orta", status: "Gözləyir", son_tarix: "", qeydler: "", faiz: 0
};

export default function Tapshiriqlar() {
  const isAdmin = useAdmin();
  const [tapshiriqlar, setTapshiriqlar] = useState([]);
  const [isciler, setIsciler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterIsci, setFilterIsci] = useState("all");
  const [tab, setTab] = useState("list"); // list | report

  const fetchData = async () => {
    const [t, i] = await Promise.all([
      base44.entities.Tapshiriq.list("-created_date", 200),
      base44.entities.Isci.filter({ status: "Aktiv" }),
    ]);
    setTapshiriqlar(t);
    setIsciler(i);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setForm(DEFAULT_FORM); setEditItem(null); setShowDialog(true); };
  const openEdit = (t) => { setForm({ ...DEFAULT_FORM, ...t }); setEditItem(t); setShowDialog(true); };

  const handleSave = async () => {
    const isci = isciler.find(i => i.id === form.isci_id);
    const data = { ...form, isci_adi: isci?.ad_soyad || form.isci_adi, faiz: parseInt(form.faiz) || 0 };
    if (editItem) {
      if (data.status === "Tamamlandı" && !editItem.tamamlanma_tarixi) {
        data.tamamlanma_tarixi = new Date().toISOString();
      }
      await base44.entities.Tapshiriq.update(editItem.id, data);
    } else {
      await base44.entities.Tapshiriq.create(data);
    }
    setShowDialog(false);
    fetchData();
  };

  const handleStatusChange = async (id, newStatus) => {
    const update = { status: newStatus };
    if (newStatus === "Tamamlandı") update.tamamlanma_tarixi = new Date().toISOString();
    await base44.entities.Tapshiriq.update(id, update);
    setTapshiriqlar(prev => prev.map(t => t.id === id ? { ...t, ...update } : t));
  };

  const filtered = tapshiriqlar.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterIsci !== "all" && t.isci_id !== filterIsci) return false;
    return true;
  });

  // Hesabat məlumatları
  const stats = {
    umumi: tapshiriqlar.length,
    gozleyir: tapshiriqlar.filter(t => t.status === "Gözləyir").length,
    icrada: tapshiriqlar.filter(t => t.status === "İcrada").length,
    tamamlandi: tapshiriqlar.filter(t => t.status === "Tamamlandı").length,
    legv: tapshiriqlar.filter(t => t.status === "Ləğv edildi").length,
    vaxtKecmis: tapshiriqlar.filter(t =>
      t.son_tarix && t.status !== "Tamamlandı" && t.status !== "Ləğv edildi" &&
      moment(t.son_tarix).isBefore(moment(), "day")
    ).length,
  };

  const isciStats = isciler.map(i => ({
    ...i,
    umumi: tapshiriqlar.filter(t => t.isci_id === i.id).length,
    tamamlandi: tapshiriqlar.filter(t => t.isci_id === i.id && t.status === "Tamamlandı").length,
    icrada: tapshiriqlar.filter(t => t.isci_id === i.id && t.status === "İcrada").length,
    gozleyir: tapshiriqlar.filter(t => t.isci_id === i.id && t.status === "Gözləyir").length,
  })).filter(i => i.umumi > 0).sort((a, b) => b.umumi - a.umumi);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" /> Tapşırıqlar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{tapshiriqlar.length} tapşırıq</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "list" ? "default" : "outline"} size="sm" onClick={() => setTab("list")}>
            <ClipboardList className="w-4 h-4 mr-1" /> Siyahı
          </Button>
          <Button variant={tab === "report" ? "default" : "outline"} size="sm" onClick={() => setTab("report")}>
            <BarChart2 className="w-4 h-4 mr-1" /> Hesabat
          </Button>
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Yeni Tapşırıq</Button>
        </div>
      </div>

      {/* KPI Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Ümumi", value: stats.umumi, color: "text-foreground", bg: "bg-card" },
          { label: "Gözləyir", value: stats.gozleyir, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "İcrada", value: stats.icrada, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Tamamlandı", value: stats.tamamlandi, color: "text-green-600", bg: "bg-green-50" },
          { label: "Ləğv edildi", value: stats.legv, color: "text-red-500", bg: "bg-red-50" },
          { label: "Vaxtı keçmiş", value: stats.vaxtKecmis, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(k => (
          <div key={k.label} className={`${k.bg} border border-border rounded-xl p-4`}>
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {tab === "list" && (
        <>
          {/* Filterlər */}
          <div className="flex gap-2 flex-wrap items-center">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bütün statuslar</SelectItem>
                {STATUSLAR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterIsci} onValueChange={setFilterIsci}>
              <SelectTrigger className="w-48 h-8 text-sm"><SelectValue placeholder="İşçi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bütün işçilər</SelectItem>
                {isciler.map(i => <SelectItem key={i.id} value={i.id}>{i.ad_soyad}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filtered.length} nəticə</span>
          </div>

          {/* Cədvəl */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Tapşırıq</th>
                    <th className="text-left px-4 py-3 font-medium">İşçi</th>
                    <th className="text-left px-4 py-3 font-medium">Kateqoriya</th>
                    <th className="text-left px-4 py-3 font-medium">Prioritet</th>
                    <th className="text-left px-4 py-3 font-medium">Son tarix</th>
                    <th className="text-left px-4 py-3 font-medium">İcra %</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const isVaxtKecmis = t.son_tarix && t.status !== "Tamamlandı" && t.status !== "Ləğv edildi" && moment(t.son_tarix).isBefore(moment(), "day");
                    return (
                      <tr key={t.id} className="border-t border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <button onClick={() => openEdit(t)} className="text-left hover:text-primary transition-colors">
                            <p className="font-medium">{t.bashliq}</p>
                            {t.aciklama && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.aciklama}</p>}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{t.isci_adi || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{t.kateqoriya || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITET_COLORS[t.prioritet] || ""}`}>{t.prioritet}</span>
                        </td>
                        <td className="px-4 py-3">
                          {t.son_tarix ? (
                            <div className={`flex items-center gap-1 text-xs ${isVaxtKecmis ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                              {isVaxtKecmis && <AlertTriangle className="w-3.5 h-3.5" />}
                              <Calendar className="w-3.5 h-3.5" />
                              {moment(t.son_tarix).format("DD.MM.YYYY")}
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${t.faiz || 0}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{t.faiz || 0}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Select value={t.status} onValueChange={v => handleStatusChange(t.id, v)}>
                            <SelectTrigger className="h-7 text-xs w-32 border-0 shadow-none p-0 focus:ring-0">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || ""}`}>{t.status}</span>
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSLAR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          {isAdmin && <DeleteButton onDelete={async () => { await base44.entities.Tapshiriq.delete(t.id); fetchData(); }} />}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Tapşırıq tapılmadı</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "report" && (
        <div className="space-y-6">
          {/* İşçi üzrə hesabat */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> İşçi üzrə tapşırıq icması
            </h2>
            {isciStats.length === 0 ? (
              <p className="text-muted-foreground text-sm">Hələ tapşırıq yoxdur.</p>
            ) : (
              <div className="space-y-3">
                {isciStats.map(i => {
                  const tamamFaiz = i.umumi > 0 ? Math.round((i.tamamlandi / i.umumi) * 100) : 0;
                  return (
                    <div key={i.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div className="w-40">
                        <p className="font-medium text-sm">{i.ad_soyad}</p>
                        <p className="text-xs text-muted-foreground">{i.vezife}</p>
                      </div>
                      <div className="flex gap-4 text-xs flex-1 flex-wrap">
                        <span className="text-foreground"><span className="font-semibold">{i.umumi}</span> ümumi</span>
                        <span className="text-green-600"><span className="font-semibold">{i.tamamlandi}</span> tamamlandı</span>
                        <span className="text-blue-600"><span className="font-semibold">{i.icrada}</span> icrada</span>
                        <span className="text-yellow-600"><span className="font-semibold">{i.gozleyir}</span> gözləyir</span>
                      </div>
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${tamamFaiz}%` }} />
                        </div>
                        <span className="text-xs font-medium w-8 text-right">{tamamFaiz}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tamamlanmış tapşırıqlar */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> Tamamlanmış tapşırıqlar
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Tapşırıq</th>
                    <th className="text-left px-4 py-3 font-medium">İşçi</th>
                    <th className="text-left px-4 py-3 font-medium">Kateqoriya</th>
                    <th className="text-left px-4 py-3 font-medium">Prioritet</th>
                    <th className="text-left px-4 py-3 font-medium">Tamamlanma tarixi</th>
                  </tr>
                </thead>
                <tbody>
                  {tapshiriqlar.filter(t => t.status === "Tamamlandı").map(t => (
                    <tr key={t.id} className="border-t border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{t.bashliq}</td>
                      <td className="px-4 py-3">{t.isci_adi || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{t.kateqoriya || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITET_COLORS[t.prioritet] || ""}`}>{t.prioritet}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {t.tamamlanma_tarixi ? moment(t.tamamlanma_tarixi).format("DD.MM.YYYY HH:mm") : "—"}
                      </td>
                    </tr>
                  ))}
                  {tapshiriqlar.filter(t => t.status === "Tamamlandı").length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Hələ tamamlanmış tapşırıq yoxdur</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Tapşırığı Düzəlt" : "Yeni Tapşırıq"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <Label>Tapşırıq başlığı *</Label>
              <Input value={form.bashliq} onChange={e => setForm(f => ({ ...f, bashliq: e.target.value }))} placeholder="Tapşırığın qısa adı" />
            </div>
            <div>
              <Label>Açıqlama</Label>
              <Textarea value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} placeholder="Ətraflı açıqlama..." rows={3} />
            </div>
            <div>
              <Label>İşçi *</Label>
              <Select value={form.isci_id} onValueChange={v => setForm(f => ({ ...f, isci_id: v }))}>
                <SelectTrigger><SelectValue placeholder="İşçi seçin" /></SelectTrigger>
                <SelectContent>
                  {isciler.map(i => <SelectItem key={i.id} value={i.id}>{i.ad_soyad} — {i.vezife}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kateqoriya</Label>
                <Select value={form.kateqoriya} onValueChange={v => setForm(f => ({ ...f, kateqoriya: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{KATEQORIYALAR.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioritet</Label>
                <Select value={form.prioritet} onValueChange={v => setForm(f => ({ ...f, prioritet: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITETLER.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Son tarix</Label>
                <Input type="date" value={form.son_tarix} onChange={e => setForm(f => ({ ...f, son_tarix: e.target.value }))} />
              </div>
              <div>
                <Label>İcra faizi (%)</Label>
                <Input type="number" min={0} max={100} value={form.faiz} onChange={e => setForm(f => ({ ...f, faiz: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSLAR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Qeydlər</Label>
              <Textarea value={form.qeydler} onChange={e => setForm(f => ({ ...f, qeydler: e.target.value }))} rows={2} />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={!form.bashliq || !form.isci_id}>
              {editItem ? "Yadda saxla" : "Tapşırıq yarat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}