import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './utils/theme';
import AuthPage from './pages/AuthPage';
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
  const [authenticated, setAuthenticated] = useState(api.isAuthenticated());
  const [currentPage, setCurrentPage] = useState('home');
  const [stats, setStats] = useState(null);

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
    if (authenticated) refreshStats();
  }, [authenticated, refreshStats]);

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
