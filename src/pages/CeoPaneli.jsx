import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import moment from "moment";

function KPICard({ title, value, suffix = "₼", trend, trendLabel, color }) {
  const trendColor = trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-muted-foreground";
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  return (
    <div className={`bg-card rounded-2xl border border-border p-6 space-y-2 ${color || ""}`}>
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
      <p className="text-3xl font-bold tracking-tight text-foreground">{value} <span className="text-lg font-semibold text-muted-foreground">{suffix}</span></p>
      {trendLabel && (
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

function BlockTitle({ children }) {
  return <h2 className="text-base font-bold text-foreground/80 uppercase tracking-wider col-span-full border-b border-border pb-2 mb-1">{children}</h2>;
}

export default function CeoPaneli() {
  const [selectedMonth, setSelectedMonth] = useState(moment().format("YYYY-MM"));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [sifarisler, kassaEmeliyyatlari, iscilar, maaslar, podratciSifarisleri, anbar] = await Promise.all([
        base44.entities.Sifaris.list("-tarix", 500).catch(() => []),
        base44.entities.KassaEmeliyyati.list("-tarix", 1000).catch(() => []),
        base44.entities.Isci.list().catch(() => []),
        base44.entities.MaasHesablamasi.list().catch(() => []),
        base44.entities.PodratciSifarisi.list("-xidmet_tarixi", 500).catch(() => []),
        base44.entities.Anbar.list().catch(() => []),
      ]);

      const [year, month] = selectedMonth.split("-");
      const prevMonth = moment(selectedMonth).subtract(1, "month").format("YYYY-MM");
      const [prevYear, prevM] = prevMonth.split("-");

      const inMonth = (dateStr, y, m) => {
        if (!dateStr) return false;
        const d = moment(dateStr);
        return d.year() === parseInt(y) && d.month() + 1 === parseInt(m);
      };

      // Current month data
      const curKassa = kassaEmeliyyatlari.filter(k => inMonth(k.tarix, year, month) && k.status === "Təsdiqləndi");
      const curGelir = curKassa.filter(k => k.tip === "Mədaxil").reduce((s, k) => s + (k.mebleg || 0), 0);
      const curXerc = curKassa.filter(k => k.tip === "Məxaric").reduce((s, k) => s + (k.mebleg || 0), 0);

      // Prev month
      const prevKassa = kassaEmeliyyatlari.filter(k => inMonth(k.tarix, prevYear, prevM) && k.status === "Təsdiqləndi");
      const prevGelir = prevKassa.filter(k => k.tip === "Mədaxil").reduce((s, k) => s + (k.mebleg || 0), 0);
      const prevXerc = prevKassa.filter(k => k.tip === "Məxaric").reduce((s, k) => s + (k.mebleg || 0), 0);

      const trendPct = (cur, prev) => prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);
      const trendStr = (cur, prev) => {
        const p = trendPct(cur, prev);
        return p >= 0 ? `Əvvəlki aya nisbətən: +${p}%` : `Əvvəlki aya nisbətən: ${p}%`;
      };

      // Sifarisler
      const curSifarisler = sifarisler.filter(s => inMonth(s.tarix, year, month));
      const prevSifarisler = sifarisler.filter(s => inMonth(s.tarix, prevYear, prevM));
      const aciq = sifarisler.filter(s => ["Yeni","Təsdiqləndi","Planlandı","İcrada"].includes(s.status));
      const tamamlanan = curSifarisler.filter(s => s.status === "Tamamlandı");
      const prevTamamlanan = prevSifarisler.filter(s => s.status === "Tamamlandı");

      const ortaDeyer = tamamlanan.length > 0
        ? (tamamlanan.reduce((s, x) => s + (x.umumi_mebleg || x.qiymet || 0), 0) / tamamlanan.length).toFixed(2)
        : 0;

      // New customers this month (by first order)
      const yeniMusteri = new Set(curSifarisler.map(s => s.musteri_id)).size;
      const prevYeniMusteri = new Set(prevSifarisler.map(s => s.musteri_id)).size;

      // HR
      const aktivIsci = iscilar.filter(i => i.status === "Aktiv").length;
      const curMaaslar = maaslar.filter(m => m.il === year && m.ay === moment(selectedMonth).locale("az").format("MMMM"));
      const umumi_maas = curMaaslar.reduce((s, m) => s + (m.umumi_isverenin_xerci || m.nagilmaas || 0), 0);
      const prevMaaslar = maaslar.filter(m => m.il === prevYear && m.ay === moment(prevMonth).locale("az").format("MMMM"));
      const prevUmumiMaas = prevMaaslar.reduce((s, m) => s + (m.umumi_isverenin_xerci || m.nagilmaas || 0), 0);

      const today = moment().format("MM-DD");
      const adGunuler = iscilar.filter(i => {
        if (!i.dogum_tarixi) return false;
        return moment(i.dogum_tarixi).format("MM-DD") === today;
      });

      // Podratci
      const curPodratci = podratciSifarisleri.filter(p => inMonth(p.xidmet_tarixi, year, month));
      const prevPodratci = podratciSifarisleri.filter(p => inMonth(p.xidmet_tarixi, prevYear, prevM));
      const podratciOdenen = curPodratci.reduce((s, p) => s + (p.podratci_payi || 0), 0);
      const podratciQazanc = curPodratci.reduce((s, p) => s + (p.sirket_qazanci || 0), 0);
      const prevPodratciOdenen = prevPodratci.reduce((s, p) => s + (p.podratci_payi || 0), 0);
      const prevPodratciQazanc = prevPodratci.reduce((s, p) => s + (p.sirket_qazanci || 0), 0);

      // Top contractor
      const podratciCount = {};
      curPodratci.forEach(p => { podratciCount[p.podratci_adi] = (podratciCount[p.podratci_adi] || 0) + 1; });
      const topPodratci = Object.entries(podratciCount).sort((a, b) => b[1] - a[1])[0];

      // Anbar kritik
      const kritikAnbar = anbar.filter(a => (a.miqdar || 0) <= (a.min_miqdar || 5)).length;

      setData({
        curGelir, curXerc, menfeет: curGelir - curXerc,
        kassDovr: curGelir + curXerc,
        prevGelir, prevXerc,
        aciq: aciq.length, tamamlanan: tamamlanan.length, prevTamamlanan: prevTamamlanan.length,
        ortaDeyer, yeniMusteri, prevYeniMusteri,
        aktivIsci, umumi_maas, prevUmumiMaas,
        adGunuler,
        podratciOdenen, podratciQazanc, prevPodratciOdenen, prevPodratciQazanc,
        topPodratci,
        kritikAnbar,
        trendStr,
      });
      setLoading(false);
    };
    load();
  }, [selectedMonth]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = moment().subtract(i, "months");
    return { value: m.format("YYYY-MM"), label: m.format("MMMM YYYY") };
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const { trendStr } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CEO Paneli</h1>
          <p className="text-muted-foreground text-sm mt-1">Əsas KPI göstəriciləri</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Maliyyə */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <BlockTitle>💰 Maliyyə</BlockTitle>
        <KPICard title="Bu ay ümumi gəlir" value={data.curGelir.toFixed(2)} trendLabel={trendStr(data.curGelir, data.prevGelir)} trend={data.curGelir - data.prevGelir} />
        <KPICard title="Bu ay ümumi xərc" value={data.curXerc.toFixed(2)} trendLabel={trendStr(data.curXerc, data.prevXerc)} trend={-(data.curXerc - data.prevXerc)} />
        <KPICard
          title="Bu ay xalis mənfəət"
          value={(data.curGelir - data.curXerc).toFixed(2)}
          trendLabel={trendStr(data.curGelir - data.curXerc, data.prevGelir - data.prevXerc)}
          trend={data.curGelir - data.curXerc}
          color={(data.curGelir - data.curXerc) >= 0 ? "border-green-500/30" : "border-red-500/30"}
        />
        <KPICard title="Bu ay kassa dövriyyəsi" value={(data.curGelir + data.curXerc).toFixed(2)} trendLabel="" trend={0} />
      </div>

      {/* Əməliyyat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <BlockTitle>📋 Əməliyyat</BlockTitle>
        <KPICard title="Açıq sifarişlər" value={data.aciq} suffix="ədəd" trend={0} trendLabel="" />
        <KPICard title="Bu ay tamamlanan sifarişlər" value={data.tamamlanan} suffix="ədəd" trendLabel={trendStr(data.tamamlanan, data.prevTamamlanan)} trend={data.tamamlanan - data.prevTamamlanan} />
        <KPICard title="Ortalama sifariş dəyəri" value={data.ortaDeyer} trendLabel="" trend={0} />
        <KPICard title="Bu ay yeni müştəri sayı" value={data.yeniMusteri} suffix="nəfər" trendLabel={trendStr(data.yeniMusteri, data.prevYeniMusteri)} trend={data.yeniMusteri - data.prevYeniMusteri} />
      </div>

      {/* HR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <BlockTitle>👥 HR</BlockTitle>
        <KPICard title="Aktiv əməkdaş sayı" value={data.aktivIsci} suffix="nəfər" trendLabel="" trend={0} />
        <KPICard title="Bu ay ümumi maaş xərci" value={data.umumi_maas.toFixed(2)} trendLabel={trendStr(data.umumi_maas, data.prevUmumiMaas)} trend={-(data.umumi_maas - data.prevUmumiMaas)} />
        <div className="bg-card rounded-2xl border border-border p-6 space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Bu gün ad günü olanlar</p>
          {data.adGunuler.length === 0
            ? <p className="text-2xl font-bold text-muted-foreground">—</p>
            : data.adGunuler.map(i => (
              <p key={i.id} className="text-xl font-bold text-foreground">🎂 {i.ad_soyad}</p>
            ))
          }
        </div>
      </div>

      {/* Podratçı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <BlockTitle>🤝 Podratçı</BlockTitle>
        <KPICard title="Bu ay podratçılara ödənən" value={data.podratciOdenen.toFixed(2)} trendLabel={trendStr(data.podratciOdenen, data.prevPodratciOdenen)} trend={-(data.podratciOdenen - data.prevPodratciOdenen)} />
        <KPICard title="Bu ay podratçı işlərindən qazanc" value={data.podratciQazanc.toFixed(2)} trendLabel={trendStr(data.podratciQazanc, data.prevPodratciQazanc)} trend={data.podratciQazanc - data.prevPodratciQazanc} />
        <div className="bg-card rounded-2xl border border-border p-6 space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Ən çox iş verilən podratçı</p>
          {data.topPodratci
            ? <>
                <p className="text-2xl font-bold">{data.topPodratci[0]}</p>
                <p className="text-sm text-muted-foreground">{data.topPodratci[1]} iş</p>
              </>
            : <p className="text-2xl font-bold text-muted-foreground">—</p>
          }
        </div>
      </div>

      {/* Anbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
        <BlockTitle>📦 Anbar</BlockTitle>
        <KPICard
          title="Kritik stokda olan məhsullar"
          value={data.kritikAnbar}
          suffix="məhsul"
          trendLabel=""
          trend={data.kritikAnbar > 0 ? -1 : 0}
          color={data.kritikAnbar > 0 ? "border-red-400/40" : ""}
        />
      </div>
    </div>
  );
}