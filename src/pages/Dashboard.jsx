import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getSession } from "@/hooks/useAppSession";
import { ClipboardList, Wallet, AlertTriangle, MessageSquareWarning } from "lucide-react";

function KPICard({ title, value, icon: Icon, color = "primary", sub }) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState({ kassalar: [], sifarisler: [], sikayetler: [], anbar: [] });
  const [loading, setLoading] = useState(true);
  const session = getSession();

  useEffect(() => {
    Promise.all([
      base44.entities.Kassa.list().catch(() => []),
      base44.entities.Sifaris.list("-created_date", 50).catch(() => []),
      base44.entities.Sikayet.list().catch(() => []),
      base44.entities.Anbar.list().catch(() => []),
    ]).then(([kassalar, sifarisler, sikayetler, anbar]) => {
      setData({ kassalar, sifarisler, sikayetler, anbar });
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const today = new Date().toISOString().slice(0, 10);
  const bugunSifarisler = data.sifarisler.filter(s => s.tarix?.slice(0, 10) === today);
  const totalKassa = data.kassalar.reduce((s, k) => s + (k.balans || 0), 0);
  const aciqSikayetler = data.sikayetler.filter(s => s.status === "Açıq");
  const azStok = data.anbar.filter(a => (a.miqdar || 0) <= (a.min_miqdar || 5));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ana Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Xoş gəldiniz, <strong>{session?.adSoyad}</strong> — {session?.rol}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Bugünkü Sifarişlər" value={bugunSifarisler.length} icon={ClipboardList} color="primary" sub={`Ümumi: ${data.sifarisler.length}`} />
        <KPICard title="Kassa Balansı" value={`${totalKassa.toFixed(2)} ₼`} icon={Wallet} color="green" sub={`${data.kassalar.length} kassa`} />
        <KPICard title="Açıq Şikayətlər" value={aciqSikayetler.length} icon={MessageSquareWarning} color="red" sub="Cavabsız qalan" />
        <KPICard title="Az Qalan Stok" value={azStok.length} icon={AlertTriangle} color="orange" sub="Kritik səviyyə" />
      </div>

      {/* Recent orders */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Son Sifarişlər</h3>
        </div>
        {data.sifarisler.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Hələ sifariş əlavə edilməyib</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Müştəri</th>
                  <th className="text-left px-4 py-3 font-medium">Xidmət</th>
                  <th className="text-left px-4 py-3 font-medium">Tarix</th>
                  <th className="text-right px-4 py-3 font-medium">Məbləğ</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.sifarisler.slice(0, 8).map(s => (
                  <tr key={s.id} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{s.musteri_adi || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.xidmet_tipi}</td>
                    <td className="px-4 py-3">{s.tarix ? new Date(s.tarix).toLocaleDateString("az-AZ") : "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{(s.umumi_mebleg || s.qiymet || 0).toFixed(2)} ₼</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.status === "Tamamlandı" ? "bg-green-100 text-green-700" :
                        s.status === "İcrada" ? "bg-orange-100 text-orange-700" :
                        s.status === "Ləğv edildi" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {azStok.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-sm text-orange-800">Stok Xəbərdarlığı</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {azStok.map(item => (
              <span key={item.id} className="bg-white text-sm px-3 py-1 rounded-lg border border-orange-200">
                {item.ad} — <span className="text-orange-600 font-medium">{item.miqdar} {item.vahid}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}