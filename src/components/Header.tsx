'use client';

import { Bell, HelpCircle, User } from 'lucide-react';
import { useStore } from '@/lib/store';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onHelp?: () => void;
}

export default function Header({ title, subtitle, onHelp }: HeaderProps) {
  const { resetOnboarding } = useStore();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-700/50">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onHelp || resetOnboarding}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors"
          title="View guide"
        >
          <HelpCircle size={14} />
          Guide
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <Bell size={16} />
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
          <User size={14} className="text-white" />
        </div>
      </div>
    </header>
  );
}
