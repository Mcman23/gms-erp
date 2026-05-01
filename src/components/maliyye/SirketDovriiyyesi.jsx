import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { X, Building2, TrendingUp } from "lucide-react";
import moment from "moment";

export default function SirketDovriiyyesi({ musteriler, sifarisler, kassaEmeliyyatlar }) {
  const [selectedMusteri, setSelectedMusteri] = useState(null);
  const [filterOdenis, setFilterOdenis] = useState("all");
  const [minMebleg, setMinMebleg] = useState("");
  const [tarixBas, setTarixBas] = useState("");
  const [tarixSon, setTarixSon] = useState("");

  // Build company summary table
  const sirketler = useMemo(() => {
    return musteriler.map(m => {
      let mSif = sifarisler.filter(s => s.musteri_id === m.id);
      if (tarixBas) mSif = mSif.filter(s => (s.tarix || "") >= tarixBas);
      if (tarixSon) mSif = mSif.filter(s => (s.tarix || "") <= tarixSon);
      if (filterOdenis !== "all") mSif = mSif.filter(s => s.odenis_statusu === filterOdenis);

      const umumiMebleg = mSif.reduce((s, x) => s + (x.umumi_mebleg || x.qiymet || 0), 0);
      const odenilen = mSif.filter(s => s.odenis_statusu === "Ödənilib").reduce((s, x) => s + (x.umumi_mebleg || x.qiymet || 0), 0);
      const borc = umumiMebleg - odenilen;
      const sonEmeliyyat = mSif.length > 0 ? mSif.sort((a, b) => (b.tarix || "") > (a.tarix || "") ? 1 : -1)[0]?.tarix : null;

      return { ...m, sifaris_sayi: mSif.length, umumi_mebleg: umumiMebleg, odenilen, borc, son_emeliyyat: sonEmeliyyat };
    }).filter(m => m.sifaris_sayi > 0 || parseFloat(minMebleg || "0") === 0)
      .filter(m => !minMebleg || m.umumi_mebleg >= parseFloat(minMebleg))
      .sort((a, b) => b.umumi_mebleg - a.umumi_mebleg);
  }, [musteriler, sifarisler, filterOdenis, minMebleg, tarixBas, tarixSon]);

  const detay = useMemo(() => {
    if (!selectedMusteri) return null;
    const mSif = sifarisler.filter(s => s.musteri_id === selectedMusteri.id);
    const mOd = kassaEmeliyyatlar.filter(k => k.musteri_id === selectedMusteri.id && k.tip === "Mədaxil");

    // Monthly chart — last 12 months
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const m = moment().subtract(i, "months");
      const key = m.format("YYYY-MM");
      const label = m.format("MMM YY");
      const val = mSif.filter(s => (s.tarix || "").startsWith(key)).reduce((s, x) => s + (x.umumi_mebleg || x.qiymet || 0), 0);
      months.push({ label, val });
    }

    const umumiMebleg = mSif.reduce((s, x) => s + (x.umumi_mebleg || x.qiymet || 0), 0);
    const odenilen = mSif.filter(s => s.odenis_statusu === "Ödənilib").reduce((s, x) => s + (x.umumi_mebleg || x.qiymet || 0), 0);
    const ilkSifaris = mSif.length > 0 ? [...mSif].sort((a, b) => (a.tarix || "") > (b.tarix || "") ? 1 : -1)[0]?.tarix : null;
    const ortSifaris = mSif.length > 0 ? umumiMebleg / mSif.length : 0;

    return { mSif, mOd, months, umumiMebleg, odenilen, borc: umumiMebleg - odenilen, ilkSifaris, ortSifaris };
  }, [selectedMusteri, sifarisler, kassaEmeliyyatlar]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Başlama tarixi</label>
            <Input type="date" value={tarixBas} onChange={e => setTarixBas(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bitmə tarixi</label>
            <Input type="date" value={tarixSon} onChange={e => setTarixSon(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ödəniş statusu</label>
            <Select value={filterOdenis} onValueChange={setFilterOdenis}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hamısı</SelectItem>
                <SelectItem value="Ödənilib">Ödənilib</SelectItem>
                <SelectItem value="Ödənilməyib">Ödənilməyib</SelectItem>
                <SelectItem value="Qismən ödənilib">Qismən ödənilib</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Min dövriyyə (₼)</label>
            <Input type="number" placeholder="0" value={minMebleg} onChange={e => setMinMebleg(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <span className="font-semibold text-sm">Şirkət Dövriyyəsi — {sirketler.length} müştəri</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Şirkət / Müştəri</th>
                <th className="text-left px-4 py-3 font-medium">VÖEN</th>
                <th className="text-center px-4 py-3 font-medium">Sifariş</th>
                <th className="text-right px-4 py-3 font-medium">Ümumi məbləğ</th>
                <th className="text-right px-4 py-3 font-medium">Ödənilən</th>
                <th className="text-right px-4 py-3 font-medium text-red-600">Qalıq borc</th>
                <th className="text-left px-4 py-3 font-medium">Son əməliyyat</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sirketler.map(m => (
                <tr key={m.id} className="border-t border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => setSelectedMusteri(m)}>
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    {m.ad_soyad}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{m.voen || "—"}</td>
                  <td className="px-4 py-3 text-center">{m.sifaris_sayi}</td>
                  <td className="px-4 py-3 text-right font-semibold">{m.umumi_mebleg.toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right text-green-600">{m.odenilen.toFixed(2)} ₼</td>
                  <td className={`px-4 py-3 text-right font-bold ${m.borc > 0 ? "text-red-600" : "text-muted-foreground"}`}>{m.borc.toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{m.son_emeliyyat ? moment(m.son_emeliyyat).format("DD.MM.YYYY") : "—"}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={e => { e.stopPropagation(); setSelectedMusteri(m); }}>
                      Detay
                    </Button>
                  </td>
                </tr>
              ))}
              {sirketler.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Məlumat tapılmadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedMusteri && detay && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-primary/5 border-b border-border px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-bold">{selectedMusteri.ad_soyad}</h3>
                {selectedMusteri.voen && <p className="text-xs text-muted-foreground">VÖEN: {selectedMusteri.voen}</p>}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedMusteri(null)}><X className="w-4 h-4" /></Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
            {[
              { label: "Ümumi dövriyyə", val: `${detay.umumiMebleg.toFixed(2)} ₼`, color: "text-primary" },
              { label: "Ödənilən", val: `${detay.odenilen.toFixed(2)} ₼`, color: "text-green-600" },
              { label: "Ödənilməmiş", val: `${detay.borc.toFixed(2)} ₼`, color: detay.borc > 0 ? "text-red-600" : "text-muted-foreground" },
              { label: "Ort. sifariş dəyəri", val: `${detay.ortSifaris.toFixed(2)} ₼`, color: "text-foreground" },
            ].map(k => (
              <div key={k.label} className="bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-lg font-bold ${k.color}`}>{k.val}</p>
              </div>
            ))}
          </div>

          <div className="p-5 space-y-5">
            {/* Chart */}
            <div>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Aylıq Dövriyyə (son 12 ay)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={detay.months} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v.toFixed(2)} ₼`, "Məbləğ"]} />
                  <Bar dataKey="val" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sifarişlər */}
            <div>
              <p className="text-sm font-semibold mb-2">Sifarişlər ({detay.mSif.length})</p>
              {detay.ilkSifaris && (
                <p className="text-xs text-muted-foreground mb-2">Əməkdaşlıq başlama: {moment(detay.ilkSifaris).format("DD.MM.YYYY")}</p>
              )}
              <div className="overflow-x-auto max-h-52 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Tarix</th>
                      <th className="text-left px-3 py-2 font-medium">Xidmət</th>
                      <th className="text-right px-3 py-2 font-medium">Məbləğ</th>
                      <th className="text-left px-3 py-2 font-medium">Ödəniş</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...detay.mSif].sort((a, b) => (b.tarix || "") > (a.tarix || "") ? 1 : -1).map(s => (
                      <tr key={s.id} className="border-t border-border/50">
                        <td className="px-3 py-1.5">{s.tarix ? moment(s.tarix).format("DD.MM.YYYY") : "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{s.xidmet_tipi}</td>
                        <td className="px-3 py-1.5 text-right font-medium">{(s.umumi_mebleg || s.qiymet || 0).toFixed(2)} ₼</td>
                        <td className="px-3 py-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${s.odenis_statusu === "Ödənilib" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.odenis_statusu || "—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}