import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import DeleteButton from "@/components/DeleteButton";
import moment from "moment";

export default function EmeliyyatlarTable({ emeliyyatlar, kassalar, isAdmin, onDelete }) {
  const [filterTip, setFilterTip] = useState("all");
  const [filterKassa, setFilterKassa] = useState("all");
  const [filterDebKred, setFilterDebKred] = useState("all");

  // Filtr tətbiqi
  let rows = emeliyyatlar;
  if (filterTip !== "all") rows = rows.filter(e => e.tip === filterTip);
  if (filterKassa !== "all") rows = rows.filter(e => e.kassa_id === filterKassa);
  if (filterDebKred === "debitor") rows = rows.filter(e => e.tip === "Mədaxil");
  if (filterDebKred === "kreditor") rows = rows.filter(e => e.tip === "Məxaric");

  const totalMedaxil = emeliyyatlar.filter(e => e.tip === "Mədaxil").reduce((s, e) => s + (e.mebleg || 0), 0);
  const totalMexaric = emeliyyatlar.filter(e => e.tip === "Məxaric").reduce((s, e) => s + (e.mebleg || 0), 0);

  return (
    <div className="space-y-3">
      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-700">Ümumi mədaxil (Debitor)</p>
          <p className="text-xl font-bold text-green-800">+{totalMedaxil.toFixed(2)} ₼</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-700">Ümumi məxaric (Kreditor)</p>
          <p className="text-xl font-bold text-red-800">−{totalMexaric.toFixed(2)} ₼</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-700">Xalis balans</p>
          <p className={`text-xl font-bold ${totalMedaxil - totalMexaric >= 0 ? "text-blue-800" : "text-red-800"}`}>
            {(totalMedaxil - totalMexaric).toFixed(2)} ₼
          </p>
        </div>
      </div>

      {/* Filtrlər */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {[
            { v: "all", label: "Hamısı" },
            { v: "Mədaxil", label: "📥 Mədaxil" },
            { v: "Məxaric", label: "📤 Məxaric" },
          ].map(t => (
            <Button key={t.v} size="sm" variant={filterTip === t.v ? "default" : "outline"} onClick={() => setFilterTip(t.v)}>
              {t.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-1 border-l border-border pl-2 ml-1">
          {[
            { v: "all", label: "Deb/Kred: Hamısı" },
            { v: "debitor", label: "Debitor (gəlir)" },
            { v: "kreditor", label: "Kreditor (xərc)" },
          ].map(t => (
            <Button key={t.v} size="sm" variant={filterDebKred === t.v ? "secondary" : "outline"} onClick={() => setFilterDebKred(t.v)}>
              {t.label}
            </Button>
          ))}
        </div>

        {kassalar.length > 0 && (
          <div className="border-l border-border pl-2 ml-1">
            <Select value={filterKassa} onValueChange={setFilterKassa}>
              <SelectTrigger className="h-8 text-xs w-44">
                <SelectValue placeholder="Kassa seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bütün kassalar</SelectItem>
                {kassalar.map(k => <SelectItem key={k.id} value={k.id}>{k.ad}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Cədvəl */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Tarix</th>
                <th className="text-left px-4 py-3 font-medium">Kassa</th>
                <th className="text-left px-4 py-3 font-medium">Tip</th>
                <th className="text-left px-4 py-3 font-medium">Debitor / Kreditor</th>
                <th className="text-left px-4 py-3 font-medium">Kateqoriya</th>
                <th className="text-right px-4 py-3 font-medium">Məbləğ</th>
                <th className="text-left px-4 py-3 font-medium">Açıqlama</th>
                {isAdmin && <th className="px-2 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(em => {
                const kassa = kassalar.find(k => k.id === em.kassa_id);
                const isDebitor = em.tip === "Mədaxil";
                return (
                  <tr key={em.id} className="border-t border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3">{em.tarix ? moment(em.tarix).format("DD.MM.YYYY HH:mm") : "—"}</td>
                    <td className="px-4 py-3">
                      {kassa ? (
                        <span className="text-purple-700 font-medium text-xs">{kassa.ad}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isDebitor ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {isDebitor ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {em.tip}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDebitor ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                        {isDebitor ? "📥 Debitor" : "📤 Kreditor"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{em.kateqoriya}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${isDebitor ? "text-green-600" : "text-red-600"}`}>
                      {isDebitor ? "+" : "−"}{(em.mebleg || 0).toFixed(2)} ₼
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{em.aciklama || "—"}</td>
                    {isAdmin && (
                      <td className="px-2 py-3">
                        <DeleteButton onDelete={() => onDelete(em.id)} />
                      </td>
                    )}
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Əməliyyat tapılmadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}