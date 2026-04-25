'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Settings, BarChart2,
  ChevronLeft, ChevronRight, LogOut, ShieldCheck, UserCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/authStore';

const NAV_ITEMS = [
  { href: '/',       label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/agents', label: 'Agents',      icon: Users },
  { href: '/admin',  label: 'Admin Panel', icon: Settings },
];

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  admin:      { label: 'Admin',      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  supervisor: { label: 'Supervisor', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  agent:      { label: 'Agent',      color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { currentUser, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const badge = ROLE_BADGE[currentUser?.role ?? 'agent'];

  return (
    <aside
      className={`flex flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <BarChart2 size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white leading-tight">Agent</div>
            <div className="text-xs text-indigo-400 leading-tight">Interface</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {currentUser && !collapsed && (
        <div className="px-3 py-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              {currentUser.role === 'admin'
                ? <ShieldCheck size={13} className="text-white" />
                : <UserCircle size={13} className="text-white" />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{currentUser.displayName}</div>
              <span className={`inline-block text-[9px] font-medium px-1.5 py-0.5 rounded border mt-0.5 ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Logout + collapse */}
      <div className="border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors text-sm ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Sign out"
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2.5 text-slate-600 hover:text-slate-300 transition-colors border-t border-slate-700/30"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
