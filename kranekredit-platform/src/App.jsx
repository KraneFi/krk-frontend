import { useEffect } from 'react';
import { AppProvider, useApp } from './router.jsx';
import { DataProvider, useData } from './data/DataContext.jsx';
import Layout, { PAGE_META } from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Checks from './pages/Checks.jsx';
import NewCheck from './pages/NewCheck.jsx';
import CheckDetail from './pages/CheckDetail.jsx';
import DecisionEngine from './pages/DecisionEngine.jsx';
import LoanQueue from './pages/LoanQueue.jsx';
import Servicing from './pages/Servicing.jsx';
import ApiDocs from './pages/ApiDocs.jsx';
import Users from './pages/Users.jsx';
import Compliance from './pages/Compliance.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import { bootstrap, useSession } from './api/auth.js';
import AgreementGate from './components/AgreementGate.jsx';
import { LIVE } from './config.js';

const ROUTES = {
  '/': Dashboard, '/checks': Checks, '/checks/new': NewCheck, '/decision-engine': DecisionEngine, '/loan-queue': LoanQueue,
  '/servicing': Servicing, '/api': ApiDocs, '/users': Users, '/compliance': Compliance, '/settings': Settings,
};

function Router() {
  const { path } = useApp();
  const { seed } = useData();
  if (ROUTES[path]) {
    const Page = ROUTES[path];
    return <Layout meta={PAGE_META[path]}><Page key={`${path}-${seed}`} /></Layout>;
  }
  if (path.startsWith('/checks/')) {
    const id = path.slice(8);
    return <Layout meta={PAGE_META.detail}><CheckDetail key={`${id}-${seed}`} id={id} /></Layout>;
  }
  return <NotFound page={path.replace(/^\//, '')} />;
}

function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div key={toast.id} role="status" className="kk-fade fixed left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-xl"
      style={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', maxWidth: 'calc(100vw - 32px)' }}>
      {toast.msg}
    </div>
  );
}

// Live mode requires a session; mock mode stays open so the prototype keeps
// working with no backend at all.
function Gate({ children }) {
  const { ready, user } = useSession();

  useEffect(() => { if (LIVE) bootstrap(); }, []);

  if (!LIVE) return children;
  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }
  if (!user) return <Login />;
  return <AgreementGate key={user.id}>{children}</AgreementGate>;
}

export default function App() {
  return (
    <Gate>
      <DataProvider>
        <AppProvider>
          <Router />
          <Toast />
        </AppProvider>
      </DataProvider>
    </Gate>
  );
}
