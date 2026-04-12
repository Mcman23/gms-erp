import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useState, useEffect } from 'react';
import { getSession } from '@/hooks/useAppSession';
import AppLogin from './pages/AppLogin';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Kassa from './pages/Kassa';
import Musteriler from './pages/Musteriler';
import Sifarisler from './pages/Sifarisler';
import Planlama from './pages/Planlama';
import Iscilar from './pages/Iscilar';
import Mezuniyyet from './pages/Mezuniyyet';
import Maas from './pages/Maas';
import Anbar from './pages/Anbar';
import Fakturalar from './pages/Fakturalar';
import Maliyye from './pages/Maliyye';
import Avadanliq from './pages/Avadanliq';
import Sikayetler from './pages/Sikayetler';
import Hesabatlar from './pages/Hesabatlar';
import Ayarlar from './pages/Ayarlar';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [loggedIn, setLoggedIn] = useState(() => !!getSession());

  useEffect(() => {
    if (!loggedIn) return;
    const interval = setInterval(() => {
      if (!getSession()) setLoggedIn(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [loggedIn]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      // Still allow our custom login even if base44 auth says not registered
      if (!loggedIn) return <AppLogin onSuccess={() => setLoggedIn(true)} />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  if (!loggedIn) {
    return <AppLogin onSuccess={() => setLoggedIn(true)} />;
  }

  return (
    <Routes>
      <Route element={<Layout onLogout={() => setLoggedIn(false)} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/kassa" element={<Kassa />} />
        <Route path="/musteriler" element={<Musteriler />} />
        <Route path="/sifarisler" element={<Sifarisler />} />
        <Route path="/planlama" element={<Planlama />} />
        <Route path="/iscilar" element={<Iscilar />} />
        <Route path="/mezuniyyet" element={<Mezuniyyet />} />
        <Route path="/maas" element={<Maas />} />
        <Route path="/anbar" element={<Anbar />} />
        <Route path="/fakturalar" element={<Fakturalar />} />
        <Route path="/maliyye" element={<Maliyye />} />
        <Route path="/avadanliq" element={<Avadanliq />} />
        <Route path="/sikayetler" element={<Sikayetler />} />
        <Route path="/hesabatlar" element={<Hesabatlar />} />
        <Route path="/ayarlar" element={<Ayarlar />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App