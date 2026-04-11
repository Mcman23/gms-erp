import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, MapPin, User } from "lucide-react";
import moment from "moment";

export default function Planlama() {
  const [sifarisler, setSifarisler] = useState([]);
  const [iscilar, setIscilar] = useState([]);
  const [currentDate, setCurrentDate] = useState(moment());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Sifaris.list("-tarix", 200),
      base44.entities.Isci.list(),
    ]).then(([s, i]) => { setSifarisler(s); setIscilar(i); setLoading(false); });
  }, []);

  const daysInWeek = Array.from({ length: 7 }, (_, i) => currentDate.clone().startOf("week").add(i, "days"));

  const getOrdersForDay = (day) =>
    sifarisler.filter(s => s.tarix && moment(s.tarix).format("YYYY-MM-DD") === day.format("YYYY-MM-DD") && s.status !== "Ləğv edildi");

  const statusColors = {
    "Yeni": "border-l-blue-500 bg-blue-50",
    "Təsdiqləndi": "border-l-cyan-500 bg-cyan-50",
    "Planlandı": "border-l-purple-500 bg-purple-50",
    "İcrada": "border-l-orange-500 bg-orange-50",
    "Tamamlandı": "border-l-green-500 bg-green-50",
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planlama və Dispatch</h1>
          <p className="text-muted-foreground text-sm mt-1">Həftəlik baxış</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => setCurrentDate(d => d.clone().subtract(1, "week"))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[200px] text-center">
            {currentDate.clone().startOf("week").format("DD MMM")} — {currentDate.clone().endOf("week").format("DD MMM YYYY")}
          </span>
          <Button size="icon" variant="outline" onClick={() => setCurrentDate(d => d.clone().add(1, "week"))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCurrentDate(moment())}>Bu gün</Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {daysInWeek.map(day => {
          const orders = getOrdersForDay(day);
          const isToday = day.isSame(moment(), "day");
          return (
            <div key={day.format("YYYY-MM-DD")} className={`min-h-[200px] rounded-xl border ${isToday ? "border-primary bg-primary/5" : "border-border bg-card"} p-3`}>
              <div className={`text-center mb-3 pb-2 border-b border-border/50 ${isToday ? "text-primary font-bold" : ""}`}>
                <p className="text-xs text-muted-foreground">{day.format("ddd")}</p>
                <p className="text-lg font-semibold">{day.format("DD")}</p>
              </div>
              <div className="space-y-2">
                {orders.map(o => (
                  <div key={o.id} className={`border-l-2 rounded-r-md p-2 text-xs ${statusColors[o.status] || "border-l-gray-300 bg-gray-50"}`}>
                    <p className="font-medium truncate">{o.musteri_adi}</p>
                    <p className="text-muted-foreground truncate">{o.xidmet_tipi}</p>
                    {o.saat && <p className="flex items-center gap-1 mt-1"><Clock className="w-3 h-3" />{o.saat}</p>}
                  </div>
                ))}
                {orders.length === 0 && <p className="text-[11px] text-muted-foreground text-center">Sifariş yoxdur</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}