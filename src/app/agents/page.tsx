'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { AGENTS } from '@/lib/agents';
import { getWeeklyStats } from '@/lib/utils';
import Header from '@/components/Header';
import { ChevronDown, Search, ChevronRight, CheckCircle2, Clock, PauseCircle, Circle } from 'lucide-react';

export default function AgentsPage() {
  const { tasks, initialize, resetOnboarding } = useStore();
  const router = useRouter();
  const [search, setSearch] = useState('');

  useEffect(() => { initialize(); }, [initialize]);

  const stats = getWeeklyStats(tasks);
  const filtered = AGENTS.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Agents" subtitle="Select an agent to view their weekly tasks" onHelp={resetOnboarding} />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Agent grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((agent) => {
            const s = stats.find((x) => x.agentId === agent.id);
            const rate = s?.completionRate ?? 0;
            return (
              <button
                key={agent.id}
                onClick={() => router.push(`/agent/${agent.id}`)}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-left hover:border-indigo-500/50 hover:bg-slate-800 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.initials}
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors mt-1" />
                </div>
                <div className="text-sm font-semibold text-white mb-0.5">{agent.name}</div>
                <div className="text-xs text-slate-500 mb-4">{agent.role}</div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Completion</span>
                    <span
                      className="font-semibold"
                      style={{ color: rate >= 70 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444' }}
                    >
                      {rate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${rate}%`,
                        backgroundColor: rate >= 70 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div>
                    <div className="text-emerald-400 font-bold text-sm">{s?.completed ?? 0}</div>
                    <div className="text-[10px] text-slate-500">Done</div>
                  </div>
                  <div>
                    <div className="text-blue-400 font-bold text-sm">{s?.inProgress ?? 0}</div>
                    <div className="text-[10px] text-slate-500">Active</div>
                  </div>
                  <div>
                    <div className="text-amber-400 font-bold text-sm">{s?.onHold ?? 0}</div>
                    <div className="text-[10px] text-slate-500">Hold</div>
                  </div>
                  <div>
                    <div className="text-gray-400 font-bold text-sm">{s?.notStarted ?? 0}</div>
                    <div className="text-[10px] text-slate-500">New</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
