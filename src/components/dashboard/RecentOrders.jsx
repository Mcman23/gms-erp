import { Badge } from "@/components/ui/badge";
import moment from "moment";

const statusColors = {
  "Yeni": "bg-blue-100 text-blue-700",
  "Təsdiqləndi": "bg-cyan-100 text-cyan-700",
  "Planlandı": "bg-purple-100 text-purple-700",
  "İcrada": "bg-orange-100 text-orange-700",
  "Tamamlandı": "bg-green-100 text-green-700",
  "Ləğv edildi": "bg-red-100 text-red-700",
};

export default function RecentOrders({ sifarisler = [] }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-semibold text-sm mb-4">Son Sifarişlər</h3>
      {sifarisler.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Sifariş yoxdur</p>
      ) : (
        <div className="space-y-3">
          {sifarisler.slice(0, 8).map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.musteri_adi || "Müştəri"}</p>
                <p className="text-[11px] text-muted-foreground">{s.xidmet_tipi} • {s.tarix ? moment(s.tarix).format("DD.MM.YYYY HH:mm") : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold whitespace-nowrap">{(s.umumi_mebleg || s.qiymet || 0).toFixed(2)} ₼</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] || "bg-muted text-muted-foreground"}`}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}