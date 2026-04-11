import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, Download } from "lucide-react";

export default function Maas() {
  const [iscilar, setIscilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ay, setAy] = useState(new Date().getMonth().toString());

  useEffect(() => {
    base44.entities.Isci.list().then(data => { setIscilar(data.filter(i => i.status === "Aktiv")); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const aylar = ["Yanvar","Fevral","Mart","Aprel","May","İyun","İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
  const totalMaas = iscilar.reduce((sum, i) => sum + (i.maas || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maaş Hesablaması</h1>
          <p className="text-muted-foreground text-sm mt-1">Payroll idarəetməsi</p>
        </div>
        <Select value={ay} onValueChange={setAy}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{aylar.map((a, i) => <SelectItem key={i} value={i.toString()}>{a}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <Banknote className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Ümumi Maaş Fondu — {aylar[parseInt(ay)]}</span>
        </div>
        <p className="text-3xl font-bold">{totalMaas.toFixed(2)} ₼</p>
        <p className="text-sm text-muted-foreground mt-1">{iscilar.length} aktiv işçi</p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">İşçi</th>
                <th className="text-left px-4 py-3 font-medium">Vəzifə</th>
                <th className="text-left px-4 py-3 font-medium">Komanda</th>
                <th className="text-right px-4 py-3 font-medium">Əsas maaş</th>
                <th className="text-right px-4 py-3 font-medium">DSMF (3.5%)</th>
                <th className="text-right px-4 py-3 font-medium">Gəlir vergisi</th>
                <th className="text-right px-4 py-3 font-medium">Xalis maaş</th>
              </tr>
            </thead>
            <tbody>
              {iscilar.map(i => {
                const maas = i.maas || 0;
                const dsmf = maas * 0.035;
                const gelirVergisi = maas > 2500 ? (maas - 2500) * 0.14 : 0;
                const xalis = maas - dsmf - gelirVergisi;
                return (
                  <tr key={i.id} className="border-t border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{i.ad_soyad}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.vezife}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.komanda || "—"}</td>
                    <td className="px-4 py-3 text-right">{maas.toFixed(2)} ₼</td>
                    <td className="px-4 py-3 text-right text-red-600">-{dsmf.toFixed(2)} ₼</td>
                    <td className="px-4 py-3 text-right text-red-600">-{gelirVergisi.toFixed(2)} ₼</td>
                    <td className="px-4 py-3 text-right font-semibold">{xalis.toFixed(2)} ₼</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-muted/30">
              <tr>
                <td colSpan={3} className="px-4 py-3 font-semibold">Cəmi</td>
                <td className="px-4 py-3 text-right font-semibold">{totalMaas.toFixed(2)} ₼</td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">-{(totalMaas * 0.035).toFixed(2)} ₼</td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">
                  -{iscilar.reduce((s, i) => s + (i.maas > 2500 ? (i.maas - 2500) * 0.14 : 0), 0).toFixed(2)} ₼
                </td>
                <td className="px-4 py-3 text-right font-bold">
                  {iscilar.reduce((s, i) => {
                    const m = i.maas || 0;
                    return s + m - m * 0.035 - (m > 2500 ? (m - 2500) * 0.14 : 0);
                  }, 0).toFixed(2)} ₼
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}