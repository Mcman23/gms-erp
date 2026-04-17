import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";

const KATEQORIYALAR = ["Material/Kimyəvi", "Avadanlıq istifadəsi", "İşçi məzuniyyəti", "Nəqliyyat", "Digər birbaşa xərc"];

const emptyForm = {
  kateqoriya: "Material/Kimyəvi",
  aciklama: "",
  edet_sayi: "1",
  gun_sayi: "1",
  gun_qiymet: "",
  baxsis: "",
  isci_id: "",
  isci_adi: "",
};

function calcMebleg(f) {
  const edet = parseFloat(f.edet_sayi) || 1;
  const gun = parseFloat(f.gun_sayi) || 1;
  const qiymet = parseFloat(f.gun_qiymet) || 0;
  return edet * gun * qiymet;
}

export default function SifarisXerciModal({ sifaris, open, onClose }) {
  const [xercler, setXercler] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [iscilar, setIscilar] = useState([]);

  const fetchXercler = () => {
    if (!sifaris?.id) return;
    base44.entities.SifarisXerci.filter({ sifaris_id: sifaris.id }).catch(() => []).then(setXercler);
  };

  useEffect(() => {
    if (open && sifaris) {
      fetchXercler();
      base44.entities.Isci.filter({ status: "Aktiv" }).catch(() => []).then(setIscilar);
    }
  }, [open, sifaris]);

  const handleChange = (field, value) => {
    setForm(f => {
      const next = { ...f, [field]: value };
      return next;
    });
  };

  const handleAdd = async () => {
    const edet = parseFloat(form.edet_sayi) || 1;
    const gun = parseFloat(form.gun_sayi) || 1;
    const gunQ = parseFloat(form.gun_qiymet) || 0;
    const baxsis = parseFloat(form.baxsis) || 0;
    const mebleg = edet * gun * gunQ + baxsis;

    await base44.entities.SifarisXerci.create({
      sifaris_id: sifaris.id,
      sifaris_no: sifaris.sifaris_no || "",
      kateqoriya: form.kateqoriya,
      aciklama: form.aciklama || form.isci_adi,
      edet_sayi: edet,
      gun_sayi: gun,
      gun_qiymet: gunQ,
      baxsis,
      miqdar: edet,
      vahid_qiymet: gunQ,
      mebleg,
      isci_id: form.isci_id || "",
      isci_adi: form.isci_adi || "",
      tarix: new Date().toISOString().slice(0, 10),
    });
    setForm(emptyForm);
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
      <DialogContent className="max-w-4xl">
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Kateqoriya</Label>
              <Select value={form.kateqoriya} onValueChange={v => handleChange("kateqoriya", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KATEQORIYALAR.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>İşçi (isteğe bağlı)</Label>
              <Select value={form.isci_id} onValueChange={v => {
                const isci = iscilar.find(i => i.id === v);
                handleChange("isci_id", v);
                handleChange("isci_adi", isci?.ad_soyad || "");
                if (isci && !form.aciklama) handleChange("aciklama", isci.ad_soyad + " işçi");
              }}>
                <SelectTrigger><SelectValue placeholder="İşçi seçin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>— Seçilməyib —</SelectItem>
                  {iscilar.map(i => <SelectItem key={i.id} value={i.id}>{i.ad_soyad}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Açıqlama / Təsvir</Label>
              <Input value={form.aciklama} onChange={e => handleChange("aciklama", e.target.value)} placeholder="Aparat arendası, material..." />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Ədəd sayı</Label>
              <Input type="number" min="1" value={form.edet_sayi} onChange={e => handleChange("edet_sayi", e.target.value)} />
            </div>
            <div>
              <Label>Gün sayı</Label>
              <Input type="number" min="1" value={form.gun_sayi} onChange={e => handleChange("gun_sayi", e.target.value)} />
            </div>
            <div>
              <Label>Gün/Qiymət (₼)</Label>
              <Input type="number" value={form.gun_qiymet} onChange={e => handleChange("gun_qiymet", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Baxşiş (₼)</Label>
              <Input type="number" value={form.baxsis} onChange={e => handleChange("baxsis", e.target.value)} placeholder="—" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Hesablanan məbləğ: <span className="font-bold text-foreground">{(calcMebleg(form) + (parseFloat(form.baxsis) || 0)).toFixed(2)} ₼</span>
              <span className="text-xs ml-2">({form.edet_sayi || 1} ədəd × {form.gun_sayi || 1} gün × {form.gun_qiymet || 0} ₼{parseFloat(form.baxsis) > 0 ? ` + ${form.baxsis} ₼ baxşiş` : ""})</span>
            </p>
            <Button size="sm" className="gap-2 ml-auto" onClick={handleAdd}><Plus className="w-4 h-4" /> Əlavə et</Button>
          </div>
        </div>

        {/* Xərclər siyahısı */}
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Təsvir</th>
                <th className="text-right px-3 py-2 font-medium">Ədəd</th>
                <th className="text-right px-3 py-2 font-medium">Gün</th>
                <th className="text-right px-3 py-2 font-medium">Gün/Qiy.</th>
                <th className="text-right px-3 py-2 font-medium">Baxşiş</th>
                <th className="text-right px-3 py-2 font-medium">Cəmi</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {xercler.map(x => (
                <tr key={x.id} className="border-t border-border/50">
                  <td className="px-3 py-2">
                    <p className="font-medium">{x.aciklama || x.isci_adi || "—"}</p>
                    <p className="text-xs text-muted-foreground">{x.kateqoriya}{x.isci_adi ? ` · ${x.isci_adi}` : ""}</p>
                  </td>
                  <td className="px-3 py-2 text-right">{x.edet_sayi ?? x.miqdar ?? 1}</td>
                  <td className="px-3 py-2 text-right">{x.gun_sayi ?? 1}</td>
                  <td className="px-3 py-2 text-right">{x.gun_qiymet > 0 ? `${x.gun_qiymet.toFixed(2)} ₼` : "—"}</td>
                  <td className="px-3 py-2 text-right">{x.baxsis > 0 ? `${x.baxsis.toFixed(2)} ₼` : "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold">{(x.mebleg || 0).toFixed(2)} ₼</td>
                  <td className="px-3 py-2">
                    <button onClick={() => handleDelete(x.id)} className="text-muted-foreground hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {xercler.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground text-xs">Xərc əlavə edilməyib</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}