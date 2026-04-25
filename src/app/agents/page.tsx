'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { getWeeklyStats } from '@/lib/utils';
import Header from '@/components/Header';
import { Search, ChevronRight, ChevronDown, CheckCircle2, Clock, PauseCircle, Circle, ArrowRight } from 'lucide-react';

function DonutRing({ percent, color, size = 72 }: { percent: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AgentsPage() {
  const { tasks, agents, initialize, resetOnboarding } = useStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { initialize(); }, [initialize]);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const stats = getWeeklyStats(tasks, agents);

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = agents.find((a) => a.id === selectedId) ?? null;
  const selectedStats = stats.find((s) => s.agentId === selectedId);

  const rateColor = (r: number) => r >= 70 ? '#10B981' : r >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Agents" subtitle="Select an agent to view their weekly tasks" onHelp={resetOnboarding} />
      <div className="flex-1 overflow-y-auto p-6">

        <div className="max-w-xl space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setOpen(!open)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 border border-slate-700 hover:border-indigo-500/60 rounded-xl text-sm transition-colors"
            >
              {selected ? (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: selected.color }}>
                    {selected.initials}
                  </div>
                  <span className="text-white font-medium">{selected.name}</span>
                </div>
              ) : (
                <span className="text-slate-400">Select an agent…</span>
              )}
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-400 text-center">No agents found</div>
                  ) : (
                    filtered.map((agent) => {
                      const s = stats.find((x) => x.agentId === agent.id);
                      const rate = s?.completionRate ?? 0;
                      return (
                        <button
                          key={agent.id}
                          onClick={() => { setSelectedId(agent.id); setOpen(false); setSearch(''); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/60 transition-colors text-left border-b border-slate-700/40 last:border-0 ${
                            selectedId === agent.id ? 'bg-indigo-600/20' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: agent.color }}>
                            {agent.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{agent.name}</div>
                            <div className="text-xs text-slate-500">{agent.role}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${rate}%`, backgroundColor: rateColor(rate) }} />
                            </div>
                            <span className="text-xs font-semibold w-8 text-right" style={{ color: rateColor(rate) }}>{rate}%</span>
                          </div>
                          {selectedId === agent.id && <CheckCircle2 size={14} className="text-indigo-400 flex-shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Agent detail panel */}
          {selected && selectedStats && (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden">
              {/* Header bar */}
              <div className="px-6 py-5 flex items-center gap-5 border-b border-slate-700/50"
                style={{ background: `linear-gradient(135deg, ${selected.color}18 0%, transparent 60%)` }}>
                <div className="relative flex-shrink-0">
                  <DonutRing percent={selectedStats.completionRate} color={selected.color} size={72} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{selectedStats.completionRate}%</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-white truncate">{selected.name}</div>
                  <div className="text-sm text-slate-400 mt-0.5">{selected.role}</div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rateColor(selectedStats.completionRate) }} />
                    <span className="text-xs text-slate-400">
                      {selectedStats.completionRate >= 70 ? 'On track' : selectedStats.completionRate >= 40 ? 'Needs attention' : 'Behind'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 divide-x divide-slate-700/50">
                {[
                  { label: 'Done',    value: selectedStats.completed,  color: 'text-emerald-400', icon: <CheckCircle2 size={14} /> },
                  { label: 'Active',  value: selectedStats.inProgress, color: 'text-blue-400',    icon: <Clock size={14} /> },
                  { label: 'On Hold', value: selectedStats.onHold,     color: 'text-amber-400',   icon: <PauseCircle size={14} /> },
                  { label: 'Pending', value: selectedStats.notStarted, color: 'text-slate-400',   icon: <Circle size={14} /> },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} className="px-4 py-4 text-center">
                    <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
                    <div className={`text-xl font-bold ${color}`}>{value}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="px-6 py-4 border-t border-slate-700/50">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Overall progress</span>
                  <span className="font-semibold" style={{ color: rateColor(selectedStats.completionRate) }}>
                    {selectedStats.completed} / {selectedStats.totalTasks} tasks
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${selectedStats.completionRate}%`, backgroundColor: rateColor(selectedStats.completionRate) }} />
                </div>
              </div>

              {/* Action */}
              <div className="px-6 py-4 border-t border-slate-700/50">
                <button
                  onClick={() => router.push(`/agent/${selected.id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: selected.color }}
                >
                  View Weekly Tasks
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!selected && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                <ChevronRight size={24} className="text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">Choose an agent from the dropdown above</p>
              <p className="text-slate-600 text-xs mt-1">Their task overview will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
