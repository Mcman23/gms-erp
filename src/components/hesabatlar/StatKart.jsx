export default function StatKart({ icon: Icon, label, value, sub, color = "blue", trend }) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
    green: "from-green-500/20 to-green-600/10 border-green-500/30 text-green-400",
    orange: "from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400",
    red: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400",
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
  };
  const iconColors = {
    blue: "bg-blue-500/20 text-blue-400",
    green: "bg-green-500/20 text-green-400",
    orange: "bg-orange-500/20 text-orange-400",
    purple: "bg-purple-500/20 text-purple-400",
    red: "bg-red-500/20 text-red-400",
    cyan: "bg-cyan-500/20 text-cyan-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}