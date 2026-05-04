import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export function useSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      // Super Admin: role === "admin" (platform admin) OR DavetEdilmisIstifadeci rol === "Super Admin"
      if (u?.role === "admin") {
        setIsSuperAdmin(true);
        return;
      }
      // Check DavetEdilmisIstifadeci table
      base44.entities.DavetEdilmisIstifadeci
        .filter({ email: u?.email })
        .then(list => {
          const rec = list?.[0];
          setIsSuperAdmin(rec?.rol === "Super Admin");
        })
        .catch(() => setIsSuperAdmin(false));
    }).catch(() => setIsSuperAdmin(false));
  }, []);

  return isSuperAdmin;
}