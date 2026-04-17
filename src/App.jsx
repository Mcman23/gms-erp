import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
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
import QiymetKalkulyatoru from './pages/QiymetKalkulyatoru';
import QiymetTeklifleri from './pages/QiymetTeklifleri';
import SendIdareetmesi from './pages/SendIdareetmesi';
import Podratcilar from './pages/Podratcilar';
import PodratciHesabati from './pages/PodratciHesabati';
import AdGunleri from './pages/AdGunleri';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
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
        <Route path="/qiymet-kalkulyatoru" element={<QiymetKalkulyatoru />} />
        <Route path="/qiymet-teklifleri" element={<QiymetTeklifleri />} />
        <Route path="/senedler" element={<SendIdareetmesi />} />
        <Route path="/podratcilar" element={<Podratcilar />} />
        <Route path="/podratci-hesabati" element={<PodratciHesabati />} />
        <Route path="/ad-gunleri" element={<AdGunleri />} />
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