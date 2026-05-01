import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ShoppingBag, CheckCircle, Clock, XCircle } from "lucide-react";
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

export default function EmeliyyatHesabati({ sifarisler }) {
  const xidmetStats = {};
  sifarisler.forEach(s => {
    if (!xidmetStats[s.xidmet_tipi]) xidmetStats[s.xidmet_tipi] = { name: s.xidmet_tipi, say: 0, mebleg: 0 };
    xidmetStats[s.xidmet_tipi].say++;
    xidmetStats[s.xidmet_tipi].mebleg += s.umumi_mebleg || s.qiymet || 0;
  });
  const xidmetData = Object.values(xidmetStats).sort((a, b) => b.say - a.say);

  const statusStats = {};
  sifarisler.forEach(s => {
    if (!statusStats[s.status]) statusStats[s.status] = { name: s.status, value: 0 };
    statusStats[s.status].value++;
  });
  const statusData = Object.values(statusStats);

  const tamamlandi = sifarisler.filter(s => s.status === "Tamamlandı").length;
  const icrada = sifarisler.filter(s => s.status === "İcrada").length;
  const legv = sifarisler.filter(s => s.status === "Ləğv edildi").length;
  const yeni = sifarisler.filter(s => s.status === "Yeni").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatKart icon={ShoppingBag} label="Ümumi sifariş" value={sifarisler.length} color="blue" />
        <StatKart icon={CheckCircle} label="Tamamlandı" value={tamamlandi} color="green" />
        <StatKart icon={Clock} label="İcrada" value={icrada} color="orange" />
        <StatKart icon={XCircle} label="Ləğv edildi" value={legv} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Xidmət tipinə görə sifariş sayı</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={xidmetData} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-35} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="say" name="Sifariş sayı" radius={[6, 6, 0, 0]}>
                {xidmetData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Sifariş statusları</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="45%" outerRadius={90} innerRadius={40} dataKey="value" paddingAngle={3}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}