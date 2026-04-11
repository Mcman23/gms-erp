import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["hsl(210,80%,45%)", "hsl(165,60%,42%)", "hsl(32,95%,52%)", "hsl(280,60%,55%)", "hsl(340,70%,55%)", "hsl(200,60%,50%)"];

export default function Hesabatlar() {
  const [sifarisler, setSifarisler] = useState([]);
  const [emeliyyatlar, setEmeliyyatlar] = useState([]);
  const [kassalar, setKassalar] = useState([]);
  const [iscilar, setIscilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Sifaris.list("-created_date", 300),
      base44.entities.KassaEmeliyyati.list("-created_date", 300),
      base44.entities.Kassa.list(),
      base44.entities.Isci.list(),
    ]).then(([s, e, k, i]) => { setSifarisler(s); setEmeliyyatlar(e); setKassalar(k); setIscilar(i); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  // Order by service type
  const xidmetStats = {};
  sifarisler.forEach(s => {
    if (!xidmetStats[s.xidmet_tipi]) xidmetStats[s.xidmet_tipi] = { name: s.xidmet_tipi, say: 0, mebleg: 0 };
    xidmetStats[s.xidmet_tipi].say++;
    xidmetStats[s.xidmet_tipi].mebleg += s.umumi_mebleg || s.qiymet || 0;
  });
  const xidmetData = Object.values(xidmetStats);

  // Order status
  const statusStats = {};
  sifarisler.forEach(s => {
    if (!statusStats[s.status]) statusStats[s.status] = { name: s.status, value: 0 };
    statusStats[s.status].value++;
  });
  const statusData = Object.values(statusStats);

  // Kassa balances
  const kassaData = kassalar.map(k => ({ name: k.ad, balans: k.balans || 0 }));

  // Employee by role
  const vezifeStats = {};
  iscilar.forEach(i => {
    if (!vezifeStats[i.vezife]) vezifeStats[i.vezife] = { name: i.vezife, value: 0 };
    vezifeStats[i.vezife].value++;
  });
  const vezifeData = Object.values(vezifeStats);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hesabatlar</h1>
        <p className="text-muted-foreground text-sm mt-1">Əməliyyat, maliyyə, HR və kassa hesabatları</p>
      </div>

      <Tabs defaultValue="emeliyyat">
        <TabsList>
          <TabsTrigger value="emeliyyat">Əməliyyat</TabsTrigger>
          <TabsTrigger value="maliyye">Maliyyə</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="kassa">Kassa</TabsTrigger>
        </TabsList>

        <TabsContent value="emeliyyat" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-4">Xidmət tipinə görə sifarişlər</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={xidmetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="say" fill="hsl(210,80%,45%)" radius={[4,4,0,0]} name="Sifariş sayı" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-4">Sifariş statusları</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="maliyye" className="mt-4 space-y-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-4">Xidmət tipinə görə gəlir</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={xidmetData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={v => `${v.toFixed(2)} ₼`} />
                <Bar dataKey="mebleg" fill="hsl(165,60%,42%)" radius={[4,4,0,0]} name="Gəlir" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="hr" className="mt-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-4">Vəzifəyə görə işçilər</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={vezifeData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {vezifeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="kassa" className="mt-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-4">Kassa balansları</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kassaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={v => `${v.toFixed(2)} ₼`} />
                <Bar dataKey="balans" fill="hsl(210,80%,45%)" radius={[4,4,0,0]} name="Balans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}