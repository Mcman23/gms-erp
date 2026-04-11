import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function KassaBalansCard({ kassalar = [] }) {
  const totalBalans = kassalar.reduce((sum, k) => sum + (k.balans || 0), 0);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Kassa Balansları</h3>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold mb-4">{totalBalans.toFixed(2)} ₼</p>
      <div className="space-y-3">
        {kassalar.length === 0 ? (
          <p className="text-sm text-muted-foreground">Kassa tapılmadı</p>
        ) : (
          kassalar.map((kassa) => (
            <div key={kassa.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${kassa.status === "Aktiv" ? "bg-accent" : "bg-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-medium">{kassa.ad}</p>
                  <p className="text-[11px] text-muted-foreground">{kassa.tip} • {kassa.kod}</p>
                </div>
              </div>
              <span className="text-sm font-semibold">{(kassa.balans || 0).toFixed(2)} ₼</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}