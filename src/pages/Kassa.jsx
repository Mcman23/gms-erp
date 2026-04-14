import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowUpRight, ArrowDownRight, Wallet, Lock, RotateCcw } from "lucide-react";
import DeleteButton from "../components/DeleteButton";
import { useAdmin } from "../hooks/useAdmin";
import moment from "moment";

export default function Kassa() {
  const isAdmin = useAdmin();
  const [kassalar, setKassalar] = useState([]);
  const [emeliyyatlar, setEmeliyyatlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showKassaDialog, setShowKassaDialog] = useState(false);
  const [showEmeliyyatDialog, setShowEmeliyyatDialog] = useState(false);
  const [selectedKassa, setSelectedKassa] = useState(null);
  const [kassaForm, setKassaForm] = useState({ ad: "", kod: "", tip: "Nağd", mesul_sexs: "" });
  const [emeliyyatForm, setEmeliyyatForm] = useState({
    kassa_id: "", tip: "Mədaxil", kateqoriya: "Xidmət ödənişi", mebleg: "", odenis_metodu: "Nağd", aciklama: ""
  });

  const fetchData = () => {
    Promise.all([
      base44.entities.Kassa.list(),
      base44.entities.KassaEmeliyyati.list("-created_date", 50),
    ]).then(([k, e]) => {
      setKassalar(k);
      setEmeliyyatlar(e);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleKassaCreate = async () => {
    await base44.entities.Kassa.create({ ...kassaForm, balans: 0, status: "Aktiv" });
    setShowKassaDialog(false);
    setKassaForm({ ad: "", kod: "", tip: "Nağd", mesul_sexs: "" });
    fetchData();
  };

  const handleEmeliyyat = async () => {
    const mebleg = parseFloat(emeliyyatForm.mebleg);
    if (!mebleg || !emeliyyatForm.kassa_id) return;
    
    const kassa = kassalar.find(k => k.id === emeliyyatForm.kassa_id);
    if (!kassa) return;

    const yeniBalans = emeliyyatForm.tip === "Mədaxil"
      ? (kassa.balans || 0) + mebleg
      : (kassa.balans || 0) - mebleg;

    await base44.entities.KassaEmeliyyati.create({
      ...emeliyyatForm,
      mebleg,
      tarix: new Date().toISOString(),
      status: "Təsdiqləndi",
    });
    await base44.entities.Kassa.update(kassa.id, { balans: yeniBalans });

    setShowEmeliyyatDialog(false);
    setEmeliyyatForm({ kassa_id: "", tip: "Mədaxil", kateqoriya: "Xidmət ödənişi", mebleg: "", odenis_metodu: "Nağd", aciklama: "" });
    fetchData();
  };

  const handleKassaBaglama = async (kassa) => {
    await base44.entities.Kassa.update(kassa.id, {
      gun_baglanis_balansi: kassa.balans,
      son_baglanis_tarixi: new Date().toISOString(),
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalBalans = kassalar.reduce((sum, k) => sum + (k.balans || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kassa İdarəetməsi</h1>
          <p className="text-muted-foreground text-sm mt-1">Bütün kassalar və əməliyyatlar</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowEmeliyyatDialog(true)} variant="outline" className="gap-2">
            <ArrowUpRight className="w-4 h-4" /> Əməliyyat
          </Button>
          <Button onClick={() => setShowKassaDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Yeni Kassa
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Ümumi Kassa Balansı</span>
        </div>
        <p className="text-3xl font-bold">{totalBalans.toFixed(2)} ₼</p>
        <p className="text-sm text-muted-foreground mt-1">{kassalar.length} aktiv kassa</p>
      </div>

      <Tabs defaultValue="kassalar">
        <TabsList>
          <TabsTrigger value="kassalar">Kassalar ({kassalar.length})</TabsTrigger>
          <TabsTrigger value="emeliyyatlar">Əməliyyatlar ({emeliyyatlar.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="kassalar" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kassalar.map(kassa => (
              <div key={kassa.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{kassa.ad}</h3>
                    <p className="text-xs text-muted-foreground">{kassa.kod} • {kassa.tip}</p>
                  </div>
                  <Badge variant={kassa.status === "Aktiv" ? "default" : "secondary"}>
                    {kassa.status}
                  </Badge>
                </div>
                <p className="text-2xl font-bold mt-2">{(kassa.balans || 0).toFixed(2)} ₼</p>
                <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Açılış balansı</span>
                    <span>{(kassa.gun_acilis_balansi || 0).toFixed(2)} ₼</span>
                  </div>
                  {kassa.son_baglanis_tarixi && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Son bağlanış</span>
                      <span>{moment(kassa.son_baglanis_tarixi).format("DD.MM.YYYY HH:mm")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Məsul</span>
                    <span>{kassa.mesul_sexs || "—"}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1 text-xs gap-1"
                    onClick={() => { setEmeliyyatForm(f => ({ ...f, kassa_id: kassa.id })); setShowEmeliyyatDialog(true); }}>
                    <ArrowUpRight className="w-3 h-3" /> Əməliyyat
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleKassaBaglama(kassa)}>
                    <Lock className="w-3 h-3" /> Bağla
                  </Button>
                  {isAdmin && <DeleteButton onDelete={async () => { await base44.entities.Kassa.delete(kassa.id); fetchData(); }} />}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="emeliyyatlar" className="mt-4">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Tarix</th>
                    <th className="text-left px-4 py-3 font-medium">Kassa</th>
                    <th className="text-left px-4 py-3 font-medium">Tip</th>
                    <th className="text-left px-4 py-3 font-medium">Kateqoriya</th>
                    <th className="text-right px-4 py-3 font-medium">Məbləğ</th>
                    <th className="text-left px-4 py-3 font-medium">Açıqlama</th>
                  </tr>
                </thead>
                <tbody>
                  {emeliyyatlar.map(em => {
                    const kassa = kassalar.find(k => k.id === em.kassa_id);
                    return (
                      <tr key={em.id} className="border-t border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3">{em.tarix ? moment(em.tarix).format("DD.MM.YYYY HH:mm") : "—"}</td>
                        <td className="px-4 py-3">{kassa?.ad || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${em.tip === "Mədaxil" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {em.tip === "Mədaxil" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {em.tip}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{em.kateqoriya}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${em.tip === "Mədaxil" ? "text-green-600" : "text-red-600"}`}>
                          {em.tip === "Mədaxil" ? "+" : "−"}{(em.mebleg || 0).toFixed(2)} ₼
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{em.aciklama || "—"}</td>
                        {isAdmin && <td className="px-2 py-3"><DeleteButton onDelete={async () => { await base44.entities.KassaEmeliyyati.delete(em.id); fetchData(); }} /></td>}
                      </tr>
                    );
                  })}
                  {emeliyyatlar.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Əməliyyat yoxdur</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Kassa Dialog */}
      <Dialog open={showKassaDialog} onOpenChange={setShowKassaDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Kassa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Kassa adı</Label><Input value={kassaForm.ad} onChange={e => setKassaForm(f => ({...f, ad: e.target.value}))} /></div>
              <div><Label>Kassa kodu</Label><Input value={kassaForm.kod} onChange={e => setKassaForm(f => ({...f, kod: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tip</Label>
                <Select value={kassaForm.tip} onValueChange={v => setKassaForm(f => ({...f, tip: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nağd">Nağd</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="POS terminal">POS terminal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Məsul şəxs</Label><Input value={kassaForm.mesul_sexs} onChange={e => setKassaForm(f => ({...f, mesul_sexs: e.target.value}))} /></div>
            </div>
            <Button className="w-full" onClick={handleKassaCreate}>Yarat</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emeliyyat Dialog */}
      <Dialog open={showEmeliyyatDialog} onOpenChange={setShowEmeliyyatDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Əməliyyat</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kassa</Label>
              <Select value={emeliyyatForm.kassa_id} onValueChange={v => setEmeliyyatForm(f => ({...f, kassa_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Kassa seçin" /></SelectTrigger>
                <SelectContent>
                  {kassalar.map(k => <SelectItem key={k.id} value={k.id}>{k.ad} ({(k.balans || 0).toFixed(2)} ₼)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Əməliyyat tipi</Label>
                <Select value={emeliyyatForm.tip} onValueChange={v => setEmeliyyatForm(f => ({...f, tip: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mədaxil">Mədaxil</SelectItem>
                    <SelectItem value="Məxaric">Məxaric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kateqoriya</Label>
                <Select value={emeliyyatForm.kateqoriya} onValueChange={v => setEmeliyyatForm(f => ({...f, kateqoriya: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Xidmət ödənişi","Maaş","Material alışı","Avadanlıq","İcarə","Kommunal","Nəqliyyat","Digər mədaxil","Digər məxaric"].map(c =>
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Məbləğ (₼)</Label><Input type="number" value={emeliyyatForm.mebleg} onChange={e => setEmeliyyatForm(f => ({...f, mebleg: e.target.value}))} /></div>
              <div>
                <Label>Ödəniş metodu</Label>
                <Select value={emeliyyatForm.odenis_metodu} onValueChange={v => setEmeliyyatForm(f => ({...f, odenis_metodu: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Nağd","Bank köçürməsi","Kart","POS"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Açıqlama</Label><Textarea value={emeliyyatForm.aciklama} onChange={e => setEmeliyyatForm(f => ({...f, aciklama: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleEmeliyyat}>Əməliyyat yarat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}