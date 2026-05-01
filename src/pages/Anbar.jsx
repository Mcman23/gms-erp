import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle, Package } from "lucide-react";
import DeleteButton from "../components/DeleteButton";
import { useAdmin } from "../hooks/useAdmin";

const kateqoriyalar = ["Kimyəvi maddə","Təmizlik aləti","Avadanlıq","Ehtiyat hissə","Digər"];
const vahidler = ["ədəd","litr","kq","qutu","paket"];

export default function Anbar() {
  const isAdmin = useAdmin();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ ad: "", kateqoriya: "Kimyəvi maddə", vahid: "ədəd", miqdar: "", min_miqdar: "5", qiymet: "", tedarukcu: "" });

  const fetchData = () => { base44.entities.Anbar.list("-created_date", 200).then(setItems).finally(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    const miqdar = parseFloat(form.miqdar) || 0;
    const minMiqdar = parseFloat(form.min_miqdar) || 5;
    await base44.entities.Anbar.create({
      ...form, miqdar, min_miqdar: minMiqdar, qiymet: parseFloat(form.qiymet) || 0,
      status: miqdar <= 0 ? "Bitib" : miqdar <= minMiqdar ? "Az qalıb" : "Mövcud"
    });
    setShowDialog(false);
    setForm({ ad: "", kateqoriya: "Kimyəvi maddə", vahid: "ədəd", miqdar: "", min_miqdar: "5", qiymet: "", tedarukcu: "" });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const azQalan = items.filter(i => i.miqdar <= i.min_miqdar);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anbar və Stok</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} məhsul{azQalan.length > 0 && ` • ${azQalan.length} xəbərdarlıq`}</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Yeni Məhsul</Button>
      </div>

      {azQalan.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-800">Minimum stok həddindən aşağı: {azQalan.map(i => i.ad).join(", ")}</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Məhsul</th>
                <th className="text-left px-4 py-3 font-medium">Kateqoriya</th>
                <th className="text-right px-4 py-3 font-medium">Miqdar</th>
                <th className="text-right px-4 py-3 font-medium">Min.</th>
                <th className="text-right px-4 py-3 font-medium">Qiymət</th>
                <th className="text-left px-4 py-3 font-medium">Tədarükçü</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className={`border-t border-border/50 hover:bg-muted/30 ${i.miqdar <= i.min_miqdar ? "bg-orange-50/50" : ""}`}>
                  <td className="px-4 py-3 font-medium">{i.ad}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.kateqoriya}</td>
                  <td className="px-4 py-3 text-right font-semibold">{i.miqdar} {i.vahid}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{i.min_miqdar} {i.vahid}</td>
                  <td className="px-4 py-3 text-right">{(i.qiymet || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.tedarukcu || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      i.status === "Mövcud" ? "bg-green-100 text-green-700" :
                      i.status === "Az qalıb" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                    }`}>{i.status}</span>
                  </td>
                  {isAdmin && <td className="px-2 py-3"><DeleteButton onDelete={async () => { await base44.entities.Anbar.delete(i.id); fetchData(); }} /></td>}
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Məhsul yoxdur</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Məhsul</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Məhsul adı *</Label><Input value={form.ad} onChange={e => setForm(f => ({...f, ad: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kateqoriya *</Label>
                <Select value={form.kateqoriya} onValueChange={v => setForm(f => ({...f, kateqoriya: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{kateqoriyalar.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vahid *</Label>
                <Select value={form.vahid} onValueChange={v => setForm(f => ({...f, vahid: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{vahidler.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Miqdar</Label><Input type="number" value={form.miqdar} onChange={e => setForm(f => ({...f, miqdar: e.target.value}))} /></div>
              <div><Label>Min. miqdar</Label><Input type="number" value={form.min_miqdar} onChange={e => setForm(f => ({...f, min_miqdar: e.target.value}))} /></div>
              <div><Label>Qiymət (₼)</Label><Input type="number" value={form.qiymet} onChange={e => setForm(f => ({...f, qiymet: e.target.value}))} /></div>
            </div>
            <div><Label>Tədarükçü</Label><Input value={form.tedarukcu} onChange={e => setForm(f => ({...f, tedarukcu: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleCreate}>Yarat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}