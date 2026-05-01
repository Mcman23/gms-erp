import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setIsAdmin(u?.role === "admin");
    }).catch(() => setIsAdmin(false));
  }, []);

  return isAdmin;
}