import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import StatKart from "./StatKart";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{typeof p.value === "number" ? p.value.toFixed(2) + " ₼" : p.value}</span></p>
      ))}
    </div>
  );
};

export default function KassaHesabati({ kassalar, emeliyyatlar }) {
  const umumi = kassalar.reduce((s, k) => s + (k.balans || 0), 0);
  const medaxil = emeliyyatlar.filter(e => e.tip === "Mədaxil").reduce((s, e) => s + (e.mebleg || 0), 0);
  const mexaric = emeliyyatlar.filter(e => e.tip === "Məxaric").reduce((s, e) => s + (e.mebleg || 0), 0);

  const kassaData = kassalar.map(k => ({ name: k.ad, balans: k.balans || 0, tip: k.tip }));

  // Payment method breakdown
  const odeMetod = {};
  emeliyyatlar.forEach(e => {
    const m = e.odenis_metodu || "Digər";
    if (!odeMetod[m]) odeMetod[m] = { name: m, value: 0 };
    odeMetod[m].value += e.mebleg || 0;
  });
  const metodData = Object.values(odeMetod);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatKart icon={Wallet} label="Ümumi kassa balansi" value={`${umumi.toFixed(0)} ₼`} color="blue" />
        <StatKart icon={TrendingUp} label="Ümumi mədaxil" value={`${medaxil.toFixed(0)} ₼`} color="green" />
        <StatKart icon={TrendingDown} label="Ümumi məxaric" value={`${mexaric.toFixed(0)} ₼`} color="red" />
        <StatKart icon={ArrowLeftRight} label="Əməliyyat sayı" value={emeliyyatlar.length} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Kassa balansları</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={kassaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={v => `${v} ₼`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="balans" name="Balans" radius={[6, 6, 0, 0]}>
                {kassaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Ödəniş metodu üzrə bölgü</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={metodData} cx="50%" cy="45%" outerRadius={90} innerRadius={40} dataKey="value" paddingAngle={3}>
                {metodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">Son əməliyyatlar</h3>
          <span className="text-xs text-slate-400">{emeliyyatlar.length} əməliyyat</span>
        </div>
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Tarix</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Tip</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Kateqoriya</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Ödəniş</th>
                <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium">Məbləğ</th>
              </tr>
            </thead>
            <tbody>
              {emeliyyatlar.slice(0, 20).map((e, i) => (
                <tr key={e.id} className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${i % 2 === 0 ? "" : "bg-slate-800/20"}`}>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{e.tarix ? new Date(e.tarix).toLocaleDateString("az-AZ") : "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.tip === "Mədaxil" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {e.tip}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-300 text-xs">{e.kateqoriya || "—"}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{e.odenis_metodu || "—"}</td>
                  <td className={`px-4 py-2.5 text-right font-semibold text-xs ${e.tip === "Mədaxil" ? "text-green-400" : "text-red-400"}`}>
                    {e.tip === "Mədaxil" ? "+" : "-"}{(e.mebleg || 0).toFixed(2)} ₼
                  </td>
                </tr>
              ))}
              {emeliyyatlar.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">Əməliyyat məlumatı yoxdur</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}