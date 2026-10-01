import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Building2, 
  Sparkles, 
  PlusCircle, 
  Play, 
  ShieldCheck, 
  ExternalLink,
  Cpu,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLaunchDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onLaunchDemo }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const go = (path: string) => { setMobileOpen(false); onNavigate(path); };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => go('/')} 
            className="flex items-center gap-3 text-left group focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">CivicFlow</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">AI</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">From Citizen Problems to Verified Action Plans</p>
            </div>
          </button>

          {/* System Engine Indicator */}
          <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Dynamic AI Workers Active
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-mono text-[11px]">Statutory RAG</span>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => go('/dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentPath === '/dashboard' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => go('/dashboard/requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentPath === '/dashboard/requests' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Requests
          </button>

          <button
            onClick={() => go('/dashboard/knowledge')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentPath === '/dashboard/knowledge' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Knowledge
          </button>

          <button
            onClick={() => go('/demo')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              currentPath === '/demo'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
            }`}
            title="Open Judge Multi-Agent Live Execution Dashboard"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Demo</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold uppercase ${
              currentPath === '/demo' ? 'bg-blue-700 text-white' : 'bg-indigo-200/60 text-indigo-900'
            }`}>Judge</span>
          </button>
        </div>

        <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={() => setMobileOpen((open) => !open)} className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button type="button" aria-label="Close navigation overlay" className="fixed inset-0 top-16 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.div className="absolute left-0 right-0 top-16 z-50 border-b border-slate-200 bg-white px-4 py-4 shadow-xl lg:hidden" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ['/dashboard', 'Dashboard'], ['/dashboard/requests', 'Requests'], ['/dashboard/knowledge', 'Knowledge'], ['/demo', 'Judge Demo'], ['/dashboard/agents', 'Agent Monitoring'], ['/dashboard/analytics', 'System Telemetry'],
                ].map(([path, label]) => (
                  <button key={path} onClick={() => go(path)} className={`flex min-h-11 items-center justify-between rounded-xl px-4 text-left text-sm font-semibold transition-colors ${currentPath === path ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`}>
                    <span>{label}</span>
                    {path === '/demo' && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-700">Judge</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </header>
  );
};
