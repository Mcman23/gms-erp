import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";

const prioritetBorder = {
  "Kritik": "border-l-red-500",
  "Vacib": "border-l-yellow-500",
  "Normal": "border-l-blue-500",
};
const prioritetBg = {
  "Kritik": "bg-red-50",
  "Vacib": "bg-yellow-50",
  "Normal": "bg-blue-50",
};

function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

export default function Bildirisler() {
  const [open, setOpen] = useState(false);
  const [bildirisler, setBildirisler] = useState([]);
  const prevIdsRef = useRef(new Set());

  const fetchBildirisler = async () => {
    const data = await base44.entities.Bildiris.filter({ baglandi: false }, "-tarix", 50).catch(() => []);
    
    // Check for new unread+unvoiced
    data.forEach(async b => {
      if (!b.oxundu && !b.ses_verildi && !prevIdsRef.current.has(b.id)) {
        playDing();
        await base44.entities.Bildiris.update(b.id, { ses_verildi: true }).catch(() => {});
      }
    });

    prevIdsRef.current = new Set(data.map(b => b.id));
    setBildirisler(data);
  };

  useEffect(() => {
    fetchBildirisler();
    const interval = setInterval(fetchBildirisler, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBagla = async (id) => {
    await base44.entities.Bildiris.update(id, {
      baglandi: true,
      baglanis_tarixi: new Date().toISOString(),
      oxundu: true,
    });
    setBildirisler(prev => prev.filter(b => b.id !== id));
  };

  const handleHamisinibagla = async () => {
    await Promise.all(bildirisler.map(b =>
      base44.entities.Bildiris.update(b.id, { baglandi: true, baglanis_tarixi: new Date().toISOString(), oxundu: true })
    ));
    setBildirisler([]);
    setOpen(false);
  };

  const unreadCount = bildirisler.filter(b => !b.oxundu).length;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(o => !o)}>
        <Bell className="w-5 h-5" />
        {bildirisler.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {bildirisler.length > 99 ? "99+" : bildirisler.length}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 w-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Bildirişlər</span>
                {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{unreadCount} yeni</span>}
              </div>
              {bildirisler.length > 0 && (
                <Button size="sm" variant="ghost" className="text-xs gap-1 h-7" onClick={handleHamisinibagla}>
                  <CheckCheck className="w-3.5 h-3.5" /> Hamısını bağla
                </Button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {bildirisler.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Bildiriş yoxdur
                </div>
              ) : (
                bildirisler.map(b => (
                  <div
                    key={b.id}
                    className={`border-l-4 border-b border-border/50 p-4 flex gap-3 items-start ${prioritetBorder[b.prioritet] || "border-l-blue-500"} ${prioritetBg[b.prioritet] || "bg-blue-50"} ${!b.oxundu ? "font-medium" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{b.mesaj}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground">{b.tarix ? moment(b.tarix).fromNow() : ""}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${b.prioritet === "Kritik" ? "bg-red-200 text-red-800" : b.prioritet === "Vacib" ? "bg-yellow-200 text-yellow-800" : "bg-blue-200 text-blue-800"}`}>{b.prioritet}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBagla(b.id)}
                      className="shrink-0 w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
                      title="Bağla"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}