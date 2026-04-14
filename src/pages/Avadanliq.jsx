import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Wrench } from "lucide-react";
import DeleteButton from "../components/DeleteButton";
import { useAdmin } from "../hooks/useAdmin";
import moment from "moment";

const kateqoriyalar = ["Tozsoran","Buxar aparatı","Cilalayıcı","Təzyiqli yuma","Digər"];
const statuslar = ["İstifadədə","Anbarda","Təmirdə","Silindi"];

export default function Avadanliq() {
  const isAdmin = useAdmin();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ ad: "", kateqoriya: "Tozsoran", seriya_no: "", qiymeti: "", teyin_olunan: "", qeydler: "" });

  const fetchData = () => { base44.entities.Avadanliq.list("-created_date", 100).then(setItems).finally(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    await base44.entities.Avadanliq.create({
      ...form, qiymeti: parseFloat(form.qiymeti) || 0, status: "İstifadədə",
      alis_tarixi: new Date().toISOString().slice(0, 10)
    });
    setShowDialog(false);
    setForm({ ad: "", kateqoriya: "Tozsoran", seriya_no: "", qiymeti: "", teyin_olunan: "", qeydler: "" });
    fetchData();
  };

  const statusColors = { "İstifadədə": "bg-green-100 text-green-700", "Anbarda": "bg-blue-100 text-blue-700", "Təmirdə": "bg-orange-100 text-orange-700", "Silindi": "bg-red-100 text-red-700" };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avadanlıq</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} avadanlıq</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Yeni Avadanlıq</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(i => (
          <div key={i.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{i.ad}</h3>
                  <p className="text-xs text-muted-foreground">{i.kateqoriya}</p>
                </div>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[i.status] || ""}`}>{i.status}</span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {i.seriya_no && <p>SN: {i.seriya_no}</p>}
              {i.teyin_olunan && <p>Təyin: {i.teyin_olunan}</p>}
              {i.son_baxim_tarixi && <p>Son baxım: {moment(i.son_baxim_tarixi).format("DD.MM.YYYY")}</p>}
            </div>
            <div className="mt-3 pt-3 border-t border-border/50 text-xs flex justify-between items-center">
              <span className="text-muted-foreground">Qiymət</span>
              <span className="font-semibold">{(i.qiymeti || 0).toFixed(2)} ₼</span>
              {isAdmin && <DeleteButton onDelete={async () => { await base44.entities.Avadanliq.delete(i.id); fetchData(); }} />}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Avadanlıq</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ad *</Label><Input value={form.ad} onChange={e => setForm(f => ({...f, ad: e.target.value}))} /></div>
              <div>
                <Label>Kateqoriya *</Label>
                <Select value={form.kateqoriya} onValueChange={v => setForm(f => ({...f, kateqoriya: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{kateqoriyalar.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Seriya №</Label><Input value={form.seriya_no} onChange={e => setForm(f => ({...f, seriya_no: e.target.value}))} /></div>
              <div><Label>Qiymət (₼)</Label><Input type="number" value={form.qiymeti} onChange={e => setForm(f => ({...f, qiymeti: e.target.value}))} /></div>
            </div>
            <div><Label>Təyin olunan</Label><Input value={form.teyin_olunan} onChange={e => setForm(f => ({...f, teyin_olunan: e.target.value}))} /></div>
            <div><Label>Qeydlər</Label><Textarea value={form.qeydler} onChange={e => setForm(f => ({...f, qeydler: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleCreate}>Yarat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}