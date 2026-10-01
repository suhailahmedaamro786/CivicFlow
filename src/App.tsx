import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { DashboardCommandCenter } from './pages/DashboardCommandCenter';
import { NewRequestPage } from './pages/NewRequestPage';
import { RequestHistoryPage } from './pages/RequestHistoryPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { AgentMonitoringPage } from './pages/AgentMonitoringPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname === '/' ? '/' : window.location.pathname;
  });

  // Keep state in sync with browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route matching
  const renderCurrentView = () => {
    // Check if on Landing
    if (currentPath === '/' || currentPath === '') {
      return (
        <LandingPage
          onNavigate={navigateTo}
        />
      );
    }

    // Detail view: /dashboard/requests/[id]
    if (currentPath.startsWith('/dashboard/requests/')) {
      const id = currentPath.replace('/dashboard/requests/', '');
      return (
        <RequestDetailPage
          requestId={id}
          onNavigate={navigateTo}
        />
      );
    }

    if (currentPath === '/dashboard/new-request') {
      return <NewRequestPage onNavigate={navigateTo} />;
    }

    if (currentPath === '/dashboard/requests') {
      return <RequestHistoryPage onNavigate={navigateTo} />;
    }

    if (currentPath === '/dashboard/knowledge') {
      return <KnowledgeBasePage />;
    }

    if (currentPath === '/dashboard/agents') {
      return <AgentMonitoringPage />;
    }

    if (currentPath === '/dashboard/analytics') {
      return <AnalyticsPage />;
    }

    // Default to command center for /dashboard and unrecognized routes
    return (
      <DashboardCommandCenter
        onNavigate={navigateTo}
      />
    );
  };

  const isLanding = currentPath === '/' || currentPath === '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      
      {/* Top Navbar */}
      <Navbar
        currentPath={currentPath}
        onNavigate={navigateTo}
      />

      {/* Main Container */}
      <div className="flex-1 flex">
        {/* Render Sidebar only on Dashboard routes */}
        {!isLanding && (
          <Sidebar
            currentPath={currentPath}
            onNavigate={navigateTo}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={currentPath} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="min-h-full">
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

    </div>
  );
}
