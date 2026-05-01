import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Download, X, Building2 } from "lucide-react";
import moment from "moment";

const statusColors = {
  "Tamamlandı": "bg-green-100 text-green-700",
  "İcrada": "bg-blue-100 text-blue-700",
  "Ləğv edildi": "bg-red-100 text-red-700",
  "Yeni": "bg-yellow-100 text-yellow-700",
  "Planlandı": "bg-purple-100 text-purple-700",
  "Təsdiqləndi": "bg-cyan-100 text-cyan-700",
};

export default function MusteriProfili({ musteri, senedler, sifarisler, kassaEmeliyyatlar, onClose }) {
  const [tab, setTab] = useState("senedler");

  const mSenedler = senedler.filter(s => s.musteri_id === musteri.id || s.istinad_id === musteri.id);
  const mSifarisler = sifarisler.filter(s => s.musteri_id === musteri.id);
  const mOdenisler = kassaEmeliyyatlar.filter(k => k.musteri_id === musteri.id && k.tip === "Mədaxil");

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border px-6 py-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{musteri.ad_soyad}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-0.5">
              {musteri.voen && <span>VÖEN: <span className="font-medium text-foreground">{musteri.voen}</span></span>}
              {musteri.telefon && <span>📞 {musteri.telefon}</span>}
              {musteri.email && <span>✉ {musteri.email}</span>}
              {musteri.musteri_tipi && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{musteri.musteri_tipi}</span>}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-border">
        {[
          { label: "Sənəd", val: mSenedler.length },
          { label: "Sifariş", val: mSifarisler.length },
          { label: "Ödəniş", val: mOdenisler.length },
        ].map(s => (
          <div key={s.label} className="bg-card px-4 py-3 text-center">
            <p className="text-2xl font-bold text-primary">{s.val}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="senedler">Sənədlər ({mSenedler.length})</TabsTrigger>
            <TabsTrigger value="sifarisler">Sifarişlər ({mSifarisler.length})</TabsTrigger>
            <TabsTrigger value="odenisler">Ödənişlər ({mOdenisler.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="senedler" className="mt-3">
            {mSenedler.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Bu müştəriyə aid sənəd yoxdur</p>
            ) : (
              <div className="space-y-2">
                {[...mSenedler].sort((a, b) => (b.tarix || "") > (a.tarix || "") ? 1 : -1).map(s => (
                  <div key={s.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-2.5 hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{s.ad}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{s.kateqoriya}</span>
                          {s.tarix && <span>• {moment(s.tarix).format("DD.MM.YYYY")}</span>}
                          {s.sened_nomresi && <span>• {s.sened_nomresi}</span>}
                        </div>
                      </div>
                    </div>
                    {s.fayl_url && (
                      <a href={s.fayl_url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                          <Download className="w-3 h-3" /> Yüklə
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sifarisler" className="mt-3">
            {mSifarisler.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Bu müştəriyə aid sifariş yoxdur</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Tarix</th>
                      <th className="text-left px-3 py-2 font-medium">Xidmət</th>
                      <th className="text-right px-3 py-2 font-medium">Məbləğ</th>
                      <th className="text-left px-3 py-2 font-medium">Status</th>
                      <th className="text-left px-3 py-2 font-medium">Ödəniş</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...mSifarisler].sort((a, b) => (b.tarix || "") > (a.tarix || "") ? 1 : -1).map(s => (
                      <tr key={s.id} className="border-t border-border/50 hover:bg-muted/20">
                        <td className="px-3 py-2">{s.tarix ? moment(s.tarix).format("DD.MM.YYYY") : "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{s.xidmet_tipi}</td>
                        <td className="px-3 py-2 text-right font-semibold">{(s.umumi_mebleg || s.qiymet || 0).toFixed(2)} ₼</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] || "bg-muted text-muted-foreground"}`}>{s.status}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.odenis_statusu === "Ödənilib" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.odenis_statusu || "—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="odenisler" className="mt-3">
            {mOdenisler.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Bu müştəriyə aid ödəniş yoxdur</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Tarix</th>
                      <th className="text-left px-3 py-2 font-medium">Kateqoriya</th>
                      <th className="text-left px-3 py-2 font-medium">Üsul</th>
                      <th className="text-right px-3 py-2 font-medium">Məbləğ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...mOdenisler].sort((a, b) => (b.tarix || "") > (a.tarix || "") ? 1 : -1).map(k => (
                      <tr key={k.id} className="border-t border-border/50 hover:bg-muted/20">
                        <td className="px-3 py-2">{k.tarix ? moment(k.tarix).format("DD.MM.YYYY") : "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{k.kateqoriya}</td>
                        <td className="px-3 py-2 text-muted-foreground">{k.odenis_metodu || "—"}</td>
                        <td className="px-3 py-2 text-right font-semibold text-green-600">+{(k.mebleg || 0).toFixed(2)} ₼</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}