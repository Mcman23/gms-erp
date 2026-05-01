import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Users, DollarSign, Briefcase } from "lucide-react";

export default function PodratciHesabati() {
  const [podratcilar, setPodratcilar] = useState([]);
  const [sifarisler, setSifarisler] = useState([]);
  const [xercler, setXercler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Podratci.list(),
      base44.entities.Sifaris.list("-created_date", 500),
      base44.entities.SifarisXerci.list("-created_date", 500),
    ]).then(([p, s, x]) => {
      setPodratcilar(p);
      setSifarisler(s);
      setXercler(x);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  // Build stats per contractor
  const stats = podratcilar.map(p => {
    const pSifarisler = sifarisler.filter(s => s.podratci_id === p.id);
    const pXercler = xercler.filter(x => pSifarisler.some(s => s.id === x.sifaris_id));

    const sifarisSayi = pSifarisler.length;
    const umumiGelir = pSifarisler.reduce((sum, s) => sum + (s.umumi_mebleg || s.qiymet || 0), 0);
    const podratciXerci = pXercler.reduce((sum, x) => sum + (x.mebleg || 0), 0);
    const komissiyaFaizi = p.komissiya_faizi || 20;
    // Podratçının qazancı = ümumi gəlir * (1 - komissiya faizi)
    const podratciQazanci = umumiGelir * (1 - komissiyaFaizi / 100);
    // Şirkətin qazancı = ümumi gəlir * komissiya faizi (komissiya gəliri)
    const sirketQazanci = umumiGelir * (komissiyaFaizi / 100);

    return {
      id: p.id,
      ad: p.ad,
      tip: p.tip,
      komissiyaFaizi,
      sifarisSayi,
      umumiGelir,
      podratciQazanci,
      sirketQazanci,
      podratciXerci,
      sifarisler: pSifarisler,
    };
  }).filter(s => s.sifarisSayi > 0 || true); // show all

  const totalSirketQazanci = stats.reduce((s, p) => s + p.sirketQazanci, 0);
  const totalPodratciQazanci = stats.reduce((s, p) => s + p.podratciQazanci, 0);
  const totalSifaris = stats.reduce((s, p) => s + p.sifarisSayi, 0);

  const chartData = stats.map(p => ({
    name: p.ad.length > 12 ? p.ad.slice(0, 12) + "…" : p.ad,
    "Şirkət qazancı": +p.sirketQazanci.toFixed(2),
    "Podratçı qazancı": +p.podratciQazanci.toFixed(2),
    "Ümumi dövriyyə": +p.umumiGelir.toFixed(2),
  }));

  const selectedStats = selected ? stats.find(s => s.id === selected) : null;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="w-4 h-4" /> Podratçı sayı</div>
          <div className="text-2xl font-bold">{podratcilar.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Briefcase className="w-4 h-4" /> Ümumi sifariş</div>
          <div className="text-2xl font-bold">{totalSifaris}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="w-4 h-4" /> Şirkət qazancı</div>
          <div className="text-2xl font-bold text-green-600">{totalSirketQazanci.toFixed(2)} ₼</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="w-4 h-4" /> Podratçı qazancı</div>
          <div className="text-2xl font-bold text-blue-600">{totalPodratciQazanci.toFixed(2)} ₼</div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Podratçı üzrə qazanc müqayisəsi</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `${v} ₼`} />
              <Legend />
              <Bar dataKey="Ümumi dövriyyə" fill="hsl(210,80%,65%)" radius={[3,3,0,0]} />
              <Bar dataKey="Şirkət qazancı" fill="hsl(165,60%,42%)" radius={[3,3,0,0]} />
              <Bar dataKey="Podratçı qazancı" fill="hsl(32,95%,52%)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Podratçı üzrə ətraflı hesabat</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Podratçı</th>
                <th className="text-left px-4 py-3 font-medium">Tip</th>
                <th className="text-center px-4 py-3 font-medium">Sifariş sayı</th>
                <th className="text-right px-4 py-3 font-medium">Ümumi dövriyyə</th>
                <th className="text-right px-4 py-3 font-medium">Komissiya %</th>
                <th className="text-right px-4 py-3 font-medium text-green-700">Şirkət qazancı</th>
                <th className="text-right px-4 py-3 font-medium text-blue-700">Podratçı qazancı</th>
                <th className="text-center px-4 py-3 font-medium">Detallar</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(p => (
                <>
                  <tr key={p.id} className="border-t border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(selected === p.id ? null : p.id)}>
                    <td className="px-4 py-3 font-medium">{p.ad}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.tip}</td>
                    <td className="px-4 py-3 text-center">{p.sifarisSayi}</td>
                    <td className="px-4 py-3 text-right">{p.umumiGelir.toFixed(2)} ₼</td>
                    <td className="px-4 py-3 text-right">{p.komissiyaFaizi}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{p.sirketQazanci.toFixed(2)} ₼</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">{p.podratciQazanci.toFixed(2)} ₼</td>
                    <td className="px-4 py-3 text-center text-xs text-primary">{selected === p.id ? "▲ Bağla" : "▼ Aç"}</td>
                  </tr>
                  {selected === p.id && p.sifarisler.length > 0 && (
                    <tr key={`${p.id}-detail`} className="bg-muted/10">
                      <td colSpan={8} className="px-6 py-3">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Sifarişlər:</div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="text-left pb-1">Sifariş №</th>
                              <th className="text-left pb-1">Müştəri</th>
                              <th className="text-left pb-1">Xidmət</th>
                              <th className="text-right pb-1">Məbləğ</th>
                              <th className="text-right pb-1">Şirkət payı</th>
                              <th className="text-right pb-1">Podratçı payı</th>
                              <th className="text-left pb-1">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.sifarisler.map(s => {
                              const mebleg = s.umumi_mebleg || s.qiymet || 0;
                              const sirketPay = mebleg * (p.komissiyaFaizi / 100);
                              const podratciPay = mebleg * (1 - p.komissiyaFaizi / 100);
                              return (
                                <tr key={s.id} className="border-t border-border/30">
                                  <td className="py-1 pr-3">{s.sifaris_no || "—"}</td>
                                  <td className="py-1 pr-3">{s.musteri_adi || "—"}</td>
                                  <td className="py-1 pr-3">{s.xidmet_tipi}</td>
                                  <td className="py-1 text-right pr-3">{mebleg.toFixed(2)} ₼</td>
                                  <td className="py-1 text-right text-green-600 pr-3">{sirketPay.toFixed(2)} ₼</td>
                                  <td className="py-1 text-right text-blue-600 pr-3">{podratciPay.toFixed(2)} ₼</td>
                                  <td className="py-1">{s.status}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {stats.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Podratçı məlumatı yoxdur</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}