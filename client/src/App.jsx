import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './utils/theme';
import AuthPage from './pages/AuthPage';
import AdminAuthPage from './pages/AdminAuthPage';
import AdminPage from './pages/AdminPage';
import HomePage from './pages/HomePage';
import RecordsPage from './pages/RecordsPage';
import { api } from './utils/api';
import StarryBackground from './components/StarryBackground';

const pageVariants = {
  enter: { opacity: 0, x: 50 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

function AppInner() {
  const [routeMode, setRouteMode] = useState(() => (
    typeof window !== 'undefined' && window.location.hash.startsWith('#/admin') ? 'admin' : 'user'
  ));
  const [authenticated, setAuthenticated] = useState(api.isAuthenticated());
  const [adminAuthenticated, setAdminAuthenticated] = useState(api.isAdminAuthenticated());
  const [currentPage, setCurrentPage] = useState('home');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncRouteMode = () => {
      setRouteMode(window.location.hash.startsWith('#/admin') ? 'admin' : 'user');
    };
    syncRouteMode();
    window.addEventListener('hashchange', syncRouteMode);
    return () => window.removeEventListener('hashchange', syncRouteMode);
  }, []);

  const refreshStats = useCallback(async () => {
    if (!authenticated) return;
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  }, [authenticated]);

  useEffect(() => {
    if (authenticated && currentPage === 'home') refreshStats();
  }, [authenticated, currentPage, refreshStats]);

  if (routeMode === 'admin') {
    if (!adminAuthenticated) {
      return (
        <>
          <StarryBackground />
          <AdminAuthPage
            onSuccess={() => setAdminAuthenticated(true)}
            onBack={() => {
              window.location.hash = '#/';
            }}
          />
        </>
      );
    }

    return (
      <div style={{ height: '100%', position: 'relative' }}>
        <StarryBackground />
        <AdminPage
          onExit={() => {
            api.logoutAdmin();
            setAdminAuthenticated(false);
            window.location.hash = '#/';
          }}
        />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <>
        <StarryBackground />
        <AuthPage onSuccess={() => setAuthenticated(true)} />
      </>
    );
  }

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <StarryBackground />
      <AnimatePresence mode="wait">
        {currentPage === 'home' ? (
          <motion.div
            key="home"
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            style={{ height: '100%' }}
          >
            <HomePage
              stats={stats}
              refreshStats={refreshStats}
              onNavigate={setCurrentPage}
            />
          </motion.div>
        ) : (
          <motion.div
            key="records"
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            style={{ height: '100%' }}
          >
            <RecordsPage onBack={() => setCurrentPage('home')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
