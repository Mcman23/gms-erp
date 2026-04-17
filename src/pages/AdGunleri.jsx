import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Cake, PartyPopper, Calendar } from "lucide-react";
import moment from "moment";

function getAdGunuInfo(iscilar) {
  const today = new Date();
  const todayMD = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const bugun = [];
  const yakinda = [];
  const hamisi = [];

  iscilar.forEach(isci => {
    if (!isci.dogum_tarixi) return;
    const parts = isci.dogum_tarixi.split("-");
    if (parts.length < 3) return;
    const md = `${parts[1]}-${parts[2]}`;
    const yash = today.getFullYear() - parseInt(parts[0]);
    hamisi.push({ ...isci, md, yash });

    if (md === todayMD) {
      bugun.push({ ...isci, yash });
    } else {
      for (let i = 1; i <= 30; i++) {
        const future = new Date(today);
        future.setDate(today.getDate() + i);
        const futureMD = `${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
        if (md === futureMD) {
          yakinda.push({ ...isci, gunQalir: i, yash, tarix: `${parts[2]}.${parts[1]}` });
          break;
        }
      }
    }
  });

  yakinda.sort((a, b) => a.gunQalir - b.gunQalir);
  return { bugun, yakinda, hamisi };
}

export default function AdGunleri() {
  const [iscilar, setIscilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Isci.list().then(d => { setIscilar(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const { bugun, yakinda, hamisi } = getAdGunuInfo(iscilar);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ad Günü Bildirişləri</h1>
        <p className="text-muted-foreground text-sm mt-1">Əməkdaşların ad günü təqvimi</p>
      </div>

      {/* Bu gün */}
      {bugun.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg flex items-center gap-2"><PartyPopper className="w-5 h-5 text-pink-500" /> Bu gün ad günü</h2>
          {bugun.map(isci => (
            <div key={isci.id} className="flex items-center gap-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-5">
              <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center text-2xl">🎂</div>
              <div>
                <p className="text-xl font-bold text-pink-800">{isci.ad_soyad}</p>
                <p className="text-sm text-pink-600">{isci.vezife} • {isci.yash} yaş</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-muted/30 rounded-xl p-5 text-center text-muted-foreground">
          <Cake className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Bu gün heç kimin ad günü yoxdur</p>
        </div>
      )}

      {/* Yaxında */}
      <div>
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-3"><Calendar className="w-5 h-5 text-blue-500" /> Növbəti 30 gün</h2>
        {yakinda.length > 0 ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Ad Soyad</th>
                  <th className="text-left px-4 py-3 font-medium">Vəzifə</th>
                  <th className="text-left px-4 py-3 font-medium">Tarix</th>
                  <th className="text-left px-4 py-3 font-medium">Yaş</th>
                  <th className="text-right px-4 py-3 font-medium">Nə vaxt</th>
                </tr>
              </thead>
              <tbody>
                {yakinda.map(isci => (
                  <tr key={isci.id} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{isci.ad_soyad}</td>
                    <td className="px-4 py-3 text-muted-foreground">{isci.vezife}</td>
                    <td className="px-4 py-3">{isci.tarix}</td>
                    <td className="px-4 py-3">{isci.yash} yaş olacaq</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${isci.gunQalir <= 3 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                        {isci.gunQalir} gün sonra
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Növbəti 30 gün ərzində ad günü yoxdur</p>
        )}
      </div>

      {/* Bütün işçilərin doğum tarixləri */}
      <div>
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-3"><Cake className="w-5 h-5 text-muted-foreground" /> Bütün əməkdaşlar</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Ad Soyad</th>
                <th className="text-left px-4 py-3 font-medium">Vəzifə</th>
                <th className="text-left px-4 py-3 font-medium">Doğum tarixi</th>
                <th className="text-left px-4 py-3 font-medium">Yaş</th>
              </tr>
            </thead>
            <tbody>
              {hamisi.filter(i => i.dogum_tarixi).map(isci => (
                <tr key={isci.id} className="border-t border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{isci.ad_soyad}</td>
                  <td className="px-4 py-3 text-muted-foreground">{isci.vezife}</td>
                  <td className="px-4 py-3">{moment(isci.dogum_tarixi).format("DD.MM.YYYY")}</td>
                  <td className="px-4 py-3">{isci.yash}</td>
                </tr>
              ))}
              {hamisi.filter(i => i.dogum_tarixi).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">İşçilərin doğum tarixi məlumatı yoxdur</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}