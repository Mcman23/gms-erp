import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Users, UserCheck, UserX, Star, Briefcase, TrendingUp } from "lucide-react";
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

export default function HRHesabati({ iscilar, sifarisler }) {
  const aktiv = iscilar.filter(i => i.status === "Aktiv").length;
  const mezuniyyetde = iscilar.filter(i => i.status === "Məzuniyyətdə").length;
  const xeste = iscilar.filter(i => i.status === "Xəstə").length;

  // By role
  const vezifeStats = {};
  iscilar.forEach(i => {
    if (!vezifeStats[i.vezife]) vezifeStats[i.vezife] = { name: i.vezife || "Digər", value: 0 };
    vezifeStats[i.vezife].value++;
  });
  const vezifeData = Object.values(vezifeStats);

  // Performance: orders per employee (field workers only)
  const performans = iscilar
    .filter(i => i.vezife === "Sahə işçisi" || i.vezife === "Supervisor")
    .map(i => {
      const isciSifaris = sifarisler.filter(s => s.komanda_id && s.komanda_adi && s.komanda_adi.includes(i.ad_soyad.split(" ")[0]));
      const tamamlandi = isciSifaris.filter(s => s.status === "Tamamlandı").length;
      const gelir = isciSifaris.reduce((sum, s) => sum + (s.umumi_mebleg || s.qiymet || 0), 0);
      return {
        name: i.ad_soyad.length > 14 ? i.ad_soyad.slice(0, 14) + "…" : i.ad_soyad,
        tamamlandi,
        gelir: +gelir.toFixed(0),
        vezife: i.vezife,
      };
    })
    .sort((a, b) => b.tamamlandi - a.tamamlandi)
    .slice(0, 10);

  // Salary summary
  const umumi_maas = iscilar.reduce((s, i) => s + (i.maas || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatKart icon={Users} label="Ümumi işçi sayı" value={iscilar.length} color="blue" />
        <StatKart icon={UserCheck} label="Aktiv işçi" value={aktiv} color="green" />
        <StatKart icon={Star} label="Məzuniyyətdə" value={mezuniyyetde} color="orange" />
        <StatKart icon={Briefcase} label="Ümumi maaş fondu" value={`${umumi_maas.toFixed(0)} ₼`} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Vəzifəyə görə işçi bölgüsü</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={vezifeData} cx="50%" cy="45%" outerRadius={90} innerRadius={45} dataKey="value" paddingAngle={3}>
                {vezifeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">İşçi status bölgüsü</h3>
          <div className="space-y-4 mt-4">
            {[
              { label: "Aktiv", value: aktiv, total: iscilar.length, color: "#10b981" },
              { label: "Məzuniyyətdə", value: mezuniyyetde, total: iscilar.length, color: "#f59e0b" },
              { label: "Xəstə", value: xeste, total: iscilar.length, color: "#ef4444" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-white font-semibold">{item.value} / {item.total}</span>
                </div>
                <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Maaş bölgüsü */}
          <div className="mt-6">
            <h4 className="text-xs font-medium text-slate-400 mb-3">Maaş aralığı üzrə bölgü</h4>
            {(() => {
              const araliqlar = [
                { label: "< 500 ₼", min: 0, max: 500 },
                { label: "500–1000 ₼", min: 500, max: 1000 },
                { label: "1000–2000 ₼", min: 1000, max: 2000 },
                { label: "> 2000 ₼", min: 2000, max: Infinity },
              ];
              return araliqlar.map((a, i) => {
                const say = iscilar.filter(w => (w.maas || 0) >= a.min && (w.maas || 0) < a.max).length;
                return (
                  <div key={i} className="flex items-center gap-3 text-xs mb-1.5">
                    <span className="text-slate-400 w-24">{a.label}</span>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${iscilar.length > 0 ? (say / iscilar.length) * 100 : 0}%`, backgroundColor: COLORS[i] }} />
                    </div>
                    <span className="text-white w-6 text-right">{say}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Performance table */}
      {performans.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">İşçi Performans Hesabatı (komanda əsasında)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={performans} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Bar dataKey="tamamlandi" name="Tamamlanan sifariş" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Employee table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <h3 className="font-semibold text-white text-sm">İşçi siyahısı</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Ad Soyad</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Vəzifə</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Komanda</th>
                <th className="text-center px-4 py-3 text-xs text-slate-400 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium">Maaş</th>
              </tr>
            </thead>
            <tbody>
              {iscilar.map((i, idx) => (
                <tr key={i.id} className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${idx % 2 === 0 ? "" : "bg-slate-800/20"}`}>
                  <td className="px-4 py-3 text-white font-medium text-xs">{i.ad_soyad}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{i.vezife}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{i.komanda || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      i.status === "Aktiv" ? "bg-green-500/20 text-green-400" :
                      i.status === "Məzuniyyətdə" ? "bg-yellow-500/20 text-yellow-400" :
                      i.status === "Xəstə" ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400"
                    }`}>{i.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-semibold text-xs">{i.maas ? `${i.maas} ₼` : "—"}</td>
                </tr>
              ))}
              {iscilar.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">İşçi məlumatı yoxdur</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}