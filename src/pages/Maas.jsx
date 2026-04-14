import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Plus, Check } from "lucide-react";
import DeleteButton from "@/components/DeleteButton";

const AYLAR = ["Yanvar","Fevral","Mart","Aprel","May","İyun","İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"];

function hesabla(nominal, bonus = 0, overtaym = 0) {
  const brutto = (parseFloat(nominal) || 0) + (parseFloat(bonus) || 0) + (parseFloat(overtaym) || 0);
  const dsmfIsci = brutto * 0.03;
  const issizIsci = brutto * 0.005;
  const tibbiIsci = brutto * 0.02;

  let gelirVergisi = 0;
  if (brutto <= 8000) {
    gelirVergisi = brutto * 0.14;
  } else {
    gelirVergisi = 8000 * 0.14 + (brutto - 8000) * 0.25;
  }

  const xalisMaas = brutto - dsmfIsci - issizIsci - tibbiIsci - gelirVergisi;

  const dsmfIsveren = brutto * 0.22;
  const issizIsveren = brutto * 0.005;
  const tibbiIsveren = brutto * 0.02;
  const umumiXerc = brutto + dsmfIsveren + issizIsveren + tibbiIsveren;

  return {
    brutto,
    dsmfIsci,
    issizIsci,
    tibbiIsci,
    gelirVergisi,
    xalisMaas,
    dsmfIsveren,
    issizIsveren,
    tibbiIsveren,
    umumiXerc,
  };
}

function Payslip({ isci, ay, il, hesab, eldenOdenis, bankOdenis }) {
  return (
    <div className="bg-white border-2 border-border rounded-xl p-8 text-sm font-mono print:border-0">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold non-mono">CleanPro MMC</h2>
          <p className="text-muted-foreground">Maaş vərəqəsi</p>
        </div>
        <div className="text-right">
          <p className="font-bold">{AYLAR[parseInt(ay)]} {il}</p>
          <p className="text-muted-foreground">{isci?.ad_soyad}</p>
          <p className="text-muted-foreground">{isci?.vezife}</p>
        </div>
      </div>
      <table className="w-full border-collapse border border-border text-sm">
        <tbody>
          <tr className="bg-muted/30"><td className="border border-border px-3 py-2 font-semibold" colSpan={2}>HESABLAMALAR</td></tr>
          <tr><td className="border border-border px-3 py-1.5">Nominal maaş</td><td className="border border-border px-3 py-1.5 text-right">{hesab.brutto.toFixed(2)} ₼</td></tr>
          <tr className="bg-red-50"><td className="border border-border px-3 py-2 font-semibold" colSpan={2}>TUTULMALAR (İŞÇİ)</td></tr>
          <tr className="text-red-700"><td className="border border-border px-3 py-1.5">DSMF (3%)</td><td className="border border-border px-3 py-1.5 text-right">-{hesab.dsmfIsci.toFixed(2)} ₼</td></tr>
          <tr className="text-red-700"><td className="border border-border px-3 py-1.5">İşsizlik sığortası (0.5%)</td><td className="border border-border px-3 py-1.5 text-right">-{hesab.issizIsci.toFixed(2)} ₼</td></tr>
          <tr className="text-red-700"><td className="border border-border px-3 py-1.5">Tibbi sığorta (2%)</td><td className="border border-border px-3 py-1.5 text-right">-{hesab.tibbiIsci.toFixed(2)} ₼</td></tr>
          <tr className="text-red-700"><td className="border border-border px-3 py-1.5">Gəlir vergisi ({hesab.brutto <= 8000 ? "14%" : "14%+25%"})</td><td className="border border-border px-3 py-1.5 text-right">-{hesab.gelirVergisi.toFixed(2)} ₼</td></tr>
          <tr className="bg-green-50 font-bold"><td className="border border-border px-3 py-2">XALİS MAAŞ</td><td className="border border-border px-3 py-2 text-right text-green-700">{hesab.xalisMaas.toFixed(2)} ₼</td></tr>
          <tr><td className="border border-border px-3 py-1.5">Kart ilə ödəniş</td><td className="border border-border px-3 py-1.5 text-right">{(parseFloat(bankOdenis) || 0).toFixed(2)} ₼</td></tr>
          <tr><td className="border border-border px-3 py-1.5">Nağd ödəniş</td><td className="border border-border px-3 py-1.5 text-right">{(parseFloat(eldenOdenis) || 0).toFixed(2)} ₼</td></tr>
          <tr className="bg-blue-50"><td className="border border-border px-3 py-2 font-semibold" colSpan={2}>İŞVƏRƏN ÖHDƏLİKLƏRİ (ayrıca)</td></tr>
          <tr className="text-blue-700"><td className="border border-border px-3 py-1.5">DSMF işvərən (22%)</td><td className="border border-border px-3 py-1.5 text-right">{hesab.dsmfIsveren.toFixed(2)} ₼</td></tr>
          <tr className="text-blue-700"><td className="border border-border px-3 py-1.5">İşsizlik işvərən (0.5%)</td><td className="border border-border px-3 py-1.5 text-right">{hesab.issizIsveren.toFixed(2)} ₼</td></tr>
          <tr className="text-blue-700"><td className="border border-border px-3 py-1.5">Tibbi sığorta işvərən (2%)</td><td className="border border-border px-3 py-1.5 text-right">{hesab.tibbiIsveren.toFixed(2)} ₼</td></tr>
          <tr className="bg-blue-100 font-bold"><td className="border border-border px-3 py-2">İŞVƏRƏNİN ÜMUMİ XƏRCİ</td><td className="border border-border px-3 py-2 text-right text-blue-800">{hesab.umumiXerc.toFixed(2)} ₼</td></tr>
        </tbody>
      </table>
      <div className="mt-6 flex justify-between text-xs text-muted-foreground">
        <span>Çap tarixi: {new Date().toLocaleDateString("az-AZ")}</span>
        <span>İmza: _________________</span>
      </div>
    </div>
  );
}

export default function Maas() {
  const [iscilar, setIscilar] = useState([]);
  const [hesablamalar, setHesablamalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ay, setAy] = useState(new Date().getMonth().toString());
  const [il, setIl] = useState(new Date().getFullYear().toString());
  const [showDialog, setShowDialog] = useState(false);
  const [selectedIsci, setSelectedIsci] = useState(null);
  const [payslipIsci, setPayslipIsci] = useState(null);

  const [form, setForm] = useState({
    isci_id: "", nominal: "", bonus: "0", overtaym: "0", eldenOdenis: "0", bankOdenis: "",
  });

  const hesab = hesabla(form.nominal, form.bonus, form.overtaym);

  useEffect(() => {
    Promise.all([
      base44.entities.Isci.list(),
      base44.entities.MaasHesablamasi.list("-created_date", 100).catch(() => []),
    ]).then(([i, h]) => { setIscilar(i.filter(x => x.status === "Aktiv")); setHesablamalar(h); setLoading(false); });
  }, []);

  const fetchHesablamalar = () => {
    base44.entities.MaasHesablamasi.list("-created_date", 100).catch(() => []).then(setHesablamalar);
  };

  const handleFormChange = (key, val) => {
    setForm(f => {
      const updated = { ...f, [key]: val };
      if (key === "nominal" || key === "bonus" || key === "overtaym") {
        const h = hesabla(updated.nominal, updated.bonus, updated.overtaym);
        updated.bankOdenis = updated.bankOdenis || h.xalisMaas.toFixed(2);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    const isci = iscilar.find(i => i.id === form.isci_id);
    const h = hesabla(form.nominal, form.bonus, form.overtaym);
    await base44.entities.MaasHesablamasi.create({
      isci_id: form.isci_id,
      isci_adi: isci?.ad_soyad || "",
      ay: AYLAR[parseInt(ay)],
      il,
      nagilmaas: h.brutto,
      dsmf_isci_meblegi: h.dsmfIsci,
      dsmf_isci_faizi: 3,
      iscisigortasi_isci_meblegi: h.issizIsci,
      tibbiSigortaIsciMeblegi: h.tibbiIsci,
      gelirvergisi: h.gelirVergisi,
      gelirvergisi_faizi: h.brutto <= 8000 ? "14%" : "14%+25%",
      ixtisarici_maas: h.xalisMaas,
      dsmf_isverenin_meblegi: h.dsmfIsveren,
      dsmf_isverenin_faizi: 22,
      iscisigortasi_iverenin_meblegi: h.issizIsveren,
      tibbiSigortaIverenMeblegi: h.tibbiIsveren,
      umumi_isverenin_xerci: h.umumiXerc,
      elden_odenis: parseFloat(form.eldenOdenis) || 0,
      bank_odenis: parseFloat(form.bankOdenis) || h.xalisMaas,
      bonus: parseFloat(form.bonus) || 0,
      status: "Hazırlanıb",
      odenis_statusu: "Ödənilməyib",
    });
    setShowDialog(false);
    setForm({ isci_id: "", nominal: "", bonus: "0", overtaym: "0", eldenOdenis: "0", bankOdenis: "" });
    fetchHesablamalar();
  };

  const handleOdendi = async (id) => {
    await base44.entities.MaasHesablamasi.update(id, { status: "Ödənildi", odenis_statusu: "Ödənilib" });
    fetchHesablamalar();
  };

  const handleDelete = async (id) => {
    await base44.entities.MaasHesablamasi.delete(id);
    fetchHesablamalar();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const ayHesablamalar = hesablamalar.filter(h => h.ay === AYLAR[parseInt(ay)] && h.il === il);
  const totalFond = ayHesablamalar.reduce((s, h) => s + (h.umumi_isverenin_xerci || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maaş Hesablaması</h1>
          <p className="text-muted-foreground text-sm mt-1">Azərbaycan DSMF 2026 dərəcələri</p>
        </div>
        <div className="flex gap-2">
          <Select value={ay} onValueChange={setAy}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{AYLAR.map((a, i) => <SelectItem key={i} value={i.toString()}>{a}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={il} onValueChange={setIl}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["2024","2025","2026"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button className="gap-2" onClick={() => setShowDialog(true)}><Plus className="w-4 h-4" /> Hesabla</Button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-5 border border-primary/20 flex gap-6 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground">Ümumi Maaş Fondu</p>
          <p className="text-2xl font-bold">{totalFond.toFixed(2)} ₼</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">İşçi sayı</p>
          <p className="text-2xl font-bold">{ayHesablamalar.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Ödənilmiş</p>
          <p className="text-2xl font-bold text-green-600">{ayHesablamalar.filter(h => h.odenis_statusu === "Ödənilib").length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Gözləyir</p>
          <p className="text-2xl font-bold text-yellow-600">{ayHesablamalar.filter(h => h.odenis_statusu !== "Ödənilib").length}</p>
        </div>
      </div>

      <Tabs defaultValue="siyahi">
        <TabsList>
          <TabsTrigger value="siyahi">Maaş Siyahısı</TabsTrigger>
          <TabsTrigger value="kalkulyator">Kalkulyator</TabsTrigger>
        </TabsList>

        <TabsContent value="siyahi" className="mt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">İşçi</th>
                    <th className="text-right px-4 py-3 font-medium">Brutto</th>
                    <th className="text-right px-4 py-3 font-medium">Tutulmalar</th>
                    <th className="text-right px-4 py-3 font-medium">Xalis maaş</th>
                    <th className="text-right px-4 py-3 font-medium">İşvərən xərci</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {ayHesablamalar.map(h => {
                    const tutulma = (h.dsmf_isci_meblegi || 0) + (h.iscisigortasi_isci_meblegi || 0) + (h.tibbiSigortaIsciMeblegi || 0) + (h.gelirvergisi || 0);
                    const isci = iscilar.find(i => i.id === h.isci_id);
                    return (
                      <tr key={h.id} className="border-t border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="font-medium">{h.isci_adi}</p>
                          <p className="text-xs text-muted-foreground">{isci?.vezife || h.isci_adi || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-right">{(h.nagilmaas || 0).toFixed(2)} ₼</td>
                        <td className="px-4 py-3 text-right text-red-600">-{tutulma.toFixed(2)} ₼</td>
                        <td className="px-4 py-3 text-right font-semibold">{(h.ixtisarici_maas || 0).toFixed(2)} ₼</td>
                        <td className="px-4 py-3 text-right text-blue-700">{(h.umumi_isverenin_xerci || 0).toFixed(2)} ₼</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.odenis_statusu === "Ödənilib" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {h.odenis_statusu}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 items-center">
                           <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setPayslipIsci({ h, isci })}>
                             <Printer className="w-3.5 h-3.5" />
                           </Button>
                           {h.odenis_statusu !== "Ödənilib" && (
                             <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-green-600" onClick={() => handleOdendi(h.id)}>
                               <Check className="w-3.5 h-3.5" />
                             </Button>
                           )}
                           <DeleteButton onDelete={() => handleDelete(h.id)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {ayHesablamalar.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Bu ay üçün maaş hesablaması yoxdur</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kalkulyator" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold">Maaş kalkulyatoru</h3>
              <div>
                <Label>İşçi seç</Label>
                <Select value={form.isci_id} onValueChange={v => handleFormChange("isci_id", v)}>
                  <SelectTrigger><SelectValue placeholder="İşçi seçin" /></SelectTrigger>
                  <SelectContent>{iscilar.map(i => <SelectItem key={i.id} value={i.id}>{i.ad_soyad} — {(i.maas || 0)} ₼</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Nominal maaş (₼)</Label>
                  <Input type="number" value={form.nominal} onChange={e => handleFormChange("nominal", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Bonus (₼)</Label>
                  <Input type="number" value={form.bonus} onChange={e => handleFormChange("bonus", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Overtaym (₼)</Label>
                  <Input type="number" value={form.overtaym} onChange={e => handleFormChange("overtaym", e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Kart ilə ödəniş (₼)</Label>
                  <Input type="number" value={form.bankOdenis} onChange={e => handleFormChange("bankOdenis", e.target.value)} placeholder={hesab.xalisMaas.toFixed(2)} />
                </div>
                <div>
                  <Label>Nağd ödəniş (₼)</Label>
                  <Input type="number" value={form.eldenOdenis} onChange={e => handleFormChange("eldenOdenis", e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-sm">
              <h3 className="font-semibold">Hesablama nəticəsi (real-time)</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Brutto maaş</span>
                  <span className="font-semibold">{hesab.brutto.toFixed(2)} ₼</span>
                </div>
                <p className="text-xs font-medium text-red-700 pt-1">İşçi tutulmaları:</p>
                <div className="flex justify-between text-red-600"><span>DSMF (3%)</span><span>-{hesab.dsmfIsci.toFixed(2)} ₼</span></div>
                <div className="flex justify-between text-red-600"><span>İşsizlik (0.5%)</span><span>-{hesab.issizIsci.toFixed(2)} ₼</span></div>
                <div className="flex justify-between text-red-600"><span>Tibbi sığorta (2%)</span><span>-{hesab.tibbiIsci.toFixed(2)} ₼</span></div>
                <div className="flex justify-between text-red-600"><span>Gəlir vergisi ({hesab.brutto <= 8000 ? "14%" : "14%+25%"})</span><span>-{hesab.gelirVergisi.toFixed(2)} ₼</span></div>
                <div className="flex justify-between py-2 border-y border-border font-bold text-green-700">
                  <span>XALİS MAAŞ</span><span>{hesab.xalisMaas.toFixed(2)} ₼</span>
                </div>
                <p className="text-xs font-medium text-blue-700 pt-1">İşvərən öhdəlikləri (əlavə):</p>
                <div className="flex justify-between text-blue-600"><span>DSMF (22%)</span><span>{hesab.dsmfIsveren.toFixed(2)} ₼</span></div>
                <div className="flex justify-between text-blue-600"><span>İşsizlik (0.5%)</span><span>{hesab.issizIsveren.toFixed(2)} ₼</span></div>
                <div className="flex justify-between text-blue-600"><span>Tibbi sığorta (2%)</span><span>{hesab.tibbiIsveren.toFixed(2)} ₼</span></div>
                <div className="flex justify-between py-2 border-t border-border font-bold text-blue-800">
                  <span>İŞVƏRƏN ÜMUMİ XƏRCİ</span><span>{hesab.umumiXerc.toFixed(2)} ₼</span>
                </div>
              </div>
              {form.isci_id && form.nominal && (
                <Button className="w-full mt-2" onClick={handleSave}>Saxla</Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payslip Dialog */}
      {payslipIsci && (
        <Dialog open={!!payslipIsci} onOpenChange={() => setPayslipIsci(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Maaş Vərəqəsi</DialogTitle>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" /> Çap et
                </Button>
              </div>
            </DialogHeader>
            <Payslip
              isci={payslipIsci.isci}
              ay={AYLAR.indexOf(payslipIsci.h.ay).toString()}
              il={payslipIsci.h.il}
              hesab={{
                brutto: payslipIsci.h.nagilmaas || 0,
                dsmfIsci: payslipIsci.h.dsmf_isci_meblegi || 0,
                issizIsci: payslipIsci.h.iscisigortasi_isci_meblegi || 0,
                tibbiIsci: payslipIsci.h.tibbiSigortaIsciMeblegi || 0,
                gelirVergisi: payslipIsci.h.gelirvergisi || 0,
                xalisMaas: payslipIsci.h.ixtisarici_maas || 0,
                dsmfIsveren: payslipIsci.h.dsmf_isverenin_meblegi || 0,
                issizIsveren: payslipIsci.h.iscisigortasi_iverenin_meblegi || 0,
                tibbiIsveren: payslipIsci.h.tibbiSigortaIverenMeblegi || 0,
                umumiXerc: payslipIsci.h.umumi_isverenin_xerci || 0,
              }}
              eldenOdenis={payslipIsci.h.elden_odenis}
              bankOdenis={payslipIsci.h.bank_odenis}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* New Hesabla Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Yeni Maaş Hesablaması</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>İşçi *</Label>
              <Select value={form.isci_id} onValueChange={v => {
                const isci = iscilar.find(i => i.id === v);
                handleFormChange("isci_id", v);
                handleFormChange("nominal", (isci?.maas || "").toString());
              }}>
                <SelectTrigger><SelectValue placeholder="İşçi seçin" /></SelectTrigger>
                <SelectContent>{iscilar.map(i => <SelectItem key={i.id} value={i.id}>{i.ad_soyad}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Nominal (₼)</Label><Input type="number" value={form.nominal} onChange={e => handleFormChange("nominal", e.target.value)} /></div>
              <div><Label>Bonus (₼)</Label><Input type="number" value={form.bonus} onChange={e => handleFormChange("bonus", e.target.value)} /></div>
              <div><Label>Overtaym (₼)</Label><Input type="number" value={form.overtaym} onChange={e => handleFormChange("overtaym", e.target.value)} /></div>
            </div>
            {form.nominal && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between font-semibold text-green-700"><span>Xalis maaş:</span><span>{hesab.xalisMaas.toFixed(2)} ₼</span></div>
                <div className="flex justify-between text-blue-700"><span>İşvərən xərci:</span><span>{hesab.umumiXerc.toFixed(2)} ₼</span></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kart ödənişi (₼)</Label><Input type="number" value={form.bankOdenis} onChange={e => handleFormChange("bankOdenis", e.target.value)} placeholder={hesab.xalisMaas.toFixed(2)} /></div>
              <div><Label>Nağd ödəniş (₼)</Label><Input type="number" value={form.eldenOdenis} onChange={e => handleFormChange("eldenOdenis", e.target.value)} /></div>
            </div>
            <Button className="w-full" onClick={handleSave}>Saxla</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}