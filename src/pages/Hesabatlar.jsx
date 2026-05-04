import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, DollarSign, Users, Wallet, Truck, UserCheck } from "lucide-react";
import EmeliyyatHesabati from "@/components/hesabatlar/EmeliyyatHesabati";
import MaliyyeHesabati from "@/components/hesabatlar/MaliyyeHesabati";
import HRHesabati from "@/components/hesabatlar/HRHesabati";
import KassaHesabati from "@/components/hesabatlar/KassaHesabati";
import MusteriHesabati from "@/components/hesabatlar/MusteriHesabati";
import PodratciHesabati from "@/components/hesabatlar/PodratciHesabati";

export default function Hesabatlar() {
  const [sifarisler, setSifarisler] = useState([]);
  const [emeliyyatlar, setEmeliyyatlar] = useState([]);
  const [kassalar, setKassalar] = useState([]);
  const [iscilar, setIscilar] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Sifaris.list("-created_date", 500),
      base44.entities.KassaEmeliyyati.list("-created_date", 500),
      base44.entities.Kassa.list(),
      base44.entities.Isci.list(),
      base44.entities.Musteri.list("-created_date", 300),
    ]).then(([s, e, k, i, m]) => {
      setSifarisler(s);
      setEmeliyyatlar(e);
      setKassalar(k);
      setIscilar(i);
      setMusteriler(m);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const tabs = [
    { value: "emeliyyat", label: "Əməliyyat", icon: BarChart2 },
    { value: "maliyye", label: "Maliyyə", icon: DollarSign },
    { value: "hr", label: "HR", icon: UserCheck },
    { value: "kassa", label: "Kassa", icon: Wallet },
    { value: "musteri", label: "Müştəri", icon: Users },
    { value: "podratci", label: "Podratçı", icon: Truck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hesabatlar</h1>
          <p className="text-muted-foreground text-sm">Əməliyyat, maliyyə, HR, kassa və müştəri hesabatları</p>
        </div>
      </div>

      <Tabs defaultValue="emeliyyat">
        <TabsList className="bg-slate-800/80 border border-slate-700/50 p-1 h-auto flex flex-wrap gap-1">
          {tabs.map(t => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-white text-slate-400 rounded-lg px-3 py-2"
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="emeliyyat" className="mt-6">
          <EmeliyyatHesabati sifarisler={sifarisler} />
        </TabsContent>

        <TabsContent value="maliyye" className="mt-6">
          <MaliyyeHesabati sifarisler={sifarisler} emeliyyatlar={emeliyyatlar} />
        </TabsContent>

        <TabsContent value="hr" className="mt-6">
          <HRHesabati iscilar={iscilar} sifarisler={sifarisler} />
        </TabsContent>

        <TabsContent value="kassa" className="mt-6">
          <KassaHesabati kassalar={kassalar} emeliyyatlar={emeliyyatlar} />
        </TabsContent>

        <TabsContent value="musteri" className="mt-6">
          <MusteriHesabati musteriler={musteriler} sifarisler={sifarisler} />
        </TabsContent>

        <TabsContent value="podratci" className="mt-6">
          <PodratciHesabati />
        </TabsContent>
      </Tabs>
    </div>
  );
}