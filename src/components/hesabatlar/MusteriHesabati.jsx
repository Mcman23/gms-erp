import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, Star, ShoppingBag, Award } from "lucide-react";
import StatKart from "./StatKart";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function MusteriHesabati({ musteriler, sifarisler }) {
  const aktiv = musteriler.filter(m => m.status === "Aktiv").length;
  const korporativ = musteriler.filter(m => m.musteri_tipi === "Korporativ").length;

  // Top customers by orders
  const musteriSifaris = musteriler.map(m => {
    const ms = sifarisler.filter(s => s.musteri_id === m.id);
    const gelir = ms.reduce((sum, s) => sum + (s.umumi_mebleg || s.qiymet || 0), 0);
    return { ...m, sifarisSayi: ms.length, gelir };
  }).sort((a, b) => b.gelir - a.gelir).slice(0, 10);

  // By source
  const menbeStats = {};
  musteriler.forEach(m => {
    const key = m.menbe || "Digər";
    if (!menbeStats[key]) menbeStats[key] = { name: key, value: 0 };
    menbeStats[key].value++;
  });
  const menbeData = Object.values(menbeStats);

  // By type
  const tipStats = [
    { name: "Fərdi", value: musteriler.filter(m => m.musteri_tipi === "Fərdi").length },
    { name: "Korporativ", value: korporativ },
  ];

  const umumi_gelir = musteriSifaris.reduce((s, m) => s + m.gelir, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatKart icon={Users} label="Ümumi müştəri" value={musteriler.length} color="blue" />
        <StatKart icon={Star} label="Aktiv müştəri" value={aktiv} color="green" />
        <StatKart icon={Award} label="Korporativ" value={korporativ} color="purple" />
        <StatKart icon={ShoppingBag} label="Ümumi sifariş" value={sifarisler.length} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Müştəri mənbəyinə görə bölgü</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={menbeData} cx="50%" cy="45%" outerRadius={85} innerRadius={35} dataKey="value" paddingAngle={3}>
                {menbeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Müştəri tipinə görə</h3>
          <div className="space-y-4 mt-6">
            {tipStats.map((t, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300">{t.name}</span>
                  <span className="text-white font-bold">{t.value}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${musteriler.length > 0 ? (t.value / musteriler.length) * 100 : 0}%`, backgroundColor: COLORS[i] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top customers */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <h3 className="font-semibold text-white text-sm">Top 10 müştəri (gəlirə görə)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">#</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Müştəri</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Tip</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Telefon</th>
                <th className="text-center px-4 py-3 text-xs text-slate-400 font-medium">Sifariş sayı</th>
                <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium">Ümumi gəlir</th>
              </tr>
            </thead>
            <tbody>
              {musteriSifaris.map((m, i) => (
                <tr key={m.id} className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors`}>
                  <td className="px-4 py-3 text-slate-400 text-xs font-bold">#{i + 1}</td>
                  <td className="px-4 py-3 text-white font-medium text-xs">{m.ad_soyad}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.musteri_tipi === "Korporativ" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {m.musteri_tipi}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{m.telefon}</td>
                  <td className="px-4 py-3 text-center text-white text-xs font-semibold">{m.sifarisSayi}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-bold text-xs">{m.gelir.toFixed(2)} ₼</td>
                </tr>
              ))}
              {musteriler.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">Müştəri məlumatı yoxdur</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}