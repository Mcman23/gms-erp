import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import moment from "moment";

const STATUS_COLORS = {
  "Ödənilib": "bg-green-100 text-green-700",
  "Qismən ödənilib": "bg-yellow-100 text-yellow-700",
  "Ödənilməyib": "bg-red-100 text-red-700",
};

// Ödənilmiş məbləğə görə statusu avtomatik hesabla
function calcStatus(umumi, odenilmis) {
  const u = parseFloat(umumi) || 0;
  const o = parseFloat(odenilmis) || 0;
  if (o <= 0) return "Ödənilməyib";
  if (o >= u) return "Ödənilib";
  return "Qismən ödənilib";
}

// Inline ödəniş input komponenti
function OdenisInput({ id, umumi, odenilmis, onSave, entity }) {
  const [val, setVal] = useState(odenilmis > 0 ? String(odenilmis) : "");
  const [saving, setSaving] = useState(false);

  const handleBlur = async () => {
    const newOdenilmis = parseFloat(val) || 0;
    if (newOdenilmis === odenilmis) return;
    setSaving(true);
    const newStatus = calcStatus(umumi, newOdenilmis);
    await base44.entities[entity].update(id, {
      odenilmis_mebleg: newOdenilmis,
      odenis_statusu: newStatus,
    });
    onSave(id, newOdenilmis, newStatus);
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={e => e.key === "Enter" && e.target.blur()}
        className="h-7 w-24 text-xs text-right pr-1"
        placeholder="0.00"
        disabled={saving}
      />
      <span className="text-xs text-muted-foreground">₼</span>
    </div>
  );
}

function KreditorTable() {
  const [kreditorlar, setKreditorlar] = useState([]);
  const [kassaMedaxil, setKassaMedaxil] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    Promise.all([
      base44.entities.Kreditor.list("-created_date", 200),
      base44.entities.KassaEmeliyyati.filter({ tip: "Mədaxil" }, "-tarix", 200),
    ]).then(([kred, kassa]) => {
      setKreditorlar(kred);
      // Kassa mədaxillərini debitor formatına çevir
      const kassaRows = kassa.map(k => ({
        id: "kassa_" + k.id,
        _source: "kassa",
        faktura_no: k.qebz_nomresi || "—",
        musteri_adi: k.aciklama || "Kassa mədaxili",
        xidmet_tipi: k.kateqoriya || "—",
        tarix: k.tarix,
        son_odenis_tarixi: null,
        umumi_mebleg: k.mebleg || 0,
        odenilmis_mebleg: k.mebleg || 0,
        odenis_statusu: "Ödənilib",
      }));
      setKassaMedaxil(kassaRows);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = (id, newOdenilmis, newStatus) => {
    setKreditorlar(prev => prev.map(k =>
      k.id === id ? { ...k, odenilmis_mebleg: newOdenilmis, odenis_statusu: newStatus } : k
    ));
  };

  const allRows = [...kreditorlar, ...kassaMedaxil];
  const filtered = filterStatus === "all" ? allRows : allRows.filter(k => k.odenis_statusu === filterStatus);
  const totalAlacag = allRows
    .filter(k => k.odenis_statusu !== "Ödənilib")
    .reduce((s, k) => s + Math.max(0, (k.umumi_mebleg || 0) - (k.odenilmis_mebleg || 0)), 0);

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-700">Ümumi debitor</p>
          <p className="text-xl font-bold text-blue-800">{allRows.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs text-orange-700">Alacağımız (qalıq)</p>
          <p className="text-xl font-bold text-orange-800">{totalAlacag.toFixed(2)} ₼</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-700">Tam ödənilmiş</p>
          <p className="text-xl font-bold text-green-800">{allRows.filter(k => k.odenis_statusu === "Ödənilib").length}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "Ödənilməyib", "Qismən ödənilib", "Ödənilib"].map(s => (
          <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"} onClick={() => setFilterStatus(s)}>
            {s === "all" ? "Hamısı" : s}
          </Button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-blue-50/50">
          <div>
            <h3 className="font-semibold text-sm text-blue-900">Debitorlar</h3>
            <p className="text-xs text-blue-700 mt-0.5">Satış fakturalarından + kassa mədaxillərindən</p>
          </div>
          <span className="text-sm font-bold text-blue-700">{totalAlacag.toFixed(2)} ₼ alacağımız</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Faktura/Qəbz №</th>
              <th className="text-left px-4 py-3 font-medium">Müştəri / Açıqlama</th>
              <th className="text-left px-4 py-3 font-medium">Xidmət / Kateqoriya</th>
              <th className="text-left px-4 py-3 font-medium">Tarix</th>
              <th className="text-left px-4 py-3 font-medium">Son Ödəniş</th>
              <th className="text-right px-4 py-3 font-medium">Ümumi</th>
              <th className="text-right px-4 py-3 font-medium">Ödənilib ✏️</th>
              <th className="text-right px-4 py-3 font-medium">Qalıq</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Mənbə</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(k => {
              const qalig = Math.max(0, (k.umumi_mebleg || 0) - (k.odenilmis_mebleg || 0));
              const sonOdenis = k.son_odenis_tarixi;
              const gechib = sonOdenis && moment(sonOdenis).isBefore(moment(), "day") && k.odenis_statusu !== "Ödənilib";
              const isKassa = k._source === "kassa";
              return (
                <tr key={k.id} className={`border-t border-border/50 hover:bg-muted/20 ${gechib ? "bg-red-50/30" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs font-medium">{k.faktura_no || "—"}</td>
                  <td className="px-4 py-3 font-medium">{k.musteri_adi}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{k.xidmet_tipi || "—"}</td>
                  <td className="px-4 py-3 text-xs">{k.tarix ? moment(k.tarix).format("DD.MM.YYYY") : "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {isKassa ? <span className="text-muted-foreground">—</span> : (
                      <>
                        <span className={gechib ? "text-red-600 font-semibold" : ""}>
                          {sonOdenis ? moment(sonOdenis).format("DD.MM.YYYY") : "—"}
                        </span>
                        {gechib && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 rounded">Keçib</span>}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{(k.umumi_mebleg || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right">
                    {isKassa ? (
                      <span className="text-xs text-green-600 font-medium">{(k.odenilmis_mebleg || 0).toFixed(2)} ₼</span>
                    ) : (
                      <OdenisInput
                        id={k.id}
                        umumi={k.umumi_mebleg || 0}
                        odenilmis={k.odenilmis_mebleg || 0}
                        onSave={handleSave}
                        entity="Kreditor"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    <span className={qalig > 0 ? "text-orange-600" : "text-green-600"}>{qalig.toFixed(2)} ₼</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[k.odenis_statusu] || STATUS_COLORS["Ödənilməyib"]}`}>
                      {k.odenis_statusu || "Ödənilməyib"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isKassa ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      {isKassa ? "Kassa" : "Faktura"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Debitor tapılmadı</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DebitorTable({ fakturalar, onRefresh }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [localFakturalar, setLocalFakturalar] = useState(fakturalar);
  const [kassaMexaric, setKassaMexaric] = useState([]);

  useEffect(() => { setLocalFakturalar(fakturalar); }, [fakturalar]);

  useEffect(() => {
    base44.entities.KassaEmeliyyati.filter({ tip: "Məxaric" }, "-tarix", 200).then(kassa => {
      const kassaRows = kassa.map(k => ({
        id: "kassa_" + k.id,
        _source: "kassa",
        faktura_no: k.qebz_nomresi || "—",
        musteri_adi: k.aciklama || "Kassa məxarici",
        tarix: k.tarix,
        son_odenis_tarixi: null,
        umumi_mebleg: k.mebleg || 0,
        odenilmis_mebleg: k.mebleg || 0,
        odenis_statusu: "Ödənilib",
      }));
      setKassaMexaric(kassaRows);
    });
  }, []);

  const alishFakturalari = localFakturalar.filter(f => (f.tip || "Satış") === "Alış");
  const allRows = [...alishFakturalari, ...kassaMexaric];
  const filtered = filterStatus === "all" ? allRows : allRows.filter(f => f.odenis_statusu === filterStatus);
  const totalBorc = allRows
    .filter(f => f.odenis_statusu !== "Ödənilib")
    .reduce((s, f) => s + Math.max(0, (f.umumi_mebleg || 0) - (f.odenilmis_mebleg || 0)), 0);

  const handleSave = (id, newOdenilmis, newStatus) => {
    setLocalFakturalar(prev => prev.map(f =>
      f.id === id ? { ...f, odenilmis_mebleg: newOdenilmis, odenis_statusu: newStatus } : f
    ));
    base44.entities.Faktura.update(id, {
      odenilmis_mebleg: newOdenilmis,
      odenis_statusu: newStatus,
    }).catch(() => {});
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs text-orange-700">Ümumi kreditor</p>
          <p className="text-xl font-bold text-orange-800">{allRows.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-700">Ödənilməmiş borcumuz</p>
          <p className="text-xl font-bold text-red-800">{totalBorc.toFixed(2)} ₼</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-700">Tam ödənilmiş</p>
          <p className="text-xl font-bold text-green-800">{allRows.filter(f => f.odenis_statusu === "Ödənilib").length}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "Ödənilməyib", "Qismən ödənilib", "Ödənilib"].map(s => (
          <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"} onClick={() => setFilterStatus(s)}>
            {s === "all" ? "Hamısı" : s}
          </Button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-orange-50/50">
          <div>
            <h3 className="font-semibold text-sm text-orange-900">Kreditorlar</h3>
            <p className="text-xs text-orange-700 mt-0.5">Alış fakturalarından + kassa məxaricindən</p>
          </div>
          <span className="text-sm font-bold text-orange-700">{totalBorc.toFixed(2)} ₼ borcumuz</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Faktura/Qəbz №</th>
              <th className="text-left px-4 py-3 font-medium">Təchizatçı / Açıqlama</th>
              <th className="text-left px-4 py-3 font-medium">Tarix</th>
              <th className="text-left px-4 py-3 font-medium">Son Ödəniş</th>
              <th className="text-right px-4 py-3 font-medium">Ümumi</th>
              <th className="text-right px-4 py-3 font-medium">Ödənilib ✏️</th>
              <th className="text-right px-4 py-3 font-medium">Qalıq</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Mənbə</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => {
              const qalig = Math.max(0, (f.umumi_mebleg || 0) - (f.odenilmis_mebleg || 0));
              const sonOdenis = f.son_odenis_tarixi;
              const gechib = sonOdenis && moment(sonOdenis).isBefore(moment(), "day") && f.odenis_statusu !== "Ödənilib";
              const isKassa = f._source === "kassa";
              return (
                <tr key={f.id} className={`border-t border-border/50 hover:bg-muted/20 ${gechib ? "bg-red-50/30" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs font-medium">{f.faktura_no || "—"}</td>
                  <td className="px-4 py-3 font-medium">{f.musteri_adi}</td>
                  <td className="px-4 py-3 text-xs">{f.tarix ? moment(f.tarix).format("DD.MM.YYYY") : "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {isKassa ? <span className="text-muted-foreground">—</span> : (
                      <>
                        <span className={gechib ? "text-red-600 font-semibold" : ""}>
                          {sonOdenis ? moment(sonOdenis).format("DD.MM.YYYY") : "—"}
                        </span>
                        {gechib && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 rounded">Keçib</span>}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{(f.umumi_mebleg || 0).toFixed(2)} ₼</td>
                  <td className="px-4 py-3 text-right">
                    {isKassa ? (
                      <span className="text-xs text-green-600 font-medium">{(f.odenilmis_mebleg || 0).toFixed(2)} ₼</span>
                    ) : (
                      <OdenisInput
                        id={f.id}
                        umumi={f.umumi_mebleg || 0}
                        odenilmis={f.odenilmis_mebleg || 0}
                        onSave={handleSave}
                        entity="Faktura"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    <span className={qalig > 0 ? "text-red-600" : "text-green-600"}>{qalig.toFixed(2)} ₼</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[f.odenis_statusu] || STATUS_COLORS["Ödənilməyib"]}`}>
                      {f.odenis_statusu || "Ödənilməyib"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isKassa ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>
                      {isKassa ? "Kassa" : "Faktura"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Kreditor tapılmadı</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DebitorKreditorTab({ fakturalar }) {
  const [activeTab, setActiveTab] = useState("kreditor");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("kreditor")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "kreditor" ? "bg-white shadow text-blue-700" : "text-muted-foreground hover:text-foreground"}`}
        >
          📥 Debitorlar <span className="text-xs">(satış — müştəri bizə borclular)</span>
        </button>
        <button
          onClick={() => setActiveTab("debitor")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "debitor" ? "bg-white shadow text-orange-700" : "text-muted-foreground hover:text-foreground"}`}
        >
          📤 Kreditorlar <span className="text-xs">(alış — biz borcluluq)</span>
        </button>
      </div>

      {activeTab === "kreditor" ? <KreditorTable /> : <DebitorTable fakturalar={fakturalar} />}
    </div>
  );
}