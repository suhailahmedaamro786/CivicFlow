import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  BookOpen, 
  Cpu, 
  BarChart3, 
  ShieldCheck, 
  Play
} from 'lucide-react';
import { storageService } from '../services/storageService';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const analytics = storageService.getAnalytics();

  const primaryNavItems = [
    {
      id: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: '/dashboard/requests',
      label: 'Requests',
      icon: History,
      badge: analytics.totalRequests ? String(analytics.totalRequests) : null
    },
    {
      id: '/dashboard/knowledge',
      label: 'Knowledge',
      icon: BookOpen,
      badge: 'Verified'
    },
    {
      id: '/demo',
      label: 'Demo',
      icon: Play,
      badge: 'Judge'
    }
  ];

  const systemDevItems = [
    {
      id: '/dashboard/agents',
      label: 'Agent Monitoring',
      icon: Cpu,
      badge: 'Engine'
    },
    {
      id: '/dashboard/analytics',
      label: 'System Telemetry',
      icon: BarChart3,
      badge: null
    }
  ];

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      
      {/* Navigation menu */}
      <div className="p-4 space-y-6 flex-1">
        
        {/* Platform Core Navigation */}
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Platform
          </div>

          {primaryNavItems.map((item) => {
            const isActive = currentPath === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    isActive 
                      ? 'bg-blue-700 text-white' 
                      : item.badge === 'Judge'
                      ? 'bg-indigo-900 text-indigo-300 border border-indigo-700'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* System / Developer Sub-Section */}
        <div className="space-y-1 pt-4 border-t border-slate-800/80">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            System / Developer
          </div>

          {systemDevItems.map((item) => {
            const isActive = currentPath === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Minimal Trust Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-[11px] leading-tight">
            Dynamic Worker Selection Active
          </span>
        </div>
      </div>

    </aside>
  );
};
