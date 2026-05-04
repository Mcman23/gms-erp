import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, DollarSign, Trash2 } from "lucide-react";
import { sifarisOdenisKassa } from "@/functions/sifarisOdenisKassa";
import SifarisXerciModal from "../components/SifarisXerciModal";
import { useSuperAdmin } from "../hooks/useSuperAdmin";
import moment from "moment";
import { SIRKET_XIDMETLER, SIRKETLER } from "@/lib/xidmetler";

const statuses = ["Yeni", "Təsdiqləndi", "Planlandı", "İcrada", "Tamamlandı", "Ləğv edildi"];

const statusColors = {
  "Yeni": "bg-blue-100 text-blue-700",
  "Təsdiqləndi": "bg-cyan-100 text-cyan-700",
  "Planlandı": "bg-purple-100 text-purple-700",
  "İcrada": "bg-orange-100 text-orange-700",
  "Tamamlandı": "bg-green-100 text-green-700",
  "Ləğv edildi": "bg-red-100 text-red-700",
};

const odenisColors = {
  "Ödənilib": "bg-green-100 text-green-700",
  "Qismən ödənilib": "bg-orange-100 text-orange-700",
  "Ödənilməyib": "bg-yellow-100 text-yellow-700",
};

const emptyForm = {
  musteri_id: "", sirket: "GMS (Ümumi)", xidmet_tipi: "Ev təmizliyi",
  unvan: "", tarix: "", saat: "", muddeti: "", qiymet: "",
  tekrarlanan: false, tekrar_periodu: "", qeydler: "",
  podratci_id: "", podratci_adi: ""
};

export default function Sifarisler() {
  const isSuperAdmin = useSuperAdmin();
  const [sifarisler, setSifarisler] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [podratcilar, setPodratcilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [xercSifaris, setXercSifaris] = useState(null);
  const [qismenModal, setQismenModal] = useState(null);
  const [qismenMebleg, setQismenMebleg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = () => {
    Promise.all([
      base44.entities.Sifaris.list("-created_date", 200),
      base44.entities.Musteri.list("-created_date", 200),
      base44.entities.Podratci?.list().catch(() => []),
    ]).then(([s, m, p]) => {
      setSifarisler(s || []);
      setMusteriler(m || []);
      setPodratcilar(p || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    const musteri = musteriler.find(m => m.id === form.musteri_id);
    const qiymet = parseFloat(form.qiymet) || 0;
    const edvMeblegi = musteri?.edv_odeyicisi ? qiymet * 0.18 : 0;
    const sifarisNo = `SIF-${Date.now().toString().slice(-6)}`;
    const podratci = podratcilar.find(p => p.id === form.podratci_id && form.podratci_id !== "none");

    await base44.entities.Sifaris.create({
      ...form,
      sifaris_no: sifarisNo,
      musteri_adi: musteri?.ad_soyad || "",
      podratci_adi: podratci?.ad || "",
      qiymet,
      edv_meblegi: edvMeblegi,
      umumi_mebleg: qiymet + edvMeblegi,
      status: "Yeni",
      odenis_statusu: "Ödənilməyib",
      muddeti: parseFloat(form.muddeti) || 0,
    });
    setShowDialog(false);
    setForm(emptyForm);
    fetchData();
  };

  const handleStatusChange = async (id, newStatus) => {
    await base44.entities.Sifaris.update(id, { status: newStatus });
    setSifarisler(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleOdenisChange = async (id, newOdenis) => {
    const sifaris = sifarisler.find(s => s.id === id);
    const kohne = sifaris?.odenis_statusu || "Ödənilməyib";
    if (newOdenis === "Qismən ödənilib") {
      setQismenModal({ sifarisId: id, kohne });
      setQismenMebleg("");
      return;
    }
    await base44.entities.Sifaris.update(id, { odenis_statusu: newOdenis });
    sifarisOdenisKassa({ sifaris_id: id, odenis_statusu: newOdenis, kohne_odenis_statusu: kohne }).catch(() => {});
    setSifarisler(prev => prev.map(s => s.id === id ? { ...s, odenis_statusu: newOdenis } : s));
  };

  const handleQismenTesdiq = async () => {
    if (!qismenModal) return;
    const mebleg = parseFloat(qismenMebleg);
    if (!mebleg || mebleg <= 0) return;
    const { sifarisId, kohne } = qismenModal;
    await base44.entities.Sifaris.update(sifarisId, { odenis_statusu: "Qismən ödənilib", odenilmis_mebleg: mebleg });
    sifarisOdenisKassa({ sifaris_id: sifarisId, odenis_statusu: "Qismən ödənilib", kohne_odenis_statusu: kohne, qismen_mebleg: mebleg }).catch(() => {});
    setQismenModal(null);
    setQismenMebleg("");
    fetchData();
  };

  const handleDelete = async (id) => {
    await base44.entities.Sifaris.delete(id);
    setSifarisler(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
  };

  const filtered = filterStatus === "all"
    ? sifarisler
    : sifarisler.filter(s => s.status === filterStatus);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sifarişlər</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{sifarisler.length} sifariş</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Yeni Sifariş
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>
          Hamısı
        </Button>
        {statuses.map(s => (
          <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"} onClick={() => setFilterStatus(s)}>
            {s} ({sifarisler.filter(si => si.status === s).length})
          </Button>
        ))}
      </div>

      {/* Cards — No horizontal scroll */}
      <div className="space-y-2">
        {/* Header Row */}
        <div className="hidden md:grid grid-cols-[1.5fr_0.8fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_1.2fr_1.2fr_auto] gap-2 px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/40 rounded-lg">
          <span>Müştəri</span>
          <span>Şirkət</span>
          <span>Xidmət</span>
          <span>Tarix</span>
          <span className="text-right">Ümumi</span>
          <span className="text-right">Ödənilib</span>
          <span className="text-right">Qalıq</span>
          <span>Status</span>
          <span>Ödəniş</span>
          <span></span>
        </div>

        {filtered.map(s => {
          const umumi = s.umumi_mebleg || s.qiymet || 0;
          const odenilmis = s.odenilmis_mebleg || 0;
          const qalig = s.odenis_statusu === "Ödənilib" ? 0 : Math.max(0, umumi - odenilmis);

          return (
            <div
              key={s.id}
              className="bg-card border border-border rounded-xl px-4 py-3 hover:shadow-sm transition-shadow"
            >
              {/* Desktop layout */}
              <div className="hidden md:grid grid-cols-[1.5fr_0.8fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_1.2fr_1.2fr_auto] gap-2 items-center">
                {/* Müştəri */}
                <div>
                  <p className="font-medium text-sm leading-tight">{s.musteri_adi || "—"}</p>
                  <p className="text-xs text-muted-foreground">{s.sifaris_no || ""}</p>
                </div>

                {/* Şirkət */}
                <div>
                  <span className="text-xs text-muted-foreground">
                    {s.sirket && s.sirket !== "GMS (Ümumi)" ? (
                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{s.sirket}</span>
                    ) : "GMS"}
                  </span>
                </div>

                {/* Xidmət */}
                <p className="text-xs text-muted-foreground truncate">{s.xidmet_tipi || "—"}</p>

                {/* Tarix */}
                <p className="text-xs">{s.tarix ? moment(s.tarix).format("DD.MM.YYYY HH:mm") : "—"}</p>

                {/* Ümumi */}
                <div className="text-right">
                  <p className="font-semibold text-sm">{umumi.toFixed(2)} ₼</p>
                  {s.edv_meblegi > 0 && <p className="text-[10px] text-muted-foreground">+ƏDV</p>}
                </div>

                {/* Ödənilib */}
                <div className="text-right">
                  {odenilmis > 0
                    ? <span className="text-green-600 font-medium text-sm">{odenilmis.toFixed(2)} ₼</span>
                    : <span className="text-muted-foreground text-xs">—</span>
                  }
                </div>

                {/* Qalıq */}
                <div className="text-right">
                  <span className={`font-medium text-sm ${qalig > 0 ? (s.odenis_statusu === "Qismən ödənilib" ? "text-orange-600" : "text-red-500") : "text-green-600"}`}>
                    {qalig.toFixed(2)} ₼
                  </span>
                </div>

                {/* Status */}
                <Select value={s.status} onValueChange={v => handleStatusChange(s.id, v)}>
                  <SelectTrigger className="h-7 text-xs border-0 shadow-none p-0 w-auto focus:ring-0 gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status]}`}>{s.status}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Ödəniş */}
                <Select value={s.odenis_statusu || "Ödənilməyib"} onValueChange={v => handleOdenisChange(s.id, v)}>
                  <SelectTrigger className="h-7 text-xs border-0 shadow-none p-0 w-auto focus:ring-0 gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${odenisColors[s.odenis_statusu] || odenisColors["Ödənilməyib"]}`}>
                      {s.odenis_statusu || "Ödənilməyib"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ödənilməyib">Ödənilməyib</SelectItem>
                    <SelectItem value="Qismən ödənilib">Qismən ödənilib</SelectItem>
                    <SelectItem value="Ödənilib">Ödənilib</SelectItem>
                  </SelectContent>
                </Select>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-primary" onClick={() => setXercSifaris(s)}>
                    <DollarSign className="w-3.5 h-3.5" /> Xərclər
                  </Button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => setDeleteConfirm(s.id)}
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile layout */}
              <div className="md:hidden space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{s.musteri_adi || "—"}</p>
                    <p className="text-xs text-muted-foreground">{s.sifaris_no} · {s.xidmet_tipi}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{umumi.toFixed(2)} ₼</p>
                    {s.edv_meblegi > 0 && <p className="text-[10px] text-muted-foreground">+ƏDV</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status]}`}>{s.status}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${odenisColors[s.odenis_statusu] || odenisColors["Ödənilməyib"]}`}>
                    {s.odenis_statusu || "Ödənilməyib"}
                  </span>
                  <span className="text-xs text-muted-foreground">{s.tarix ? moment(s.tarix).format("DD.MM.YYYY") : ""}</span>
                </div>
                <div className="flex gap-2">
                  <Select value={s.status} onValueChange={v => handleStatusChange(s.id, v)}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{statuses.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={s.odenis_statusu || "Ödənilməyib"} onValueChange={v => handleOdenisChange(s.id, v)}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ödənilməyib">Ödənilməyib</SelectItem>
                      <SelectItem value="Qismən ödənilib">Qismən ödənilib</SelectItem>
                      <SelectItem value="Ödənilib">Ödənilib</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => setXercSifaris(s)}>
                    <DollarSign className="w-3 h-3" />
                  </Button>
                  {isSuperAdmin && (
                    <button onClick={() => setDeleteConfirm(s.id)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-red-50 text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Sifariş tapılmadı</div>
        )}
      </div>

      {/* Yeni Sifariş Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Yeni Sifariş</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Müştəri *</Label>
              <Select value={form.musteri_id} onValueChange={v => {
                const m = musteriler.find(mu => mu.id === v);
                setForm(f => ({ ...f, musteri_id: v, unvan: m?.unvan || f.unvan }));
              }}>
                <SelectTrigger><SelectValue placeholder="Müştəri seçin" /></SelectTrigger>
                <SelectContent>
                  {musteriler.map(m => <SelectItem key={m.id} value={m.id}>{m.ad_soyad} - {m.telefon}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Şirkət</Label>
              <Select value={form.sirket} onValueChange={v => setForm(f => ({ ...f, sirket: v, xidmet_tipi: SIRKET_XIDMETLER[v]?.[0] || "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SIRKETLER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Xidmət tipi *</Label>
                <Select value={form.xidmet_tipi} onValueChange={v => setForm(f => ({ ...f, xidmet_tipi: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(SIRKET_XIDMETLER[form.sirket] || []).map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Qiymət (₼) *</Label>
                <Input type="number" value={form.qiymet} onChange={e => setForm(f => ({ ...f, qiymet: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Ünvan</Label>
              <Input value={form.unvan} onChange={e => setForm(f => ({ ...f, unvan: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tarix *</Label>
                <Input type="datetime-local" value={form.tarix} onChange={e => setForm(f => ({ ...f, tarix: e.target.value }))} />
              </div>
              <div>
                <Label>Müddəti (saat)</Label>
                <Input type="number" value={form.muddeti} onChange={e => setForm(f => ({ ...f, muddeti: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.tekrarlanan} onCheckedChange={v => setForm(f => ({ ...f, tekrarlanan: v }))} />
              <Label>Təkrarlanan sifariş</Label>
            </div>
            {form.tekrarlanan && (
              <div>
                <Label>Təkrar periodu</Label>
                <Select value={form.tekrar_periodu} onValueChange={v => setForm(f => ({ ...f, tekrar_periodu: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Həftəlik">Həftəlik</SelectItem>
                    <SelectItem value="2 həftəlik">2 həftəlik</SelectItem>
                    <SelectItem value="Aylıq">Aylıq</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Podratçı (B2C)</Label>
              <Select value={form.podratci_id || "none"} onValueChange={v => setForm(f => ({ ...f, podratci_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Podratçı seçin (isteğe bağlı)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Podratçısız —</SelectItem>
                  {podratcilar.map(p => <SelectItem key={p.id} value={p.id}>{p.ad} ({p.komissiya_faizi || 20}%)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Qeydlər</Label>
              <Textarea value={form.qeydler} onChange={e => setForm(f => ({ ...f, qeydler: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleCreate}>Sifariş yarat</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Xərc Modal */}
      <SifarisXerciModal
        sifaris={xercSifaris}
        open={!!xercSifaris}
        onClose={() => setXercSifaris(null)}
      />

      {/* Qismən Ödəniş Modal */}
      <Dialog open={!!qismenModal} onOpenChange={() => setQismenModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Qismən Ödəniş Məbləği</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Nə qədər ödənilib? Məbləği daxil edin:</p>
            <div>
              <Label>Ödənilən məbləğ (₼)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={qismenMebleg}
                onChange={e => setQismenMebleg(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleQismenTesdiq()}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setQismenModal(null)}>Ləğv et</Button>
              <Button className="flex-1" onClick={handleQismenTesdiq} disabled={!qismenMebleg || parseFloat(qismenMebleg) <= 0}>
                Təsdiqlə
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Silinsin?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Bu sifariş silinəcək. Əməliyyat geri qaytarıla bilməz.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Ləğv et</Button>
            <Button variant="destructive" className="flex-1" onClick={() => handleDelete(deleteConfirm)}>Sil</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}