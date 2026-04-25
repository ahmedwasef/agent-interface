'use client';

import { HelpCircle, ShieldCheck, UserCircle, Menu } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { useStore } from '@/lib/store';
import { useSidebarStore } from '@/lib/sidebarStore';
import { useLangStore } from '@/lib/langStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onHelp?: () => void;
}

export default function Header({ title, subtitle, onHelp }: HeaderProps) {
  const { currentUser } = useAuthStore();
  const { resetOnboarding } = useStore();
  const { toggle: toggleSidebar } = useSidebarStore();
  const { lang, toggle: toggleLang } = useLangStore();

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 border-b border-slate-700/50 flex-shrink-0 gap-3">
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="md:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-white truncate">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      {/* Right: user badge + lang toggle + guide */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* User badge — hidden on very small screens */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700/50">
            {currentUser.role === 'admin'
              ? <ShieldCheck size={14} className="text-indigo-400" />
              : <UserCircle size={14} className="text-slate-400" />}
            <span className="text-xs text-slate-300 font-medium hidden md:block">{currentUser.displayName}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border capitalize ${
              currentUser.role === 'admin'      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
              currentUser.role === 'supervisor' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
              'bg-slate-500/20 text-slate-400 border-slate-500/30'
            }`}>{currentUser.role}</span>
          </div>
        )}

        {/* FR/EN language toggle */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-colors text-xs font-bold"
          title={lang === 'en' ? 'Switch to French' : 'Passer en anglais'}
        >
          <span className={lang === 'en' ? 'text-white' : 'text-slate-500'}>EN</span>
          <span className="text-slate-600 mx-0.5">·</span>
          <span className={lang === 'fr' ? 'text-white' : 'text-slate-500'}>FR</span>
        </button>

        {/* Guide button */}
        <button
          onClick={onHelp || resetOnboarding}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors"
          title="View guide"
        >
          <HelpCircle size={14} />
          <span className="hidden sm:inline">{lang === 'fr' ? 'Guide' : 'Guide'}</span>
        </button>
      </div>
    </header>
  );
}
