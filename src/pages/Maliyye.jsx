import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, Wallet, Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import moment from "moment";

export default function Maliyye() {
  const [kassalar, setKassalar] = useState([]);
  const [emeliyyatlar, setEmeliyyatlar] = useState([]);
  const [fakturalar, setFakturalar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Kassa.list(),
      base44.entities.KassaEmeliyyati.list("-created_date", 200),
      base44.entities.Faktura.list("-created_date", 100),
    ]).then(([k, e, f]) => { setKassalar(k); setEmeliyyatlar(e); setFakturalar(f); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const totalKassa = kassalar.reduce((s, k) => s + (k.balans || 0), 0);
  const totalMedaxil = emeliyyatlar.filter(e => e.tip === "Mədaxil").reduce((s, e) => s + (e.mebleg || 0), 0);
  const totalMexaric = emeliyyatlar.filter(e => e.tip === "Məxaric").reduce((s, e) => s + (e.mebleg || 0), 0);
  const totalBorc = fakturalar.filter(f => f.odenis_statusu !== "Ödənilib").reduce((s, f) => s + (f.umumi_mebleg || 0) - (f.odenilmis_mebleg || 0), 0);
  const totalEdv = fakturalar.reduce((s, f) => s + (f.edv_meblegi || 0), 0);

  // Monthly chart data
  const months = {};
  emeliyyatlar.forEach(e => {
    const month = e.tarix ? moment(e.tarix).format("MMM") : "N/A";
    if (!months[month]) months[month] = { name: month, medaxil: 0, mexaric: 0 };
    if (e.tip === "Mədaxil") months[month].medaxil += e.mebleg || 0;
    else months[month].mexaric += e.mebleg || 0;
  });
  const chartData = Object.values(months).slice(-6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maliyyə</h1>
        <p className="text-muted-foreground text-sm mt-1">Maliyyə icmalı</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: "Kassa Balansı", value: `${totalKassa.toFixed(2)} ₼`, icon: Wallet, color: "text-primary bg-primary/10" },
          { title: "Mədaxil", value: `${totalMedaxil.toFixed(2)} ₼`, icon: ArrowUpRight, color: "text-green-600 bg-green-100" },
          { title: "Məxaric", value: `${totalMexaric.toFixed(2)} ₼`, icon: ArrowDownRight, color: "text-red-600 bg-red-100" },
          { title: "Debitor Borc", value: `${totalBorc.toFixed(2)} ₼`, icon: Receipt, color: "text-orange-600 bg-orange-100" },
          { title: "ƏDV (18%)", value: `${totalEdv.toFixed(2)} ₼`, icon: TrendingUp, color: "text-purple-600 bg-purple-100" },
        ].map(item => (
          <div key={item.title} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{item.title}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Mədaxil / Məxaric</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `${value.toFixed(2)} ₼`} />
              <Bar dataKey="medaxil" fill="hsl(165 60% 42%)" radius={[4, 4, 0, 0]} name="Mədaxil" />
              <Bar dataKey="mexaric" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} name="Məxaric" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}