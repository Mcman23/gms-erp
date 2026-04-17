import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

const KATEQORIYALAR = ["Müqavilə", "Faktura", "Akt", "Etibarnamə", "İcazə", "Əmr", "Qeyd", "Digər"];

export default function SenedAxtarish({ musteriler, onSearch }) {
  const [sened_adi, setSenedAdi] = useState("");
  const [musteri_id, setMusteriId] = useState("all");
  const [kateqoriya, setKateqoriya] = useState("all");
  const [tarix_bas, setTarixBas] = useState("");
  const [tarix_son, setTarixSon] = useState("");

  const handleSearch = () => {
    onSearch({ sened_adi, musteri_id, kateqoriya, tarix_bas, tarix_son });
  };

  const handleClear = () => {
    setSenedAdi(""); setMusteriId("all"); setKateqoriya("all");
    setTarixBas(""); setTarixSon("");
    onSearch({ sened_adi: "", musteri_id: "all", kateqoriya: "all", tarix_bas: "", tarix_son: "" });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Sənəd adı</label>
          <Input placeholder="Sənəd axtarın..." value={sened_adi} onChange={e => setSenedAdi(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Şirkət / Müştəri</label>
          <Select value={musteri_id} onValueChange={setMusteriId}>
            <SelectTrigger><SelectValue placeholder="Müştəri seçin" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hamısı</SelectItem>
              {musteriler.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.ad_soyad}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Kateqoriya</label>
          <Select value={kateqoriya} onValueChange={setKateqoriya}>
            <SelectTrigger><SelectValue placeholder="Kateqoriya" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hamısı</SelectItem>
              {KATEQORIYALAR.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tarix aralığı</label>
          <div className="flex gap-1">
            <Input type="date" className="text-xs" value={tarix_bas} onChange={e => setTarixBas(e.target.value)} />
            <Input type="date" className="text-xs" value={tarix_son} onChange={e => setTarixSon(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSearch} className="gap-2"><Search className="w-4 h-4" /> Axtar</Button>
        <Button variant="outline" onClick={handleClear} className="gap-2"><X className="w-4 h-4" /> Sıfırla</Button>
      </div>
    </div>
  );
}