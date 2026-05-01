import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Cake } from "lucide-react";

function getAdGunuInfo(iscilar) {
  const today = new Date();
  const todayMD = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const bugun = [];
  const yakinda = [];

  iscilar.forEach(isci => {
    if (!isci.dogum_tarixi) return;
    const parts = isci.dogum_tarixi.split("-");
    if (parts.length < 3) return;
    const md = `${parts[1]}-${parts[2]}`;

    if (md === todayMD) {
      bugun.push(isci);
    } else {
      // Check next 7 days
      for (let i = 1; i <= 7; i++) {
        const future = new Date(today);
        future.setDate(today.getDate() + i);
        const futureMD = `${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
        if (md === futureMD) {
          yakinda.push({ ...isci, gunQalir: i });
          break;
        }
      }
    }
  });

  return { bugun, yakinda };
}

export default function AdGunuBildiris() {
  const [iscilar, setIscilar] = useState([]);

  useEffect(() => {
    base44.entities.Isci.list().then(data => setIscilar(data)).catch(() => {});
  }, []);

  const { bugun, yakinda } = getAdGunuInfo(iscilar);

  if (bugun.length === 0 && yakinda.length === 0) return null;

  return (
    <div className="space-y-3">
      {bugun.map(isci => (
        <div key={isci.id} className="flex items-center gap-3 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4 animate-pulse-once">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
            <Cake className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <p className="font-semibold text-pink-800">🎂 Bu gün {isci.ad_soyad}-ın ad günüdür!</p>
            <p className="text-xs text-pink-600">{isci.vezife} — Təbriklər! 🎉</p>
          </div>
        </div>
      ))}
      {yakinda.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-800 mb-2">📅 Yaxınlaşan ad günləri</p>
          <div className="space-y-1">
            {yakinda.map(isci => (
              <div key={isci.id} className="flex items-center justify-between text-sm">
                <span className="text-blue-700">{isci.ad_soyad}</span>
                <span className="text-blue-500 text-xs">{isci.gunQalir} gün sonra</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}