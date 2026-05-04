import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Check, BookOpen, Layers, FileText, TrendingUp, Building2 } from "lucide-react";
import moment from "moment";
import SirketDovriiyyesi from "@/components/maliyye/SirketDovriiyyesi";
import DebitorKreditorTab from "@/components/maliyye/DebitorKreditorTab";

const SINIFLER = ["1 - Aktivlər", "2 - Öhdəliklər", "3 - Kapital", "4 - Gəlirlər", "5 - Xərclər"];
const ISTINAD_TIPLERI = ["Faktura", "Sifariş", "Kassa", "Maaş", "Satınalma", "Manual"];

export default function Maliyye() {
  const [hesablar, setHesablar] = useState([]);
  const [jurnallar, setJurnallar] = useState([]);
  const [fakturalar, setFakturalar] = useState([]);
  const [kassaEmeliyyatlar, setKassaEmeliyyatlar] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [sifarisler, setSifarisler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHesabDialog, setShowHesabDialog] = useState(false);
  const [showJurnalDialog, setShowJurnalDialog] = useState(false);
  const [tarixBaslama, setTarixBaslama] = useState("");
  const [tarixBitis, setTarixBitis] = useState("");
  const [filterSinif, setFilterSinif] = useState("all");

  const [hesabForm, setHesabForm] = useState({ hesab_kodu: "", hesab_adi: "", sinif: "1 - Aktivlər", tip: "Ana hesab", ana_hesab_kodu: "", aciklama: "" });
  const [jurnalForm, setJurnalForm] = useState({ jurnal_no: "", tarix: "", debet_hesab: "", kredit_hesab: "", debet_mebleg: "", kredit_mebleg: "", aciklama: "", istinad_tipi: "Manual", edv_mebleg: "" });

  const fetchData = () => {
    Promise.all([
      base44.entities.HesabPlani.list().catch(() => []),
      base44.entities.JurnalQeydi.list("-created_date", 100).catch(() => []),
      base44.entities.Faktura.list("-created_date", 100).catch(() => []),
      base44.entities.KassaEmeliyyati.list("-created_date", 200).catch(() => []),
      base44.entities.Musteri.list().catch(() => []),
      base44.entities.Sifaris.list("-tarix", 500).catch(() => []),
    ]).then(([h, j, f, k, m, s]) => {
      setHesablar(h);
      setJurnallar(j);
      setFakturalar(f);
      setKassaEmeliyyatlar(k);
      setMusteriler(m);
      setSifarisler(s);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleHesabCreate = async () => {
    await base44.entities.HesabPlani.create({ ...hesabForm, qalan: 0, aktiv: true });
    setShowHesabDialog(false);
    setHesabForm({ hesab_kodu: "", hesab_adi: "", sinif: "1 - Aktivlər", tip: "Ana hesab", ana_hesab_kodu: "", aciklama: "" });
    fetchData();
  };

  const handleJurnalCreate = async () => {
    const no = `J-${Date.now().toString().slice(-6)}`;
    await base44.entities.JurnalQeydi.create({
      ...jurnalForm,
      jurnal_no: no,
      debet_mebleg: parseFloat(jurnalForm.debet_mebleg) || 0,
      kredit_mebleg: parseFloat(jurnalForm.kredit_mebleg) || 0,
      edv_mebleg: parseFloat(jurnalForm.edv_mebleg) || 0,
      status: "Gözləyir",
    });
    setShowJurnalDialog(false);
    setJurnalForm({ jurnal_no: "", tarix: "", debet_hesab: "", kredit_hesab: "", debet_mebleg: "", kredit_mebleg: "", aciklama: "", istinad_tipi: "Manual", edv_mebleg: "" });
    fetchData();
  };

  const handleJurnalTesdiq = async (id) => {
    await base44.entities.JurnalQeydi.update(id, { status: "Təsdiqləndi", tesdiq_eden: "Admin" });
    fetchData();
  };

  const filteredHesablar = hesablar.filter(h => filterSinif === "all" || h.sinif === filterSinif);

  const filteredJurnallar = jurnallar.filter(j => {
    if (!tarixBaslama && !tarixBitis) return true;
    const t = j.tarix;
    if (tarixBaslama && t < tarixBaslama) return false;
    if (tarixBitis && t > tarixBitis) return false;
    return true;
  });

  // Reports
  const gelirHesablar = hesablar.filter(h => h.sinif === "4 - Gəlirlər");
  const xercHesablar = hesablar.filter(h => h.sinif === "5 - Xərclər");
  const aktiveHesablar = hesablar.filter(h => h.sinif === "1 - Aktivlər");
  const ohdHesablar = hesablar.filter(h => h.sinif === "2 - Öhdəliklər");
  const kapitalHesablar = hesablar.filter(h => h.sinif === "3 - Kapital");

  const totalGelir = gelirHesablar.reduce((s, h) => s + (h.qalan || 0), 0);
  const totalXerc = xercHesablar.reduce((s, h) => s + (h.qalan || 0), 0);
  const menfeyet = totalGelir - totalXerc;

  const totalAktiv = aktiveHesablar.reduce((s, h) => s + (h.qalan || 0), 0);
  const totalOhd = ohdHesablar.reduce((s, h) => s + (h.qalan || 0), 0);
  const totalKapital = kapitalHesablar.reduce((s, h) => s + (h.qalan || 0), 0);

  const odenmemis = fakturalar.filter(f => f.odenis_statusu !== "Ödənilib");
  const debitorBorc = odenmemis.reduce((s, f) => s + (f.umumi_mebleg || 0) - (f.odenilmis_mebleg || 0), 0);
  const totalEdv = fakturalar.reduce((s, f) => s + (f.edv_meblegi || 0), 0);

  const kassaMedaxil = kassaEmeliyyatlar.filter(e => e.tip === "Mədaxil").reduce((s, e) => s + (e.mebleg || 0), 0);
  const kassaMexaric = kassaEmeliyyatlar.filter(e => e.tip === "Məxaric").reduce((s, e) => s + (e.mebleg || 0), 0);

  // Qismən ödənişlər hesablaması — odenilmis_mebleg birbaşa Sifaris-dən oxunur
  const qismenSifarisler = sifarisler.filter(s => s.odenis_statusu === "Qismən ödənilib");
  const qismenOdenisler = qismenSifarisler.map(s => {
    const umumi = s.umumi_mebleg || s.qiymet || 0;
    // Əgər Sifaris-də odenilmis_mebleg varsa istifadə et, yoxdursa KassaEmeliyyati-dan hesabla
    let odenilen = s.odenilmis_mebleg || 0;
    if (!odenilen) {
      const sifKassa = kassaEmeliyyatlar.filter(k => k.sifaris_id === s.id && k.tip === "Mədaxil");
      odenilen = sifKassa.reduce((acc, k) => acc + (k.mebleg || 0), 0);
    }
    const qaliq = Math.max(0, umumi - odenilen);
    return { ...s, odenilen, qaliq };
  });
  const qismenUmumiOdenilen = qismenOdenisler.reduce((s, x) => s + x.odenilen, 0);
  const qismenUmumiQaliq = qismenOdenisler.reduce((s, x) => s + x.qaliq, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maliyyə — Mühasibatlıq</h1>
        <p className="text-muted-foreground text-sm mt-1">1C stilində tam mühasibat sistemi</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Mənfəət/Zərər", value: menfeyet, icon: TrendingUp, color: menfeyet >= 0 ? "text-green-600" : "text-red-600" },
          { label: "Aktiv Cəmi", value: totalAktiv, icon: Layers, color: "text-primary" },
          { label: "Debitor Borc", value: debitorBorc, icon: FileText, color: "text-orange-600" },
          { label: "ƏDV (18%)", value: totalEdv, icon: BookOpen, color: "text-purple-600" },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value.toFixed(2)} ₼</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="hesabplan">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="hesabplan">Hesab Planı</TabsTrigger>
          <TabsTrigger value="jurnal">Jurnal Qeydləri</TabsTrigger>
          <TabsTrigger value="debitor">Debitor/Kreditor</TabsTrigger>
          <TabsTrigger value="mz">Mənfəət/Zərər</TabsTrigger>
          <TabsTrigger value="balans">Balans</TabsTrigger>
          <TabsTrigger value="edv">ƏDV Hesabatı</TabsTrigger>
          <TabsTrigger value="kassa">Kassa Hərəkəti</TabsTrigger>
          <TabsTrigger value="qismen" className="gap-1">Qismən Ödənişlər {qismenSifarisler.length > 0 && <span className="bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{qismenSifarisler.length}</span>}</TabsTrigger>
          <TabsTrigger value="sirket" className="gap-1"><Building2 className="w-3.5 h-3.5" />Şirkət Dövriyyəsi</TabsTrigger>
        </TabsList>

        {/* HESAB PLANI */}
        <TabsContent value="hesabplan" className="mt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant={filterSinif === "all" ? "default" : "outline"} onClick={() => setFilterSinif("all")}>Hamısı</Button>
              {SINIFLER.map(s => (
                <Button key={s} size="sm" variant={filterSinif === s ? "default" : "outline"} onClick={() => setFilterSinif(s)}>
                  {s.split(" - ")[1]}
                </Button>
              ))}
            </div>
            <Button className="gap-2" onClick={() => setShowHesabDialog(true)}><Plus className="w-4 h-4" /> Yeni Hesab</Button>
          </div>
          {SINIFLER.filter(s => filterSinif === "all" || s === filterSinif).map(sinif => {
            const sinifHesablar = filteredHesablar.filter(h => h.sinif === sinif);
            if (sinifHesablar.length === 0) return null;
            return (
              <div key={sinif} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="bg-primary/5 px-4 py-2.5 border-b border-border">
                  <h3 className="font-semibold text-sm">{sinif}</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Kod</th>
                      <th className="text-left px-4 py-2 font-medium">Hesab adı</th>
                      <th className="text-left px-4 py-2 font-medium">Tip</th>
                      <th className="text-right px-4 py-2 font-medium">Qalıq</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sinifHesablar.map(h => (
                      <tr key={h.id} className={`border-t border-border/50 hover:bg-muted/20 ${h.tip === "Alt hesab" ? "pl-4" : ""}`}>
                        <td className="px-4 py-2.5 font-mono font-medium">{h.tip === "Alt hesab" ? "  " : ""}{h.hesab_kodu}</td>
                        <td className="px-4 py-2.5">{h.tip === "Alt hesab" ? <span className="ml-4">{h.hesab_adi}</span> : <span className="font-semibold">{h.hesab_adi}</span>}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{h.tip}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{(h.qalan || 0).toFixed(2)} ₼</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${h.aktiv ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{h.aktiv ? "Aktiv" : "Deaktiv"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
          {filteredHesablar.length === 0 && <p className="text-center text-muted-foreground py-12">Hesab tapılmadı. Yeni hesab əlavə edin.</p>}
        </TabsContent>

        {/* JURNAL */}
        <TabsContent value="jurnal" className="mt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap items-center">
              <Input type="date" className="w-36" value={tarixBaslama} onChange={e => setTarixBaslama(e.target.value)} placeholder="Başlama" />
              <span className="text-muted-foreground">—</span>
              <Input type="date" className="w-36" value={tarixBitis} onChange={e => setTarixBitis(e.target.value)} placeholder="Bitmə" />
            </div>
            <Button className="gap-2" onClick={() => setShowJurnalDialog(true)}><Plus className="w-4 h-4" /> Yeni Qeyd</Button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">№</th>
                    <th className="text-left px-4 py-3 font-medium">Tarix</th>
                    <th className="text-left px-4 py-3 font-medium">Debet</th>
                    <th className="text-left px-4 py-3 font-medium">Kredit</th>
                    <th className="text-right px-4 py-3 font-medium">Məbləğ</th>
                    <th className="text-right px-4 py-3 font-medium">ƏDV</th>
                    <th className="text-left px-4 py-3 font-medium">Açıqlama</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJurnallar.map(j => (
                    <tr key={j.id} className="border-t border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-xs">{j.jurnal_no}</td>
                      <td className="px-4 py-2.5">{j.tarix ? moment(j.tarix).format("DD.MM.YYYY") : "—"}</td>
                      <td className="px-4 py-2.5 font-mono">{j.debet_hesab}</td>
                      <td className="px-4 py-2.5 font-mono">{j.kredit_hesab}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{(j.debet_mebleg || 0).toFixed(2)} ₼</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{j.edv_mebleg ? `${(j.edv_mebleg).toFixed(2)} ₼` : "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground max-w-[180px] truncate">{j.aciklama}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${j.status === "Təsdiqləndi" ? "bg-green-100 text-green-700" : j.status === "Ləğv edildi" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{j.status}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {j.status === "Gözləyir" && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600 text-xs" onClick={() => handleJurnalTesdiq(j.id)}>
                            <Check className="w-3.5 h-3.5 mr-1" /> Təsdiqlə
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredJurnallar.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Jurnal qeydi yoxdur</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* DEBITOR / KREDİTOR */}
        <TabsContent value="debitor" className="mt-4">
          <DebitorKreditorTab fakturalar={fakturalar} />
        </TabsContent>

        {/* MƏNFƏƏTvƏ ZƏRƏR */}
        <TabsContent value="mz" className="mt-4 space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-primary/5 px-5 py-3 border-b font-semibold">Mənfəət və Zərər Hesabatı</div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-2">GƏLİRLƏR (4000)</h4>
                {gelirHesablar.map(h => (
                  <div key={h.id} className="flex justify-between py-1 text-sm border-b border-border/30">
                    <span className="text-muted-foreground">{h.hesab_kodu} — {h.hesab_adi}</span>
                    <span className="font-medium">{(h.qalan || 0).toFixed(2)} ₼</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-bold text-green-700 border-t border-green-200 mt-1">
                  <span>Gəlirlər Cəmi</span><span>{totalGelir.toFixed(2)} ₼</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2">XƏRCLƏR (5000)</h4>
                {xercHesablar.map(h => (
                  <div key={h.id} className="flex justify-between py-1 text-sm border-b border-border/30">
                    <span className="text-muted-foreground">{h.hesab_kodu} — {h.hesab_adi}</span>
                    <span className="font-medium">{(h.qalan || 0).toFixed(2)} ₼</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-bold text-red-700 border-t border-red-200 mt-1">
                  <span>Xərclər Cəmi</span><span>{totalXerc.toFixed(2)} ₼</span>
                </div>
              </div>
              <div className={`flex justify-between py-3 px-4 rounded-lg font-bold text-lg ${menfeyet >= 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                <span>{menfeyet >= 0 ? "Xalis Mənfəət" : "Xalis Zərər"}</span>
                <span>{menfeyet.toFixed(2)} ₼</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* BALANS */}
        <TabsContent value="balans" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-blue-50 px-5 py-3 border-b font-semibold text-blue-900">AKTİVLƏR</div>
              <div className="p-5 space-y-2">
                {aktiveHesablar.map(h => (
                  <div key={h.id} className="flex justify-between py-1 text-sm">
                    <span className="text-muted-foreground">{h.hesab_kodu} — {h.hesab_adi}</span>
                    <span className="font-medium">{(h.qalan || 0).toFixed(2)} ₼</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-bold border-t border-border mt-2">
                  <span>Aktivlər Cəmi</span><span>{totalAktiv.toFixed(2)} ₼</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-orange-50 px-5 py-3 border-b font-semibold text-orange-900">ÖHDƏLİKLƏR + KAPİTAL</div>
              <div className="p-5 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Öhdəliklər</p>
                {ohdHesablar.map(h => (
                  <div key={h.id} className="flex justify-between py-1 text-sm">
                    <span className="text-muted-foreground">{h.hesab_kodu} — {h.hesab_adi}</span>
                    <span className="font-medium">{(h.qalan || 0).toFixed(2)} ₼</span>
                  </div>
                ))}
                <p className="text-xs font-semibold text-muted-foreground mt-3 mb-1">Kapital</p>
                {kapitalHesablar.map(h => (
                  <div key={h.id} className="flex justify-between py-1 text-sm">
                    <span className="text-muted-foreground">{h.hesab_kodu} — {h.hesab_adi}</span>
                    <span className="font-medium">{(h.qalan || 0).toFixed(2)} ₼</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-bold border-t border-border mt-2">
                  <span>Cəmi</span><span>{(totalOhd + totalKapital).toFixed(2)} ₼</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`mt-4 p-4 rounded-xl font-semibold text-center ${Math.abs(totalAktiv - totalOhd - totalKapital) < 0.01 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {Math.abs(totalAktiv - totalOhd - totalKapital) < 0.01 ? "✓ Balans tarazdır" : `⚠ Fərq: ${(totalAktiv - totalOhd - totalKapital).toFixed(2)} ₼`}
          </div>
        </TabsContent>

        {/* ƏDV */}
        <TabsContent value="edv" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">ƏDV Hesabatı</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-xs text-purple-700">ƏDV-li fakturalar</p>
                <p className="text-2xl font-bold text-purple-800">{fakturalar.filter(f => f.edv_faizi > 0).length}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-xs text-purple-700">Ümumi ƏDV məbləği</p>
                <p className="text-2xl font-bold text-purple-800">{totalEdv.toFixed(2)} ₼</p>
              </div>
              <div className="bg-gray-50 border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">ƏDV-siz fakturalar</p>
                <p className="text-2xl font-bold">{fakturalar.filter(f => !f.edv_faizi || f.edv_faizi === 0).length}</p>
              </div>
            </div>
            <table className="w-full text-sm mt-4">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Faktura №</th>
                  <th className="text-left px-4 py-2 font-medium">Müştəri</th>
                  <th className="text-right px-4 py-2 font-medium">Ara cəm</th>
                  <th className="text-right px-4 py-2 font-medium">ƏDV %</th>
                  <th className="text-right px-4 py-2 font-medium">ƏDV məbləği</th>
                </tr>
              </thead>
              <tbody>
                {fakturalar.filter(f => f.edv_faizi > 0).map(f => (
                  <tr key={f.id} className="border-t border-border/50">
                    <td className="px-4 py-2">{f.faktura_no}</td>
                    <td className="px-4 py-2">{f.musteri_adi}</td>
                    <td className="px-4 py-2 text-right">{(f.ara_cem || 0).toFixed(2)} ₼</td>
                    <td className="px-4 py-2 text-right">{f.edv_faizi}%</td>
                    <td className="px-4 py-2 text-right font-semibold text-purple-700">{(f.edv_meblegi || 0).toFixed(2)} ₼</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* KASSA */}
        <TabsContent value="kassa" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs text-green-700">Mədaxil</p>
                <p className="text-2xl font-bold text-green-800">{kassaMedaxil.toFixed(2)} ₼</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs text-red-700">Məxaric</p>
                <p className="text-2xl font-bold text-red-800">{kassaMexaric.toFixed(2)} ₼</p>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-xs text-primary">Xalis hərəkət</p>
                <p className="text-2xl font-bold text-primary">{(kassaMedaxil - kassaMexaric).toFixed(2)} ₼</p>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Tarix</th>
                  <th className="text-left px-4 py-2 font-medium">Tip</th>
                  <th className="text-left px-4 py-2 font-medium">Kateqoriya</th>
                  <th className="text-right px-4 py-2 font-medium">Məbləğ</th>
                </tr>
              </thead>
              <tbody>
                {kassaEmeliyyatlar.slice(0, 30).map(e => (
                  <tr key={e.id} className="border-t border-border/50">
                    <td className="px-4 py-2">{e.tarix ? moment(e.tarix).format("DD.MM.YYYY HH:mm") : "—"}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.tip === "Mədaxil" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{e.tip}</span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{e.kateqoriya}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${e.tip === "Mədaxil" ? "text-green-600" : "text-red-600"}`}>
                      {e.tip === "Mədaxil" ? "+" : "−"}{(e.mebleg || 0).toFixed(2)} ₼
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        {/* QİSMƏN ÖDƏNİŞLƏR */}
        <TabsContent value="qismen" className="mt-4 space-y-4">
          {/* KPI xülasə */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs text-orange-700">Qismən ödənilib (sifariş sayı)</p>
              <p className="text-2xl font-bold text-orange-800">{qismenSifarisler.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs text-green-700">Ümumi ödənilən</p>
              <p className="text-2xl font-bold text-green-800">{qismenUmumiOdenilen.toFixed(2)} ₼</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs text-red-700">Ümumi qalıq borc</p>
              <p className="text-2xl font-bold text-red-800">{qismenUmumiQaliq.toFixed(2)} ₼</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="font-semibold text-sm">Qismən Ödənilmiş Sifarişlər</span>
              <span className="text-xs text-muted-foreground">Qalıq borc: <span className="font-bold text-red-600">{qismenUmumiQaliq.toFixed(2)} ₼</span></span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Sifariş №</th>
                    <th className="text-left px-4 py-3 font-medium">Müştəri</th>
                    <th className="text-left px-4 py-3 font-medium">Xidmət</th>
                    <th className="text-left px-4 py-3 font-medium">Tarix</th>
                    <th className="text-right px-4 py-3 font-medium">Ümumi məbləğ</th>
                    <th className="text-right px-4 py-3 font-medium text-green-700">Ödənilən</th>
                    <th className="text-right px-4 py-3 font-medium text-red-700">Qalıq borc</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {qismenOdenisler.map(s => (
                    <tr key={s.id} className="border-t border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium font-mono text-xs">{s.sifaris_no || "—"}</td>
                      <td className="px-4 py-3 font-medium">{s.musteri_adi || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">{s.xidmet_tipi}</td>
                      <td className="px-4 py-3 text-xs">{s.tarix ? moment(s.tarix).format("DD.MM.YYYY") : "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold">{(s.umumi_mebleg || s.qiymet || 0).toFixed(2)} ₼</td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">{s.odenilen.toFixed(2)} ₼</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">{s.qaliq.toFixed(2)} ₼</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Qismən ödənilib</span>
                      </td>
                    </tr>
                  ))}
                  {qismenOdenisler.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Qismən ödənilib sifarişi yoxdur</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ŞİRKƏT DÖVRİYYƏSİ */}
        <TabsContent value="sirket" className="mt-4">
          <SirketDovriiyyesi musteriler={musteriler} sifarisler={sifarisler} kassaEmeliyyatlar={kassaEmeliyyatlar} />
        </TabsContent>

      </Tabs>

      {/* New Hesab Dialog */}
      <Dialog open={showHesabDialog} onOpenChange={setShowHesabDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Hesab</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Hesab kodu *</Label><Input value={hesabForm.hesab_kodu} onChange={e => setHesabForm(f => ({...f, hesab_kodu: e.target.value}))} placeholder="1000" /></div>
              <div><Label>Hesab adı *</Label><Input value={hesabForm.hesab_adi} onChange={e => setHesabForm(f => ({...f, hesab_adi: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sinif *</Label>
                <Select value={hesabForm.sinif} onValueChange={v => setHesabForm(f => ({...f, sinif: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SINIFLER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tip</Label>
                <Select value={hesabForm.tip} onValueChange={v => setHesabForm(f => ({...f, tip: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ana hesab">Ana hesab</SelectItem>
                    <SelectItem value="Alt hesab">Alt hesab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hesabForm.tip === "Alt hesab" && <div><Label>Ana hesab kodu</Label><Input value={hesabForm.ana_hesab_kodu} onChange={e => setHesabForm(f => ({...f, ana_hesab_kodu: e.target.value}))} /></div>}
            <div><Label>Açıqlama</Label><Textarea value={hesabForm.aciklama} onChange={e => setHesabForm(f => ({...f, aciklama: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleHesabCreate}>Yarat</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Jurnal Dialog */}
      <Dialog open={showJurnalDialog} onOpenChange={setShowJurnalDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Jurnal Qeydi</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tarix *</Label><Input type="date" value={jurnalForm.tarix} onChange={e => setJurnalForm(f => ({...f, tarix: e.target.value}))} /></div>
              <div>
                <Label>İstinad tipi</Label>
                <Select value={jurnalForm.istinad_tipi} onValueChange={v => setJurnalForm(f => ({...f, istinad_tipi: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ISTINAD_TIPLERI.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Debet hesab *</Label>
                <Select value={jurnalForm.debet_hesab} onValueChange={v => setJurnalForm(f => ({...f, debet_hesab: v}))}>
                  <SelectTrigger><SelectValue placeholder="Hesab seçin" /></SelectTrigger>
                  <SelectContent>{hesablar.map(h => <SelectItem key={h.id} value={h.hesab_kodu}>{h.hesab_kodu} — {h.hesab_adi}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kredit hesab *</Label>
                <Select value={jurnalForm.kredit_hesab} onValueChange={v => setJurnalForm(f => ({...f, kredit_hesab: v}))}>
                  <SelectTrigger><SelectValue placeholder="Hesab seçin" /></SelectTrigger>
                  <SelectContent>{hesablar.map(h => <SelectItem key={h.id} value={h.hesab_kodu}>{h.hesab_kodu} — {h.hesab_adi}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Debet məbləği *</Label><Input type="number" value={jurnalForm.debet_mebleg} onChange={e => setJurnalForm(f => ({...f, debet_mebleg: e.target.value, kredit_mebleg: e.target.value}))} /></div>
              <div><Label>ƏDV məbləği</Label><Input type="number" value={jurnalForm.edv_mebleg} onChange={e => setJurnalForm(f => ({...f, edv_mebleg: e.target.value}))} /></div>
            </div>
            <div><Label>Açıqlama</Label><Textarea value={jurnalForm.aciklama} onChange={e => setJurnalForm(f => ({...f, aciklama: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleJurnalCreate}>Qeyd yarat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}