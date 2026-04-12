const SESSION_KEY = "cleanpro_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session.loginTime) return null;
    if (Date.now() - session.loginTime > SESSION_DURATION_MS) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, loginTime: Date.now() }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Which menu paths are allowed per role
export const ROL_MENYU = {
  "Kassir":          ["/kassa", "/sifarisler", "/fakturalar"],
  "HR meneceri":     ["/iscilar", "/mezuniyyet", "/maas"],
  "Dispatcher":      ["/sifarisler", "/planlama"],
  "Maliyyə meneceri":["/maliyye", "/kassa", "/fakturalar", "/hesabatlar"],
  "Anbar müdürü":    ["/anbar", "/avadanliq"],
  "Supervisor":      ["/sifarisler", "/sikayetler", "/iscilar"],
  "Sahə işçisi":     ["/sifarisler"],
  "Satış meneceri":  ["/musteriler", "/sifarisler", "/fakturalar"],
  "Admin":           null,   // null = all
  "Super Admin":     null,
  "Direktor":        null,
  "Audit/Baxış":     null,
};

export function hasAccess(rol, path) {
  const allowed = ROL_MENYU[rol];
  if (!allowed) return true; // all access
  if (path === "/") return true; // dashboard always
  return allowed.some(p => path.startsWith(p));
}