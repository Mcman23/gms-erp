import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Download, FolderOpen, Plus } from "lucide-react";
import DeleteButton from "@/components/DeleteButton";
import SenedAxtarish from "@/components/senedler/SenedAxtarish";
import MusteriProfili from "@/components/senedler/MusteriProfili";
import moment from "moment";
import { useToast } from "@/components/ui/use-toast";

const KATEQORIYALAR = ["Müqavilə", "Faktura", "Akt", "Etibarnamə", "İcazə", "Əmr", "Qeyd", "Digər"];

export default function SendIdareetmesi() {
  const [senedler, setSenedler] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [sifarisler, setSifarisler] = useState([]);
  const [kassaEmeliyyatlar, setKassaEmeliyyatlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedMusteri, setSelectedMusteri] = useState(null);
  const [filters, setFilters] = useState({ sened_adi: "", musteri_id: "all", kateqoriya: "all", tarix_bas: "", tarix_son: "" });
  const fileRef = useRef();
  const { toast } = useToast();

  // Auto-generate sənəd nömrəsi
  const genSenedNo = (count) => {
    const y = new Date().getFullYear();
    return `SND-${y}-${String(count + 1).padStart(3, "0")}`;
  };

  const [form, setForm] = useState({
    ad: "", kateqoriya: "Müqavilə", istinad_tipi: "Ümumi", istinad_id: "", qeydler: "",
    fayl_url: "", fayl_adi: "", musteri_id: "", sirket_adi: "",
    imzalanma_tarixi: "", etibarliliq_tarixi: "",
  });

  const fetchData = () => {
    Promise.all([
      base44.entities.Sened.list("-created_date", 200).catch(() => []),
      base44.entities.Musteri.list().catch(() => []),
      base44.entities.Sifaris.list("-tarix", 300).catch(() => []),
      base44.entities.KassaEmeliyyati.list("-tarix", 300).catch(() => []),
    ]).then(([s, m, sf, k]) => {
      setSenedler(s.filter(x => x.status !== "Silindi"));
      setMusteriler(m);
      setSifarisler(sf);
      setKassaEmeliyyatlar(k);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, fayl_url: file_url, fayl_adi: file.name, ad: f.ad || file.name, fayl_olcusu: `${(file.size / 1024).toFixed(0)} KB` }));
    setUploading(false);
    toast({ title: "Fayl uğurla yükləndi" });
  };

  const handleMusteriSelect = (musteriId) => {
    if (!musteriId || musteriId === "none") {
      setForm(f => ({ ...f, musteri_id: "", sirket_adi: "" }));
      return;
    }
    const m = musteriler.find(x => x.id === musteriId);
    setForm(f => ({ ...f, musteri_id: musteriId, sirket_adi: m?.ad_soyad || "" }));
  };

  const handleCreate = async () => {
    if (!form.ad) return;
    const no = genSenedNo(senedler.length);
    await base44.entities.Sened.create({
      ...form,
      yukleyen: user?.full_name || user?.email || "—",
      tarix: new Date().toISOString().slice(0, 10),
      sened_nomresi: no,
      status: "Aktiv",
    });
    setShowDialog(false);
    setForm({ ad: "", kateqoriya: "Müqavilə", istinad_tipi: "Ümumi", istinad_id: "", qeydler: "", fayl_url: "", fayl_adi: "", musteri_id: "", sirket_adi: "", imzalanma_tarixi: "", etibarliliq_tarixi: "" });
    toast({ title: "Sənəd uğurla əlavə edildi" });
    fetchData();
  };

  const handleDelete = async (sened) => {
    await base44.entities.Sened.update(sened.id, { status: "Silindi" });
    fetchData();
    toast({ title: "Sənəd silindi" });
  };

  // Apply filters
  const filtered = senedler.filter(s => {
    if (filters.sened_adi && !s.ad?.toLowerCase().includes(filters.sened_adi.toLowerCase())) return false;
    if (filters.musteri_id !== "all" && s.musteri_id !== filters.musteri_id) return false;
    if (filters.kateqoriya !== "all" && s.kateqoriya !== filters.kateqoriya) return false;
    if (filters.tarix_bas && (s.tarix || "") < filters.tarix_bas) return false;
    if (filters.tarix_son && (s.tarix || "") > filters.tarix_son) return false;
    return true;
  });

  // When a musteri is selected from search, show profile
  const handleSearchChange = (f) => {
    setFilters(f);
    if (f.musteri_id && f.musteri_id !== "all") {
      const m = musteriler.find(x => x.id === f.musteri_id);
      setSelectedMusteri(m || null);
    } else {
      setSelectedMusteri(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FolderOpen className="w-6 h-6 text-primary" /> Sənəd İdarəetməsi</h1>
          <p className="text-muted-foreground text-sm mt-1">{senedler.length} sənəd</p>
        </div>
        <Button className="gap-2" onClick={() => setShowDialog(true)}><Plus className="w-4 h-4" /> Sənəd Əlavə Et</Button>
      </div>

      {/* Search Panel */}
      <SenedAxtarish musteriler={musteriler} onSearch={handleSearchChange} />

      {/* Müştəri Profili (if selected) */}
      {selectedMusteri && (
        <MusteriProfili
          musteri={selectedMusteri}
          senedler={senedler}
          sifarisler={sifarisler}
          kassaEmeliyyatlar={kassaEmeliyyatlar}
          onClose={() => { setSelectedMusteri(null); setFilters(f => ({ ...f, musteri_id: "all" })); }}
        />
      )}

      {/* Document Grid */}
      {!selectedMusteri && (
        <>
          <div className="text-sm text-muted-foreground">
            {filtered.length} sənəd tapıldı
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <div key={s.id} className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm leading-tight">{s.ad}</p>
                      <div className="flex gap-1 flex-wrap mt-0.5">
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{s.kateqoriya}</span>
                        {s.sened_nomresi && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{s.sened_nomresi}</span>}
                      </div>
                    </div>
                  </div>
                  <DeleteButton onDelete={() => handleDelete(s)} />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {s.sirket_adi && <p className="font-medium text-foreground">🏢 {s.sirket_adi}</p>}
                  <p>Yükləyən: {s.yukleyen || "—"}</p>
                  <p>Tarix: {s.tarix ? moment(s.tarix).format("DD.MM.YYYY") : "—"}</p>
                  {s.imzalanma_tarixi && <p>İmza: {moment(s.imzalanma_tarixi).format("DD.MM.YYYY")}</p>}
                  {s.etibarliliq_tarixi && <p>Etibarlı: {moment(s.etibarliliq_tarixi).format("DD.MM.YYYY")}</p>}
                </div>
                {s.fayl_url && (
                  <a href={s.fayl_url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="w-full gap-2 h-8">
                      <Download className="w-3.5 h-3.5" /> Yüklə / Bax
                    </Button>
                  </a>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 py-16 text-center text-muted-foreground">
                <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                Sənəd tapılmadı
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Sənəd Əlavə Et</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Sənəd adı *</Label><Input value={form.ad} onChange={e => setForm(f => ({...f, ad: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kateqoriya</Label>
                <Select value={form.kateqoriya} onValueChange={v => setForm(f => ({...f, kateqoriya: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{KATEQORIYALAR.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Müştəri seç</Label>
                <Select value={form.musteri_id || "none"} onValueChange={handleMusteriSelect}>
                  <SelectTrigger><SelectValue placeholder="Seçin..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seçilməyib</SelectItem>
                    {musteriler.map(m => <SelectItem key={m.id} value={m.id}>{m.ad_soyad}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!form.musteri_id && (
              <div><Label>Şirkət adı (manual)</Label><Input value={form.sirket_adi} onChange={e => setForm(f => ({...f, sirket_adi: e.target.value}))} placeholder="Şirkət adı..." /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>İmzalanma tarixi</Label><Input type="date" value={form.imzalanma_tarixi} onChange={e => setForm(f => ({...f, imzalanma_tarixi: e.target.value}))} /></div>
              <div><Label>Etibarlılıq tarixi</Label><Input type="date" value={form.etibarliliq_tarixi} onChange={e => setForm(f => ({...f, etibarliliq_tarixi: e.target.value}))} /></div>
            </div>
            <div>
              <Label>Fayl yüklə</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
                {form.fayl_adi ? (
                  <p className="text-sm font-medium text-green-600">✓ {form.fayl_adi}</p>
                ) : (
                  <div><Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" /><p className="text-sm text-muted-foreground">{uploading ? "Yüklənir..." : "Klikləyin və ya fayl seçin"}</p></div>
                )}
              </div>
            </div>
            <div><Label>Qeydlər</Label><Textarea value={form.qeydler} onChange={e => setForm(f => ({...f, qeydler: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleCreate} disabled={uploading}>Saxla</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}