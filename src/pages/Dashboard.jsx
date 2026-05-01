import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import KPICard from "../components/dashboard/KPICard";
import KassaBalansCard from "../components/dashboard/KassaBalansCard";
import RecentOrders from "../components/dashboard/RecentOrders";
import AdGunuBildiris from "../components/AdGunuBildiris";
import { ClipboardList, Users, Banknote, Package, AlertTriangle, UserCog, TrendingDown } from "lucide-react";

export default function Dashboard() {
  const [kassalar, setKassalar] = useState([]);
  const [sifarisler, setSifarisler] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [iscilar, setIscilar] = useState([]);
  const [anbar, setAnbar] = useState([]);
  const [maaslar, setMaaslar] = useState([]);
  const [podratciSifarisleri, setPodratciSifarisleri] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Kassa.list().catch(() => []),
      base44.entities.Sifaris.list("-created_date", 20).catch(() => []),
      base44.entities.Musteri.list().catch(() => []),
      base44.entities.Isci.list().catch(() => []),
      base44.entities.Anbar.list().catch(() => []),
      base44.entities.MaasHesablamasi.list().catch(() => []),
      base44.entities.PodratciSifarisi.list().catch(() => []),
    ]).then(([k, s, m, i, a, ms, ps]) => {
      setKassalar(k);
      setSifarisler(s);
      setMusteriler(m);
      setIscilar(i);
      setAnbar(a);
      setMaaslar(ms);
      setPodratciSifarisleri(ps);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const bugunSifarisler = sifarisler.filter(s => {
    const today = new Date().toISOString().slice(0, 10);
    return s.tarix && s.tarix.slice(0, 10) === today;
  });

  const aciqSifarisler = sifarisler.filter(s => !["Tamamlandı", "Ləğv edildi"].includes(s.status));
  const aktivIscilar = iscilar.filter(i => i.status === "Aktiv");
  const azQalanStok = anbar.filter(a => a.miqdar <= a.min_miqdar);

  // Bu ay maaş xərci
  const buAy = new Date();
  const buAyMaaslar = maaslar.filter(m => {
    const ay = String(buAy.getMonth() + 1).padStart(2, "0");
    const il = String(buAy.getFullYear());
    return m.ay === ay && m.il === il;
  });
  const buAyMaasToplam = buAyMaaslar.reduce((s, m) => s + (m.nagilmaas || 0), 0);

  // Ödənilməmiş podratçı borcu
  const odenmemisBorc = podratciSifarisleri
    .filter(ps => ps.odenis_statusu === "Gözlənilir")
    .reduce((s, ps) => s + (ps.podratci_payi || 0), 0);

  const totalGelir = sifarisler
    .filter(s => s.status === "Tamamlandı")
    .reduce((sum, s) => sum + (s.umumi_mebleg || s.qiymet || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ana Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">Xoş gəldiniz! Bugünkü ümumi baxış</p>
      </div>

      {/* Ad günü bildirişləri */}
      <AdGunuBildiris />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Açıq Sifarişlər"
          value={aciqSifarisler.length}
          subtitle={`Bu gün: ${bugunSifarisler.length}`}
          icon={ClipboardList}
          color="primary"
        />
        <KPICard
          title="Bu ay maaş xərci"
          value={`${buAyMaasToplam.toFixed(2)} ₼`}
          subtitle={`${buAyMaaslar.length} işçi`}
          icon={Banknote}
          color="chart3"
        />
        <KPICard
          title="Podratçı borcu"
          value={`${odenmemisBorc.toFixed(2)} ₼`}
          subtitle="Ödənilməmiş"
          icon={TrendingDown}
          color="chart5"
        />
        <KPICard
          title="Aktiv İşçilər"
          value={aktivIscilar.length}
          subtitle={`Ümumi: ${iscilar.length}`}
          icon={UserCog}
          color="chart4"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard
          title="Müştərilər"
          value={musteriler.length}
          subtitle="Qeydiyyatlı müştərilər"
          icon={Users}
          color="accent"
        />
        <KPICard
          title="Ümumi Gəlir"
          value={`${totalGelir.toFixed(2)} ₼`}
          subtitle="Tamamlanan sifarişlər"
          icon={Banknote}
          color="chart2"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <KassaBalansCard kassalar={kassalar} />
        </div>
        <div className="lg:col-span-2">
          <RecentOrders sifarisler={sifarisler} />
        </div>
      </div>

      {/* Alerts */}
      {azQalanStok.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-sm text-orange-800">Stok Xəbərdarlığı</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {azQalanStok.map(item => (
              <div key={item.id} className="bg-white rounded-lg px-3 py-2 text-sm">
                <span className="font-medium">{item.ad}</span>
                <span className="text-orange-600 ml-2">({item.miqdar} {item.vahid})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}