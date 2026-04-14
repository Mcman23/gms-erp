import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";

const emptyForm = { ad: "", telefon: "", email: "", voen: "", unvan: "", tip: "Fərdi", komissiya_faizi: 20, status: "Aktiv", qeydler: "" };

export default function Podratcilar() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = () => base44.entities.Podratci.list().then(d => { setList(d); setLoading(false); });
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setShowDialog(true); };

  const handleSave = async () => {
    const data = { ...form, komissiya_faizi: parseFloat(form.komissiya_faizi) || 20 };
    if (editing) {
      await base44.entities.Podratci.update(editing.id, data);
    } else {
      await base44.entities.Podratci.create(data);
    }
    setShowDialog(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm("Silmək istədiyinizə əminsiniz?")) return;
    await base44.entities.Podratci.delete(id);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Podratçılar</h1>
          <p className="text-muted-foreground text-sm mt-1">{list.length} podratçı</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Yeni Podratçı</Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Ad / Şirkət</th>
                <th className="text-left px-4 py-3 font-medium">Telefon</th>
                <th className="text-left px-4 py-3 font-medium">Tip</th>
                <th className="text-right px-4 py-3 font-medium">Komissiya %</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{p.ad}</td>
                  <td className="px-4 py-3">{p.telefon}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.tip}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{p.komissiya_faizi || 20}%</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "Aktiv" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Podratçı tapılmadı</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Podratçı redaktə" : "Yeni Podratçı"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Ad / Şirkət adı *</Label><Input value={form.ad} onChange={e => setForm(f => ({...f, ad: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefon *</Label><Input value={form.telefon} onChange={e => setForm(f => ({...f, telefon: e.target.value}))} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tip</Label>
                <Select value={form.tip} onValueChange={v => setForm(f => ({...f, tip: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Fərdi">Fərdi</SelectItem><SelectItem value="Şirkət">Şirkət</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Komissiya faizi (%)</Label>
                <Input type="number" min={0} max={100} value={form.komissiya_faizi} onChange={e => setForm(f => ({...f, komissiya_faizi: e.target.value}))} />
              </div>
            </div>
            <div><Label>VÖEN</Label><Input value={form.voen} onChange={e => setForm(f => ({...f, voen: e.target.value}))} /></div>
            <div><Label>Qeydlər</Label><Textarea value={form.qeydler} onChange={e => setForm(f => ({...f, qeydler: e.target.value}))} rows={2} /></div>
            <Button className="w-full" onClick={handleSave}>{editing ? "Yadda saxla" : "Yarat"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}