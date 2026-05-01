import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MessageSquareWarning } from "lucide-react";
import DeleteButton from "../components/DeleteButton";
import { useAdmin } from "../hooks/useAdmin";
import moment from "moment";

const kateqoriyalar = ["Xidmət keyfiyyəti","Gecikmo","Qiymət","İşçi davranışı","Zərər","Digər"];
const prioritetler = ["Aşağı","Orta","Yüksək","Kritik"];

export default function Sikayetler() {
  const isAdmin = useAdmin();
  const [sikayetler, setSikayetler] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ musteri_id: "", kateqoriya: "Xidmət keyfiyyəti", prioritet: "Orta", aciklama: "" });

  const fetchData = () => {
    Promise.all([
      base44.entities.Sikayet.list("-created_date", 100),
      base44.entities.Musteri.list("-created_date", 200),
    ]).then(([s, m]) => { setSikayetler(s); setMusteriler(m); setLoading(false); });
  };
  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    const musteri = musteriler.find(m => m.id === form.musteri_id);
    await base44.entities.Sikayet.create({
      ...form, musteri_adi: musteri?.ad_soyad || "",
      ticket_no: `TKT-${Date.now().toString().slice(-6)}`, status: "Açıq", sla_muddeti: 24
    });
    setShowDialog(false);
    setForm({ musteri_id: "", kateqoriya: "Xidmət keyfiyyəti", prioritet: "Orta", aciklama: "" });
    fetchData();
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.Sikayet.update(id, { status });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const prioritetColors = { "Aşağı": "bg-gray-100 text-gray-700", "Orta": "bg-blue-100 text-blue-700", "Yüksək": "bg-orange-100 text-orange-700", "Kritik": "bg-red-100 text-red-700" };
  const statusColors = { "Açıq": "bg-red-100 text-red-700", "İcrada": "bg-orange-100 text-orange-700", "Həll edildi": "bg-green-100 text-green-700", "Bağlı": "bg-gray-100 text-gray-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Şikayətlər və Dəstək</h1>
          <p className="text-muted-foreground text-sm mt-1">{sikayetler.filter(s => s.status === "Açıq").length} açıq bilet</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Yeni Şikayət</Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Bilet №</th>
                <th className="text-left px-4 py-3 font-medium">Müştəri</th>
                <th className="text-left px-4 py-3 font-medium">Kateqoriya</th>
                <th className="text-left px-4 py-3 font-medium">Prioritet</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Tarix</th>
                <th className="text-right px-4 py-3 font-medium">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {sikayetler.map(s => (
                <tr key={s.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{s.ticket_no}</td>
                  <td className="px-4 py-3">{s.musteri_adi}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.kateqoriya}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prioritetColors[s.prioritet] || ""}`}>{s.prioritet}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] || ""}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3">{moment(s.created_date).format("DD.MM.YYYY")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Select value={s.status} onValueChange={v => handleStatusChange(s.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Açıq","İcrada","Həll edildi","Bağlı"].map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {isAdmin && <DeleteButton onDelete={async () => { await base44.entities.Sikayet.delete(s.id); fetchData(); }} />}
                    </div>
                  </td>
                </tr>
              ))}
              {sikayetler.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Şikayət yoxdur</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Şikayət</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Müştəri *</Label>
              <Select value={form.musteri_id} onValueChange={v => setForm(f => ({...f, musteri_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Müştəri seçin" /></SelectTrigger>
                <SelectContent>{musteriler.map(m => <SelectItem key={m.id} value={m.id}>{m.ad_soyad}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kateqoriya</Label>
                <Select value={form.kateqoriya} onValueChange={v => setForm(f => ({...f, kateqoriya: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{kateqoriyalar.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioritet</Label>
                <Select value={form.prioritet} onValueChange={v => setForm(f => ({...f, prioritet: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{prioritetler.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Açıqlama *</Label><Textarea value={form.aciklama} onChange={e => setForm(f => ({...f, aciklama: e.target.value}))} rows={4} /></div>
            <Button className="w-full" onClick={handleCreate}>Şikayət yarat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}