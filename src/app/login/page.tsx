'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { useT } from '@/lib/i18n';
import { BarChart2, Eye, EyeOff, Lock, User, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const t = useT();
  const { login, currentUser } = useAuthStore();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) router.replace('/');
  }, [currentUser, router]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = login(username, password);
    setLoading(false);
    if (result.ok) {
      router.replace('/');
    } else {
      setError(result.error || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <BarChart2 size={22} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">Methods Agent Alpha</div>
            <div className="text-indigo-400 text-xs">Damien/Constance equipe</div>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight whitespace-pre-line">
            {t('auth.tagline')}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            {t('auth.description')}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { labelKey: 'auth.agents' as const,    value: '17' },
            { labelKey: 'auth.liveTasks' as const,  value: '∞' },
            { labelKey: 'auth.formats' as const,    value: '4' },
          ].map(({ labelKey, value }) => (
            <div key={labelKey} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-white mb-1">{value}</div>
              <div className="text-xs text-slate-400">{t(labelKey)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <BarChart2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">Agent Interface</span>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={18} className="text-indigo-400" />
              <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">{t('auth.secure')}</span>
            </div>
            <h2 className="text-2xl font-bold text-white">{t('auth.title')}</h2>
            <p className="text-slate-400 text-sm mt-1">{t('auth.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">{t('auth.username')}</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('auth.signingIn')}
                </>
              ) : (
                t('auth.signIn')
              )}
            </button>
          </form>

          {/* Credentials hint */}
          <div className="mt-8 p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
            <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">{t('auth.demoCreds')}</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('auth.admin')}:</span>
                <code className="text-indigo-300">admin / admin123</code>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('auth.supervisor')}:</span>
                <code className="text-indigo-300">damien.marie / super123</code>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('auth.agent')}:</span>
                <code className="text-indigo-300">ahmed.amasha / agent123</code>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            {t('auth.portal')}
          </p>
        </div>
      </div>
    </div>
  );
}
