'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Settings, BarChart2,
  ChevronLeft, ChevronRight, LogOut, ShieldCheck, UserCircle,
  KeyRound, X, Eye, EyeOff,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { useSidebarStore } from '@/lib/sidebarStore';
import { useT } from '@/lib/i18n';

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  admin:      { label: 'Admin',      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  supervisor: { label: 'Supervisor', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  agent:      { label: 'Agent',      color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { currentUser, changePassword } = useAuthStore();
  const [pw, setPw]         = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow]     = useState(false);
  const [done, setDone]     = useState(false);
  const [err, setErr]       = useState('');

  const handleSave = () => {
    if (pw.length < 6)  { setErr(t('auth.passMin')); return; }
    if (pw !== confirm)  { setErr(t('auth.passMatch')); return; }
    if (!currentUser)    return;
    changePassword(currentUser.id, pw);
    setDone(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">{t('auth.changePass')}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        {done ? (
          <div className="flex items-center justify-center gap-2 py-4 text-emerald-400 text-sm font-medium">
            {t('auth.passUpdated')}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 mb-4">
              {t('task.changingAs')} <span className="text-white font-medium">{currentUser?.displayName}</span>
            </div>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={pw}
                onChange={(e) => { setPw(e.target.value); setErr(''); }}
                placeholder={t('auth.newPass')}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <input type={show ? 'text' : 'password'} value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setErr(''); }}
              placeholder={t('auth.confirmPass')}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {err && <p className="text-xs text-red-400">{err}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={pw.length < 6 || pw !== confirm}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors">
                {t('auth.updatePass')}
              </button>
              <button onClick={onClose}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-xl transition-colors">
                {t('auth.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const t = useT();
  const pathname = usePathname();
  const router   = useRouter();
  const { currentUser, logout } = useAuthStore();
  const { close } = useSidebarStore();
  const [collapsed, setCollapsed]     = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);

  const NAV_ITEMS = [
    { href: '/',       label: t('nav.dashboard'),  icon: LayoutDashboard },
    { href: '/agents', label: t('nav.agents'),     icon: Users },
    { href: '/admin',  label: t('nav.adminPanel'), icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const badge = ROLE_BADGE[currentUser?.role ?? 'agent'];

  return (
    <>
      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}

      <aside
        className={`relative flex flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300 h-full ${
          collapsed ? 'w-16' : 'w-64 sm:w-60'
        }`}
      >
        {/* Close button — mobile only */}
        <button
          onClick={close}
          className="md:hidden absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors z-10"
        >
          <X size={14} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <BarChart2 size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-white leading-tight">Methods Alpha</div>
              <div className="text-xs text-indigo-400 leading-tight">Damien/Constance equipe</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={close}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">{currentUser.displayName}</div>
                <span className={`inline-block text-[9px] font-medium px-1.5 py-0.5 rounded border mt-0.5 ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <button onClick={() => setShowPwModal(true)}
                className="flex-shrink-0 p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                title={t('auth.changePass')}>
                <KeyRound size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Logout + collapse */}
        <div className="border-t border-slate-700/50">
          <button onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors text-sm ${
              collapsed ? 'justify-center' : ''
            }`}
            title={t('nav.signOut')}>
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span>{t('nav.signOut')}</span>}
          </button>
          {/* Desktop collapse toggle */}
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center justify-center p-2.5 text-slate-600 hover:text-slate-300 transition-colors border-t border-slate-700/30">
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </aside>
    </>
  );
}
