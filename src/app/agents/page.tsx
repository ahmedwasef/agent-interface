'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { getWeeklyStats } from '@/lib/utils';
import Header from '@/components/Header';
import { Search, CheckCircle2, Clock, PauseCircle, Circle, ArrowRight, Users } from 'lucide-react';

// ── Donut ring ─────────────────────────────────────────────────────────────────
function DonutRing({ percent, color, size = 80, strokeWidth = 8 }: {
  percent: number; color: string; size?: number; strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

const rateColor = (r: number) => r >= 70 ? '#10B981' : r >= 40 ? '#F59E0B' : '#EF4444';
const rateLabel = (r: number) => r >= 70 ? 'On track' : r >= 40 ? 'Attention' : 'Behind';

// ── Agent card ─────────────────────────────────────────────────────────────────
function AgentCard({
  agent, stat, selected, onClick,
}: {
  agent: { id: string; name: string; initials: string; color: string; role: string };
  stat: { completionRate: number; completed: number; inProgress: number; onHold: number; notStarted: number; totalTasks: number };
  selected: boolean;
  onClick: () => void;
}) {
  const rc = rateColor(stat.completionRate);
  const firstName = agent.name.split(' ')[0];
  const lastName = agent.name.split(' ').slice(1).join(' ');

  return (
    <button
      onClick={onClick}
      className={`relative group flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-200 text-center w-full ${
        selected
          ? 'border-2 shadow-lg scale-[1.03]'
          : 'border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 hover:scale-[1.02] hover:shadow-md hover:shadow-black/30'
      }`}
      style={selected ? {
        borderColor: agent.color,
        background: `linear-gradient(145deg, ${agent.color}22 0%, rgba(15,23,42,0.9) 60%)`,
        boxShadow: `0 0 24px ${agent.color}40`,
      } : undefined}
    >
      {/* Donut ring with avatar inside */}
      <div className="relative">
        <DonutRing percent={stat.completionRate} color={rc} size={80} strokeWidth={7} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
            style={{ backgroundColor: agent.color }}
          >
            {agent.initials}
          </div>
        </div>
      </div>

      {/* Completion % */}
      <span className="text-base font-bold" style={{ color: rc }}>{stat.completionRate}%</span>

      {/* Name */}
      <div>
        <div className="text-sm font-semibold text-white truncate max-w-[130px]">{firstName}</div>
        {lastName && <div className="text-xs text-slate-400 truncate max-w-[130px]">{lastName}</div>}
      </div>

      {/* Mini status strip */}
      <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-700/60">
        {stat.completed > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(stat.completed / stat.totalTasks) * 100}%` }} />}
        {stat.inProgress > 0 && <div className="h-full bg-blue-500" style={{ width: `${(stat.inProgress / stat.totalTasks) * 100}%` }} />}
        {stat.onHold > 0 && <div className="h-full bg-amber-500" style={{ width: `${(stat.onHold / stat.totalTasks) * 100}%` }} />}
        {stat.notStarted > 0 && <div className="h-full bg-slate-600" style={{ width: `${(stat.notStarted / stat.totalTasks) * 100}%` }} />}
      </div>

      {/* Task count */}
      <div className="text-[10px] text-slate-500">{stat.totalTasks} tasks</div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: agent.color }}>
          <CheckCircle2 size={11} className="text-white" />
        </div>
      )}
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const { tasks, agents, initialize, resetOnboarding } = useStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => { initialize(); }, [initialize]);

  const stats = getWeeklyStats(tasks, agents);
  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = agents.find((a) => a.id === selectedId) ?? null;
  const selectedStats = stats.find((s) => s.agentId === selectedId);

  const defaultStat = { completionRate: 0, completed: 0, inProgress: 0, onHold: 0, notStarted: 0, totalTasks: 0 };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Team Agents" subtitle="Damien/Constance equipe — Methods Alpha" onHelp={resetOnboarding} />
      <div className="flex-1 overflow-y-auto">

        {/* ── Hero bar ── */}
        <div className="relative px-6 pt-8 pb-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(15,23,42,0) 60%)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />

          <div className="relative max-w-3xl mx-auto text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Users size={16} className="text-white" />
              </div>
              <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">Team Roster</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Select an Agent</h2>
            <p className="text-sm text-slate-400">Choose any team member to explore their task performance</p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-lg"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-xs">
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="px-6 pb-10 space-y-6">

          {/* ── Agent card grid ── */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                <Search size={20} className="text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">No agents match "{search}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map((agent) => {
                const s = stats.find((x) => x.agentId === agent.id) ?? defaultStat;
                return (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    stat={s}
                    selected={selectedId === agent.id}
                    onClick={() => setSelectedId((prev) => prev === agent.id ? null : agent.id)}
                  />
                );
              })}
            </div>
          )}

          {/* ── Detail panel ── */}
          {selected && selectedStats && (
            <div
              className="rounded-3xl overflow-hidden border"
              style={{
                borderColor: `${selected.color}50`,
                background: `linear-gradient(135deg, ${selected.color}18 0%, rgba(15,23,42,0.95) 50%)`,
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-0">

                {/* Left — big ring */}
                <div className="flex flex-col items-center justify-center px-10 py-8 gap-4 lg:border-r border-slate-700/30">
                  <div className="relative">
                    <DonutRing percent={selectedStats.completionRate} color={rateColor(selectedStats.completionRate)} size={140} strokeWidth={12} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div
                        className="w-[70px] h-[70px] rounded-full flex items-center justify-center text-white text-lg font-bold shadow-xl"
                        style={{ backgroundColor: selected.color }}
                      >
                        {selected.initials}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: rateColor(selectedStats.completionRate) }}>
                      {selectedStats.completionRate}%
                    </div>
                    <div className="flex items-center gap-1.5 justify-center mt-1">
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: rateColor(selectedStats.completionRate) }} />
                      <span className="text-xs text-slate-400">{rateLabel(selectedStats.completionRate)}</span>
                    </div>
                  </div>
                </div>

                {/* Centre — info + stats */}
                <div className="px-8 py-8 space-y-6">
                  {/* Name + role */}
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selected.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{selected.role}</p>
                  </div>

                  {/* Four stat boxes */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Done',    value: selectedStats.completed,  color: '#10B981', icon: <CheckCircle2 size={16} /> },
                      { label: 'Active',  value: selectedStats.inProgress, color: '#3B82F6', icon: <Clock size={16} /> },
                      { label: 'On Hold', value: selectedStats.onHold,     color: '#F59E0B', icon: <PauseCircle size={16} /> },
                      { label: 'Pending', value: selectedStats.notStarted, color: '#6B7280', icon: <Circle size={16} /> },
                    ].map(({ label, value, color, icon }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/40 border border-slate-700/30">
                        <span style={{ color }}>{icon}</span>
                        <span className="text-2xl font-bold text-white">{value}</span>
                        <span className="text-[11px] text-slate-500">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Segmented progress bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400">Overall progress</span>
                      <span className="font-semibold" style={{ color: rateColor(selectedStats.completionRate) }}>
                        {selectedStats.completed} / {selectedStats.totalTasks} tasks
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden flex">
                      {selectedStats.completed > 0 && (
                        <div className="h-full bg-emerald-500 transition-all duration-700"
                          style={{ width: `${(selectedStats.completed / selectedStats.totalTasks) * 100}%` }} />
                      )}
                      {selectedStats.inProgress > 0 && (
                        <div className="h-full bg-blue-500 transition-all duration-700"
                          style={{ width: `${(selectedStats.inProgress / selectedStats.totalTasks) * 100}%` }} />
                      )}
                      {selectedStats.onHold > 0 && (
                        <div className="h-full bg-amber-500 transition-all duration-700"
                          style={{ width: `${(selectedStats.onHold / selectedStats.totalTasks) * 100}%` }} />
                      )}
                      {selectedStats.notStarted > 0 && (
                        <div className="h-full bg-slate-600 transition-all duration-700"
                          style={{ width: `${(selectedStats.notStarted / selectedStats.totalTasks) * 100}%` }} />
                      )}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {[
                        { color: '#10B981', label: 'Done' },
                        { color: '#3B82F6', label: 'Active' },
                        { color: '#F59E0B', label: 'Hold' },
                        { color: '#6B7280', label: 'Pending' },
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-[10px] text-slate-500">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right — CTA */}
                <div className="flex items-center justify-center px-8 py-8 lg:border-l border-slate-700/30">
                  <button
                    onClick={() => router.push(`/agent/${selected.id}`)}
                    className="flex flex-col items-center gap-3 px-8 py-5 rounded-2xl text-white font-semibold transition-all hover:scale-105 hover:shadow-xl group"
                    style={{ backgroundColor: selected.color, boxShadow: `0 4px 20px ${selected.color}40` }}
                  >
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    <div className="text-center">
                      <div className="text-sm font-bold">View Tasks</div>
                      <div className="text-xs opacity-80 mt-0.5">Weekly overview</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state — no selection */}
          {!selected && filtered.length > 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-slate-500 text-sm">Click any agent card above to see their performance details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
