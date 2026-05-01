import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import StatKart from "./StatKart";

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

export default function MaliyyeHesabati({ sifarisler, emeliyyatlar }) {
  // Revenue by service
  const xidmetStats = {};
  sifarisler.forEach(s => {
    if (!xidmetStats[s.xidmet_tipi]) xidmetStats[s.xidmet_tipi] = { name: s.xidmet_tipi, gelir: 0, say: 0 };
    xidmetStats[s.xidmet_tipi].gelir += s.umumi_mebleg || s.qiymet || 0;
    xidmetStats[s.xidmet_tipi].say++;
  });
  const xidmetData = Object.values(xidmetStats).sort((a, b) => b.gelir - a.gelir);

  // Profit & Loss from transactions
  const medaxil = emeliyyatlar.filter(e => e.tip === "Mədaxil").reduce((s, e) => s + (e.mebleg || 0), 0);
  const mexaric = emeliyyatlar.filter(e => e.tip === "Məxaric").reduce((s, e) => s + (e.mebleg || 0), 0);
  const menfeyet = medaxil - mexaric;

  // Monthly cash flow
  const aylikData = {};
  emeliyyatlar.forEach(e => {
    const d = e.tarix ? new Date(e.tarix) : null;
    if (!d) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!aylikData[key]) aylikData[key] = { ay: key, medaxil: 0, mexaric: 0 };
    if (e.tip === "Mədaxil") aylikData[key].medaxil += e.mebleg || 0;
    else aylikData[key].mexaric += e.mebleg || 0;
  });
  const aylikArr = Object.values(aylikData)
    .sort((a, b) => a.ay.localeCompare(b.ay))
    .slice(-6)
    .map(d => ({ ...d, menfeyet: d.medaxil - d.mexaric }));

  // Expense by category
  const kateqoriyaStats = {};
  emeliyyatlar.filter(e => e.tip === "Məxaric").forEach(e => {
    if (!kateqoriyaStats[e.kateqoriya]) kateqoriyaStats[e.kateqoriya] = { name: e.kateqoriya || "Digər", mebleg: 0 };
    kateqoriyaStats[e.kateqoriya].mebleg += e.mebleg || 0;
  });
  const kateqoriyaData = Object.values(kateqoriyaStats).sort((a, b) => b.mebleg - a.mebleg);

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatKart icon={ArrowUpRight} label="Ümumi gəlir" value={`${medaxil.toFixed(0)} ₼`} color="green" />
        <StatKart icon={ArrowDownRight} label="Ümumi xərc" value={`${mexaric.toFixed(0)} ₼`} color="red" />
        <StatKart icon={menfeyet >= 0 ? TrendingUp : TrendingDown} label="Mənfəət / Zərər" value={`${menfeyet.toFixed(0)} ₼`} color={menfeyet >= 0 ? "blue" : "red"} />
        <StatKart icon={DollarSign} label="Gəlir/Xərc nisbəti" value={mexaric > 0 ? `${(medaxil / mexaric * 100).toFixed(0)}%` : "—"} color="purple" />
      </div>

      {/* Mənfəət/Zərər cədvəli */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm">Mənfəət / Zərər Hesabatı (aylıq)</h3>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${menfeyet >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {menfeyet >= 0 ? "Mənfəətli" : "Zərərli"}: {menfeyet.toFixed(2)} ₼
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={aylikArr}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="ay" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            <Bar dataKey="medaxil" name="Gəlir" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="mexaric" name="Xərc" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Kassa axını */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="font-semibold text-white text-sm mb-4">Kassa axını (son 6 ay)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={aylikArr}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="ay" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="medaxil" name="Gəlir" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
            <Line type="monotone" dataKey="mexaric" name="Xərc" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 4 }} />
            <Line type="monotone" dataKey="menfeyet" name="Mənfəət" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" dot={{ fill: "#3b82f6", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Xidmət gəliri + Xərc kateqoriyası */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Xidmət növünə görə gəlir analizi</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={xidmetData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => `${v} ₼`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#94a3b8" }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="gelir" name="Gəlir" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Xərc kateqoriyaları üzrə bölgü</h3>
          {kateqoriyaData.length > 0 ? (
            <div className="space-y-3 mt-2">
              {kateqoriyaData.map((k, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{k.name}</span>
                    <span className="text-white font-semibold">{k.mebleg.toFixed(2)} ₼</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (k.mebleg / kateqoriyaData[0].mebleg) * 100)}%`,
                        backgroundColor: ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4"][i % 6]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">Xərc məlumatı yoxdur</div>
          )}
        </div>
      </div>
    </div>
  );
}