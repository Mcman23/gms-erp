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
import moment from "moment";
import { useToast } from "@/components/ui/use-toast";

const KATEQORIYALAR = ["Müqavilə", "Faktura", "Akt", "Etibarnamə", "İcazə", "Əmr", "Qeyd", "Digər"];
const ISTINAD_TIPLERI = ["Müştəri", "Sifariş", "Faktura", "İşçi", "Ümumi"];

export default function SendIdareetmesi() {
  const [senedler, setSenedler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterKat, setFilterKat] = useState("all");
  const [user, setUser] = useState(null);
  const fileRef = useRef();
  const { toast } = useToast();

  const [form, setForm] = useState({
    ad: "", kateqoriya: "Müqavilə", istinad_tipi: "Ümumi", istinad_id: "", qeydler: "", fayl_url: "", fayl_adi: "",
  });

  const fetchData = () => {
    base44.entities.Sened.list("-created_date", 100).catch(() => []).then(data => {
      setSenedler(data.filter(s => s.status !== "Silindi"));
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
    toast({ title: "Fayl yükləndi" });
  };

  const handleCreate = async () => {
    if (!form.ad) return;
    await base44.entities.Sened.create({
      ...form,
      yukleyen: user?.full_name || user?.email || "—",
      tarix: new Date().toISOString().slice(0, 10),
      status: "Aktiv",
    });
    setShowDialog(false);
    setForm({ ad: "", kateqoriya: "Müqavilə", istinad_tipi: "Ümumi", istinad_id: "", qeydler: "", fayl_url: "", fayl_adi: "" });
    fetchData();
  };

  const handleDelete = async (sened) => {
    await base44.entities.Sened.update(sened.id, { ...sened, status: "Silindi" });
    fetchData();
    toast({ title: "Sənəd silindi" });
  };

  const filtered = filterKat === "all" ? senedler : senedler.filter(s => s.kateqoriya === filterKat);

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

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={filterKat === "all" ? "default" : "outline"} onClick={() => setFilterKat("all")}>Hamısı</Button>
        {KATEQORIYALAR.map(k => (
          <Button key={k} size="sm" variant={filterKat === k ? "default" : "outline"} onClick={() => setFilterKat(k)}>{k}</Button>
        ))}
      </div>

      {/* Grid */}
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
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{s.kateqoriya}</span>
                </div>
              </div>
              <DeleteButton onDelete={() => handleDelete(s)} />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Yükləyən: {s.yukleyen || "—"}</p>
              <p>Tarix: {s.tarix ? moment(s.tarix).format("DD.MM.YYYY") : "—"}</p>
              {s.istinad_tipi && <p>İstinad: {s.istinad_tipi}</p>}
              {s.fayl_adi && <p className="truncate">Fayl: {s.fayl_adi}</p>}
            </div>
            {s.fayl_url && (
              <a href={s.fayl_url} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="w-full gap-2 h-8">
                  <Download className="w-3.5 h-3.5" /> Yüklə
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
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
                <Label>İstinad tipi</Label>
                <Select value={form.istinad_tipi} onValueChange={v => setForm(f => ({...f, istinad_tipi: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ISTINAD_TIPLERI.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {/* File upload */}
            <div>
              <Label>Fayl yüklə</Label>
              <div
                className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
                {form.fayl_adi ? (
                  <div><p className="text-sm font-medium text-green-600">✓ {form.fayl_adi}</p></div>
                ) : (
                  <div><Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" /><p className="text-sm text-muted-foreground">{uploading ? "Yüklənir..." : "Klikləyin və ya fayl seçin"}</p></div>
                )}
              </div>
            </div>
            <div><Label>Qeydlər</Label><Textarea value={form.qeydler} onChange={e => setForm(f => ({...f, qeydler: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleCreate}>Saxla</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}