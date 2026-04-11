import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Users, Settings, LogOut } from "lucide-react";

const roller = ["Super Admin","Admin","Direktor","Əməliyyat meneceri","Dispatcher","Supervisor","Sahə işçisi","Satış meneceri","HR meneceri","Maliyyə meneceri","Kassir"];

export default function Ayarlar() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.User.list().then(setUsers).finally(() => setLoading(false));
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    await base44.users.inviteUser(inviteEmail, inviteRole);
    toast({ title: "Dəvət göndərildi", description: `${inviteEmail} adresinə dəvət göndərildi.` });
    setInviteEmail("");
    base44.entities.User.list().then(setUsers);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sistem Ayarları</h1>
        <p className="text-muted-foreground text-sm mt-1">İstifadəçilər, rollar və sistem konfiqurasiyası</p>
      </div>

      <Tabs defaultValue="istifadeciler">
        <TabsList>
          <TabsTrigger value="istifadeciler">İstifadəçilər</TabsTrigger>
          <TabsTrigger value="roller">Rollar</TabsTrigger>
          <TabsTrigger value="sistem">Sistem</TabsTrigger>
        </TabsList>

        <TabsContent value="istifadeciler" className="mt-4 space-y-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-4">Yeni İstifadəçi Dəvət Et</h3>
            <div className="flex gap-3 flex-wrap">
              <Input placeholder="Email ünvanı" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1 min-w-[200px]" />
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">İstifadəçi</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite}>Dəvət et</Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Ad</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Rol</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="roller" className="mt-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-4">Mövcud Rollar</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {roller.map(r => (
                <div key={r} className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sistem" className="mt-4 space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-sm">Vergi Ayarları</h3>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <Label>ƏDV faizi</Label>
                <Input value="18" disabled />
              </div>
              <div>
                <Label>Valyuta</Label>
                <Input value="AZN" disabled />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-3">Hesab</h3>
            <Button variant="destructive" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" /> Çıxış
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}