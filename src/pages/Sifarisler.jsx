import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, DollarSign } from "lucide-react";
import SifarisXerciModal from "../components/SifarisXerciModal";
import DeleteButton from "../components/DeleteButton";
import { useAdmin } from "../hooks/useAdmin";
import moment from "moment";

const statuses = ["Yeni", "Təsdiqləndi", "Planlandı", "İcrada", "Tamamlandı", "Ləğv edildi"];
const statusColors = {
  "Yeni": "bg-blue-100 text-blue-700",
  "Təsdiqləndi": "bg-cyan-100 text-cyan-700",
  "Planlandı": "bg-purple-100 text-purple-700",
  "İcrada": "bg-orange-100 text-orange-700",
  "Tamamlandı": "bg-green-100 text-green-700",
  "Ləğv edildi": "bg-red-100 text-red-700",
};
const xidmetler = ["Ev təmizliyi","Ofis təmizliyi","Pəncərə təmizliyi","Xalça yuma","Divan yuma","Tikintidən sonra","Dərin təmizlik","Mətbəx təmizliyi","Digər"];

export default function Sifarisler() {
  const isAdmin = useAdmin();
  const [sifarisler, setSifarisler] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [podratcilar, setPodratcilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [xercSifaris, setXercSifaris] = useState(null);
  const [form, setForm] = useState({
    musteri_id: "", xidmet_tipi: "Ev təmizliyi", unvan: "", tarix: "", saat: "",
    muddeti: "", qiymet: "", tekrarlanan: false, tekrar_periodu: "", qeydler: "",
    podratci_id: "", podratci_adi: ""
  });

  const fetchData = () => {
    Promise.all([
      base44.entities.Sifaris.list("-created_date", 100),
      base44.entities.Musteri.list("-created_date", 200),
      base44.entities.Podratci.list(),
    ]).then(([s, m, p]) => { setSifarisler(s); setMusteriler(m); setPodratcilar(p); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    const musteri = musteriler.find(m => m.id === form.musteri_id);
    const qiymet = parseFloat(form.qiymet) || 0;
    const edvMeblegi = musteri?.edv_odeyicisi ? qiymet * 0.18 : 0;
    const sifarisNo = `SIF-${Date.now().toString().slice(-6)}`;

    const podratci = podratcilar.find(p => p.id === form.podratci_id);
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
    setForm({ musteri_id: "", xidmet_tipi: "Ev təmizliyi", unvan: "", tarix: "", saat: "", muddeti: "", qiymet: "", tekrarlanan: false, tekrar_periodu: "", qeydler: "", podratci_id: "", podratci_adi: "" });
    fetchData();
  };

  const handleStatusChange = async (id, newStatus) => {
    await base44.entities.Sifaris.update(id, { status: newStatus });
    fetchData();
  };

  const handleOdenisChange = async (id, newOdenis) => {
    await base44.entities.Sifaris.update(id, { odenis_statusu: newOdenis });
    fetchData();
  };

  const filtered = filterStatus === "all" ? sifarisler : sifarisler.filter(s => s.status === filterStatus);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sifarişlər</h1>
          <p className="text-muted-foreground text-sm mt-1">{sifarisler.length} sifariş</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Yeni Sifariş</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>Hamısı</Button>
        {statuses.map(s => (
          <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"} onClick={() => setFilterStatus(s)}>
            {s} ({sifarisler.filter(si => si.status === s).length})
          </Button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Sifariş №</th>
                <th className="text-left px-4 py-3 font-medium">Müştəri</th>
                <th className="text-left px-4 py-3 font-medium">Xidmət</th>
                <th className="text-left px-4 py-3 font-medium">Tarix</th>
                <th className="text-right px-4 py-3 font-medium">Məbləğ</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Ödəniş</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{s.sifaris_no || "—"}</td>
                  <td className="px-4 py-3">{s.musteri_adi || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.xidmet_tipi}</td>
                  <td className="px-4 py-3">{s.tarix ? moment(s.tarix).format("DD.MM.YYYY HH:mm") : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {(s.umumi_mebleg || s.qiymet || 0).toFixed(2)} ₼
                    {s.edv_meblegi > 0 && <span className="text-xs text-muted-foreground ml-1">(+ƏDV)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={s.status} onValueChange={v => handleStatusChange(s.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-32">
                        <span className={`px-2 py-0.5 rounded-full ${statusColors[s.status]}`}>{s.status}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={s.odenis_statusu || "Ödənilməyib"} onValueChange={v => handleOdenisChange(s.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-36 border-0 shadow-none p-0 focus:ring-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          s.odenis_statusu === "Ödənilib" ? "bg-green-100 text-green-700" :
                          s.odenis_statusu === "Qismən ödənilib" ? "bg-orange-100 text-orange-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>{s.odenis_statusu || "Ödənilməyib"}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ödənilməyib">Ödənilməyib</SelectItem>
                        <SelectItem value="Qismən ödənilib">Qismən ödənilib</SelectItem>
                        <SelectItem value="Ödənilib">Ödənilib</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => setXercSifaris(s)}>
                      <DollarSign className="w-3.5 h-3.5" /> Xərclər
                    </Button>
                    {isAdmin && <DeleteButton onDelete={async () => { await base44.entities.Sifaris.delete(s.id); fetchData(); }} />}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Sifariş tapılmadı</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Yeni Sifariş</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Müştəri *</Label>
              <Select value={form.musteri_id} onValueChange={v => {
                const m = musteriler.find(mu => mu.id === v);
                setForm(f => ({...f, musteri_id: v, unvan: m?.unvan || f.unvan}));
              }}>
                <SelectTrigger><SelectValue placeholder="Müştəri seçin" /></SelectTrigger>
                <SelectContent>
                  {musteriler.map(m => <SelectItem key={m.id} value={m.id}>{m.ad_soyad} - {m.telefon}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Xidmət tipi *</Label>
                <Select value={form.xidmet_tipi} onValueChange={v => setForm(f => ({...f, xidmet_tipi: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{xidmetler.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Qiymət (₼) *</Label><Input type="number" value={form.qiymet} onChange={e => setForm(f => ({...f, qiymet: e.target.value}))} /></div>
            </div>
            <div><Label>Ünvan</Label><Input value={form.unvan} onChange={e => setForm(f => ({...f, unvan: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tarix *</Label><Input type="datetime-local" value={form.tarix} onChange={e => setForm(f => ({...f, tarix: e.target.value}))} /></div>
              <div><Label>Müddəti (saat)</Label><Input type="number" value={form.muddeti} onChange={e => setForm(f => ({...f, muddeti: e.target.value}))} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.tekrarlanan} onCheckedChange={v => setForm(f => ({...f, tekrarlanan: v}))} />
              <Label>Təkrarlanan sifariş</Label>
            </div>
            {form.tekrarlanan && (
              <div>
                <Label>Təkrar periodu</Label>
                <Select value={form.tekrar_periodu} onValueChange={v => setForm(f => ({...f, tekrar_periodu: v}))}>
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
              <Select value={form.podratci_id} onValueChange={v => setForm(f => ({...f, podratci_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Podratçı seçin (isteğe bağlı)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>— Podratçısız —</SelectItem>
                  {podratcilar.map(p => <SelectItem key={p.id} value={p.id}>{p.ad} ({p.komissiya_faizi || 20}%)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Qeydlər</Label><Textarea value={form.qeydler} onChange={e => setForm(f => ({...f, qeydler: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleCreate}>Sifariş yarat</Button>
          </div>
        </DialogContent>
      </Dialog>

      <SifarisXerciModal
        sifaris={xercSifaris}
        open={!!xercSifaris}
        onClose={() => setXercSifaris(null)}
      />
    </div>
  );
}