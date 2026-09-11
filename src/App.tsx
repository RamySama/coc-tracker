import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';
import { useAuth } from './hooks/useAuth';
import { useVillages } from './store/villages';
import { createLocalRepo } from './lib/repo/localRepo';
import { createFirestoreRepo } from './lib/repo/firestoreRepo';
import { AppShell } from './components/AppShell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { VillagePage } from './pages/VillagePage';
import { Upgrades } from './pages/Upgrades';
import { Planner } from './pages/Planner';
import { Settings } from './pages/Settings';

export default function App() {
  const { user, loading, firebaseEnabled } = useAuth();
  const bind = useVillages((s) => s.bind);
  const { t } = useTranslation();

  useEffect(() => {
    if (!firebaseEnabled) {
      bind(createLocalRepo(), 'local');
      return;
    }
    if (loading) return;
    if (user) bind(createFirestoreRepo(user.uid), 'cloud');
    else bind(null, 'none');
  }, [firebaseEnabled, user, loading, bind]);

  if (firebaseEnabled && loading) {
    return <div className="grid min-h-svh place-items-center text-ink-dim">{t('common.loading')}</div>;
  }

  if (firebaseEnabled && !user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/village" element={<Navigate to="/village/buildings" replace />} />
          <Route path="/village/:tab" element={<VillagePage />} />
          <Route path="/buildings" element={<Navigate to="/village/buildings" replace />} />
          <Route path="/research" element={<Navigate to="/village/research" replace />} />
          <Route path="/upgrades" element={<Upgrades />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
