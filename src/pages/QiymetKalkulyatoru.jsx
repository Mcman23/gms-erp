import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Calculator, FileCheck } from "lucide-react";

const XIDMETLER = [
  { ad: "Ev təmizliyi", b2c: 2.5, b2b: 2.0 },
  { ad: "Ofis təmizliyi", b2c: 2.2, b2b: 1.8 },
  { ad: "Pəncərə təmizliyi", b2c: 3.0, b2b: 2.5 },
  { ad: "Xalça yuma", b2c: 4.0, b2b: 3.5 },
  { ad: "Divan yuma", b2c: 15, b2b: 12 },
  { ad: "Tikintidən sonra", b2c: 3.5, b2b: 3.0 },
  { ad: "Dərin təmizlik", b2c: 4.0, b2b: 3.5 },
  { ad: "Mətbəx təmizliyi", b2c: 3.0, b2b: 2.5 },
];

export default function QiymetKalkulyatoru() {
  const [tip, setTip] = useState("B2C");
  const [xidmet, setXidmet] = useState(XIDMETLER[0].ad);
  const [sahe, setSahe] = useState("");
  const [edvOdeyicisi, setEdvOdeyicisi] = useState(false);
  const [extraXerc, setExtraXerc] = useState("");
  const [qeydler, setQeydler] = useState("");
  const [musteriAdi, setMusteriAdi] = useState("");
  const [telefon, setTelefon] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const secilenXidmet = XIDMETLER.find(x => x.ad === xidmet) || XIDMETLER[0];
  const vahidQiymet = tip === "B2C" ? secilenXidmet.b2c : secilenXidmet.b2b;
  const saheDeger = parseFloat(sahe) || 0;
  const araCem = saheDeger * vahidQiymet + (parseFloat(extraXerc) || 0);
  const edvMeblegi = edvOdeyicisi ? araCem * 0.18 : 0;
  const umumi = araCem + edvMeblegi;

  const handleTeklifYarat = async () => {
    if (!musteriAdi || !sahe) {
      toast({ title: "Xəta", description: "Müştəri adı və sahəni daxil edin", variant: "destructive" });
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
      status: "Göndərilməyib",
      qeydler,
    });
    setSaving(false);
    toast({ title: "Teklif yaradıldı!", description: `${no} nömrəli teklif saxlanıldı.` });
    setMusteriAdi(""); setTelefon(""); setSahe(""); setQeydler(""); setExtraXerc("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Calculator className="w-6 h-6 text-primary" /> Qiymət Kalkulyatoru</h1>
        <p className="text-muted-foreground text-sm mt-1">B2C / B2B xidmət qiymətini hesabla və teklif yarat</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol — form */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Parametrlər</h3>

          <div className="flex gap-2">
            {["B2C", "B2B"].map(t => (
              <Button key={t} size="sm" variant={tip === t ? "default" : "outline"} onClick={() => setTip(t)}>
                {t} {t === "B2C" ? "(Fərdi)" : "(Korporativ)"}
              </Button>
            ))}
          </div>

          <div>
            <Label>Xidmət növü</Label>
            <Select value={xidmet} onValueChange={setXidmet}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{XIDMETLER.map(x => <SelectItem key={x.ad} value={x.ad}>{x.ad} — {tip === "B2C" ? x.b2c : x.b2b} ₼/m²</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sahə (m²)</Label><Input type="number" value={sahe} onChange={e => setSahe(e.target.value)} placeholder="0" /></div>
            <div><Label>Əlavə xərc (₼)</Label><Input type="number" value={extraXerc} onChange={e => setExtraXerc(e.target.value)} placeholder="0" /></div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={edvOdeyicisi} onCheckedChange={setEdvOdeyicisi} />
            <Label>ƏDV ödəyicisi (18%)</Label>
          </div>

          <hr className="border-border" />
          <h3 className="font-semibold text-sm">Teklif məlumatları</h3>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Müştəri adı</Label><Input value={musteriAdi} onChange={e => setMusteriAdi(e.target.value)} /></div>
            <div><Label>Telefon</Label><Input value={telefon} onChange={e => setTelefon(e.target.value)} /></div>
          </div>
          <div><Label>Qeydlər</Label><Textarea value={qeydler} onChange={e => setQeydler(e.target.value)} /></div>
        </div>

        {/* Sağ — nəticə */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold">Hesablama nəticəsi</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Xidmət növü</span><span className="font-medium">{xidmet}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sahə</span><span className="font-medium">{saheDeger} m²</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vahid qiymət ({tip})</span><span className="font-medium">{vahidQiymet} ₼/m²</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Xidmət qiyməti</span><span className="font-medium">{(saheDeger * vahidQiymet).toFixed(2)} ₼</span></div>
              {parseFloat(extraXerc) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Əlavə xərc</span><span className="font-medium">{parseFloat(extraXerc).toFixed(2)} ₼</span></div>}
              <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Ara cəm</span><span className="font-semibold">{araCem.toFixed(2)} ₼</span></div>
              {edvOdeyicisi && <div className="flex justify-between text-purple-700"><span>ƏDV (18%)</span><span>+{edvMeblegi.toFixed(2)} ₼</span></div>}
              <div className="flex justify-between py-3 px-4 bg-primary text-primary-foreground rounded-lg text-base font-bold mt-2">
                <span>ÜMUMİ</span><span>{umumi.toFixed(2)} ₼</span>
              </div>
            </div>
          </div>

          {/* Vahid qiymət cədvəli */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h4 className="font-semibold text-sm mb-3">Qiymət Cədvəli ({tip})</h4>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border"><th className="text-left py-1 font-medium">Xidmət</th><th className="text-right py-1 font-medium">₼/m²</th></tr></thead>
              <tbody>
                {XIDMETLER.map(x => (
                  <tr key={x.ad} className={`border-b border-border/50 ${x.ad === xidmet ? "bg-primary/10 font-semibold" : ""}`}>
                    <td className="py-1.5">{x.ad}</td>
                    <td className="py-1.5 text-right">{tip === "B2C" ? x.b2c : x.b2b} ₼</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button className="w-full gap-2" onClick={handleTeklifYarat} disabled={saving}>
            <FileCheck className="w-4 h-4" /> {saving ? "Saxlanılır..." : "Teklif Yarat"}
          </Button>
        </div>
      </div>
    </div>
  );
}