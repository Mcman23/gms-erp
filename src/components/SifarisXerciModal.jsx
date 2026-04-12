import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";

const KATEQORIYALAR = ["Material/Kimyəvi", "Avadanlıq istifadəsi", "İşçi məzuniyyəti", "Nəqliyyat", "Digər birbaşa xərc"];

export default function SifarisXerciModal({ sifaris, open, onClose }) {
  const [xercler, setXercler] = useState([]);
  const [form, setForm] = useState({ kateqoriya: "Material/Kimyəvi", aciklama: "", miqdar: "1", vahid_qiymet: "", mebleg: "" });
  const [loading, setLoading] = useState(false);

  const fetchXercler = () => {
    if (!sifaris?.id) return;
    base44.entities.SifarisXerci.filter({ sifaris_id: sifaris.id }).catch(() => []).then(setXercler);
  };

  useEffect(() => {
    if (open && sifaris) fetchXercler();
  }, [open, sifaris]);

  const handleAdd = async () => {
    const miqdar = parseFloat(form.miqdar) || 1;
    const vahidQ = parseFloat(form.vahid_qiymet) || 0;
    const mebleg = parseFloat(form.mebleg) || (miqdar * vahidQ);

    await base44.entities.SifarisXerci.create({
      sifaris_id: sifaris.id,
      sifaris_no: sifaris.sifaris_no || "",
      kateqoriya: form.kateqoriya,
      aciklama: form.aciklama,
      miqdar,
      vahid_qiymet: vahidQ,
      mebleg,
      tarix: new Date().toISOString().slice(0, 10),
    });
    setForm({ kateqoriya: "Material/Kimyəvi", aciklama: "", miqdar: "1", vahid_qiymet: "", mebleg: "" });
    fetchXercler();
  };

  const handleDelete = async (id) => {
    await base44.entities.SifarisXerci.delete(id);
    fetchXercler();
  };

  const gelir = sifaris?.qiymet || 0;
  const umumiXerc = xercler.reduce((s, x) => s + (x.mebleg || 0), 0);
  const menfeyet = gelir - umumiXerc;
  const marj = gelir > 0 ? (menfeyet / gelir) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Xərclər — {sifaris?.sifaris_no || ""} ({sifaris?.musteri_adi})</DialogTitle>
        </DialogHeader>

        {/* Rentabellik */}
        <div className={`rounded-xl p-4 border flex gap-6 flex-wrap ${menfeyet >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div>
            <p className="text-xs text-muted-foreground">Gəlir (ƏDV-siz)</p>
            <p className="text-xl font-bold">{gelir.toFixed(2)} ₼</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ümumi xərc</p>
            <p className="text-xl font-bold text-red-600">{umumiXerc.toFixed(2)} ₼</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mənfəət</p>
            <p className={`text-xl font-bold flex items-center gap-1 ${menfeyet >= 0 ? "text-green-700" : "text-red-700"}`}>
              {menfeyet >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {menfeyet.toFixed(2)} ₼
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Marj</p>
            <p className={`text-xl font-bold ${marj >= 0 ? "text-green-700" : "text-red-700"}`}>{marj.toFixed(1)}%</p>
          </div>
        </div>

        {/* Xərc əlavə et */}
        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold">Xərc əlavə et</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kateqoriya</Label>
              <Select value={form.kateqoriya} onValueChange={v => setForm(f => ({...f, kateqoriya: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KATEQORIYALAR.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Açıqlama</Label><Input value={form.aciklama} onChange={e => setForm(f => ({...f, aciklama: e.target.value}))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Miqdar</Label><Input type="number" value={form.miqdar} onChange={e => {
              const m = e.target.value;
              setForm(f => ({...f, miqdar: m, mebleg: (parseFloat(m) * (parseFloat(f.vahid_qiymet) || 0)).toFixed(2)}));
            }} /></div>
            <div><Label>Vahid qiymət (₼)</Label><Input type="number" value={form.vahid_qiymet} onChange={e => {
              const vq = e.target.value;
              setForm(f => ({...f, vahid_qiymet: vq, mebleg: ((parseFloat(f.miqdar) || 1) * parseFloat(vq)).toFixed(2)}));
            }} /></div>
            <div><Label>Məbləğ (₼)</Label><Input type="number" value={form.mebleg} onChange={e => setForm(f => ({...f, mebleg: e.target.value}))} /></div>
          </div>
          <Button size="sm" className="gap-2" onClick={handleAdd}><Plus className="w-4 h-4" /> Əlavə et</Button>
        </div>

        {/* Xərclər siyahısı */}
        <div className="max-h-52 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Kateqoriya</th>
                <th className="text-left px-3 py-2 font-medium">Açıqlama</th>
                <th className="text-right px-3 py-2 font-medium">Miqdar</th>
                <th className="text-right px-3 py-2 font-medium">Məbləğ</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {xercler.map(x => (
                <tr key={x.id} className="border-t border-border/50">
                  <td className="px-3 py-2 text-muted-foreground text-xs">{x.kateqoriya}</td>
                  <td className="px-3 py-2">{x.aciklama || "—"}</td>
                  <td className="px-3 py-2 text-right">{x.miqdar}</td>
                  <td className="px-3 py-2 text-right font-semibold">{(x.mebleg || 0).toFixed(2)} ₼</td>
                  <td className="px-3 py-2">
                    <button onClick={() => handleDelete(x.id)} className="text-muted-foreground hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {xercler.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground text-xs">Xərc əlavə edilməyib</td></tr>}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}