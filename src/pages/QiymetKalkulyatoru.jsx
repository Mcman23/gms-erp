import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Calculator, FileCheck } from "lucide-react";

export default function QiymetKalkulyatoru() {
  const [xidmetler, setXidmetler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tip, setTip] = useState("B2C");
  const [xidmet, setXidmet] = useState("");
  const [sahe, setSahe] = useState("");
  const [edvOdeyicisi, setEdvOdeyicisi] = useState(false);
  const [extraXerc, setExtraXerc] = useState("");
  const [qeydler, setQeydler] = useState("");
  const [musteriAdi, setMusteriAdi] = useState("");
  const [telefon, setTelefon] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.QiymetAyarlari.filter({ aktiv: true }).catch(() => []).then(data => {
      setXidmetler(data);
      if (data.length > 0) setXidmet(data[0].xidmet_adi);
      setLoading(false);
    });
  }, []);

  const secilenXidmet = xidmetler.find(x => x.xidmet_adi === xidmet);
  const vahidQiymet = secilenXidmet ? (tip === "B2C" ? secilenXidmet.b2c_qiymet : secilenXidmet.b2b_qiymet) : 0;
  const saheDeger = parseFloat(sahe) || 0;
  const araCem = saheDeger * vahidQiymet + (parseFloat(extraXerc) || 0);
  const edvMeblegi = edvOdeyicisi ? araCem * 0.18 : 0;
  const umumi = araCem + edvMeblegi;

  const handleTeklifYarat = async () => {
    if (!musteriAdi || !sahe) {
      toast({ title: "Xeta", description: "Musteri adi ve saheni daxil edin", variant: "destructive" });
      return;
    }
    setSaving(true);
    const no = `TKL-${Date.now().toString().slice(-6)}`;
    await base44.entities.QiymetTeklifi.create({
      teklif_no: no,
      musteri_adi: musteriAdi,
      musteri_telefon: telefon,
      xidmet_tipi: xidmet,
      sahesi: saheDeger,
      ara_cem: araCem,
      edv_faizi: edvOdeyicisi ? 18 : 0,
      edv_meblegi: edvMeblegi,
      umumi_mebleg: umumi,
      edv_odeyicisi: edvOdeyicisi,
      tarix: new Date().toISOString().slice(0, 10),
      status: "Gonderilmeyib",
      qeydler,
    });
    setSaving(false);
    toast({ title: "Teklif yaradildi!", description: `${no} nomreli teklif saxlanildi.` });
    setMusteriAdi(""); setTelefon(""); setSahe(""); setQeydler(""); setExtraXerc("");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  if (xidmetler.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Calculator className="w-6 h-6 text-primary" /> Qiymet Kalkulyatoru</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <Calculator className="w-10 h-10 mx-auto mb-3 text-yellow-600" />
          <h3 className="font-semibold text-yellow-800 mb-2">Qiymet listesi tapilmadi</h3>
          <p className="text-yellow-700 text-sm">Zehmet olmasa <strong>Ayarlar → Qiymet Ayarlari</strong> bolmesine keçib xidmet qiymetlerini elave edin ve tesdiqlendirin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Calculator className="w-6 h-6 text-primary" /> Qiymet Kalkulyatoru</h1>
        <p className="text-muted-foreground text-sm mt-1">B2C / B2B xidmet qiymetini hesabla ve teklif yarat</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol — form */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Parametrler</h3>

          <div className="flex gap-2">
            {["B2C", "B2B"].map(t => (
              <Button key={t} size="sm" variant={tip === t ? "default" : "outline"} onClick={() => setTip(t)}>
                {t} {t === "B2C" ? "(Ferdi)" : "(Korporativ)"}
              </Button>
            ))}
          </div>

          <div>
            <Label>Xidmet novu</Label>
            <Select value={xidmet} onValueChange={setXidmet}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {xidmetler.map(x => (
                  <SelectItem key={x.id} value={x.xidmet_adi}>
                    {x.xidmet_adi} — {tip === "B2C" ? x.b2c_qiymet : x.b2b_qiymet} {x.vahid || "₼/m²"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sahe (m²)</Label><Input type="number" value={sahe} onChange={e => setSahe(e.target.value)} placeholder="0" /></div>
            <div><Label>Elave xerc (₼)</Label><Input type="number" value={extraXerc} onChange={e => setExtraXerc(e.target.value)} placeholder="0" /></div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={edvOdeyicisi} onCheckedChange={setEdvOdeyicisi} />
            <Label>EDV odeyicisi (18%)</Label>
          </div>

          <hr className="border-border" />
          <h3 className="font-semibold text-sm">Teklif melumatları</h3>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Musteri adi</Label><Input value={musteriAdi} onChange={e => setMusteriAdi(e.target.value)} /></div>
            <div><Label>Telefon</Label><Input value={telefon} onChange={e => setTelefon(e.target.value)} /></div>
          </div>
          <div><Label>Qeydler</Label><Textarea value={qeydler} onChange={e => setQeydler(e.target.value)} /></div>
        </div>

        {/* Sag — netice */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold">Hesablama neticesi</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Xidmet novu</span><span className="font-medium">{xidmet}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sahe</span><span className="font-medium">{saheDeger} m²</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vahid qiymet ({tip})</span><span className="font-medium">{vahidQiymet} ₼/m²</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Xidmet qiymeti</span><span className="font-medium">{(saheDeger * vahidQiymet).toFixed(2)} ₼</span></div>
              {parseFloat(extraXerc) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Elave xerc</span><span className="font-medium">{parseFloat(extraXerc).toFixed(2)} ₼</span></div>}
              <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Ara cem</span><span className="font-semibold">{araCem.toFixed(2)} ₼</span></div>
              {edvOdeyicisi && <div className="flex justify-between text-purple-700"><span>EDV (18%)</span><span>+{edvMeblegi.toFixed(2)} ₼</span></div>}
              <div className="flex justify-between py-3 px-4 bg-primary text-primary-foreground rounded-lg text-base font-bold mt-2">
                <span>UMUMİ</span><span>{umumi.toFixed(2)} ₼</span>
              </div>
            </div>
          </div>

          {/* Vahid qiymet cedveli */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h4 className="font-semibold text-sm mb-3">Qiymet Cedveli ({tip})</h4>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border"><th className="text-left py-1 font-medium">Xidmet</th><th className="text-right py-1 font-medium">Vahid</th><th className="text-right py-1 font-medium">Qiymet</th></tr></thead>
              <tbody>
                {xidmetler.map(x => (
                  <tr key={x.id} className={`border-b border-border/50 ${x.xidmet_adi === xidmet ? "bg-primary/10 font-semibold" : ""}`}>
                    <td className="py-1.5">{x.xidmet_adi}</td>
                    <td className="py-1.5 text-right text-muted-foreground">{x.vahid || "m²"}</td>
                    <td className="py-1.5 text-right">{tip === "B2C" ? x.b2c_qiymet : x.b2b_qiymet} ₼</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button className="w-full gap-2" onClick={handleTeklifYarat} disabled={saving}>
            <FileCheck className="w-4 h-4" /> {saving ? "Saxlanilir..." : "Teklif Yarat"}
          </Button>
        </div>
      </div>
    </div>
  );
}