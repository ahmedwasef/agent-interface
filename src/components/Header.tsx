'use client';

import { HelpCircle, ShieldCheck, UserCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { useStore } from '@/lib/store';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onHelp?: () => void;
}

export default function Header({ title, subtitle, onHelp }: HeaderProps) {
  const { currentUser } = useAuthStore();
  const { resetOnboarding } = useStore();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-700/50 flex-shrink-0">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700/50">
            {currentUser.role === 'admin'
              ? <ShieldCheck size={14} className="text-indigo-400" />
              : <UserCircle size={14} className="text-slate-400" />}
            <span className="text-xs text-slate-300 font-medium">{currentUser.displayName}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border capitalize ${
              currentUser.role === 'admin'      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
              currentUser.role === 'supervisor' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
              'bg-slate-500/20 text-slate-400 border-slate-500/30'
            }`}>{currentUser.role}</span>
          </div>
        )}

        <button
          onClick={onHelp || resetOnboarding}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors"
          title="View guide"
        >
          <HelpCircle size={14} />
          Guide
        </button>
      </div>
    </header>
  );
}
