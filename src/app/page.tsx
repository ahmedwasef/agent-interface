'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { getWeeklyStats, STATUS_LABELS, STATUS_BG, PRIORITY_COLORS } from '@/lib/utils';
import { TaskStatus } from '@/lib/types';
import Header from '@/components/Header';
import StatsCards from '@/components/dashboard/StatsCards';
import AgentPerformanceChart from '@/components/dashboard/AgentPerformanceChart';
import StatusDistributionChart from '@/components/dashboard/StatusDistributionChart';
import WeeklyTrendChart from '@/components/dashboard/WeeklyTrendChart';
import TeamTable from '@/components/dashboard/TeamTable';
import OnboardingTour from '@/components/OnboardingTour';
import { X, ExternalLink } from 'lucide-react';

type FilterKey = TaskStatus | 'all' | 'rate';

export default function DashboardPage() {
  const { tasks, agents, initialize, resetOnboarding } = useStore();
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);

  useEffect(() => { initialize(); }, [initialize]);

  const stats = getWeeklyStats(tasks, agents);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const handleFilter = (key: FilterKey) => {
    setActiveFilter((prev) => (prev === key ? null : key));
  };

  const filteredTasks = (() => {
    if (!activeFilter || activeFilter === 'rate') return tasks;
    if (activeFilter === 'all') return tasks;
    return tasks.filter((t) => t.status === activeFilter);
  })();

  const agentMap = new Map(agents.map((a) => [a.id, a]));

  return (
    <>
      <OnboardingTour />
      <div className="flex flex-col h-full overflow-hidden">
        <Header
          title="Methods Agent Alpha DashBoard"
          subtitle={`Damien/Constance equipe — ${today}`}
          onHelp={resetOnboarding}
        />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* KPI cards — each is clickable */}
          <StatsCards tasks={tasks} activeFilter={activeFilter} onFilter={handleFilter} />

          {/* Filtered task table — shown when a card is active */}
          {activeFilter && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {activeFilter === 'all' || activeFilter === 'rate'
                      ? 'All Tasks'
                      : STATUS_LABELS[activeFilter as TaskStatus]}
                    <span className="ml-2 text-xs font-normal text-slate-400">({filteredTasks.length} tasks)</span>
                  </h3>
                </div>
                <button
                  onClick={() => setActiveFilter(null)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <X size={14} /> Close
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-5 py-3 text-slate-400 font-medium">SWAT ID</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Agent</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">CODIF</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Priority</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => {
                      const agent = agentMap.get(task.agentId);
                      return (
                        <tr key={task.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                          <td className="px-5 py-3 font-mono text-indigo-300 font-medium">{task.swatId || task.title}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {agent && (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                                  style={{ backgroundColor: agent.color }}>
                                  {agent.initials}
                                </div>
                              )}
                              <span className="text-slate-300 truncate max-w-[120px]">{agent?.name ?? task.agentId}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{task.date}</td>
                          <td className="px-4 py-3 text-amber-300 font-medium">{task.codif || task.category}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${STATUS_BG[task.status]}`}>
                              {STATUS_LABELS[task.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize ${PRIORITY_COLORS[task.priority]}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <Link href={`/task/${task.id}`} className="flex items-center justify-center w-6 h-6 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors">
                              <ExternalLink size={12} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Agent performance — full width innovative cards */}
          <AgentPerformanceChart stats={stats} />

          {/* Status distribution (bigger) + weekly trend side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusDistributionChart tasks={tasks} />
            <WeeklyTrendChart tasks={tasks} />
          </div>

          {/* Team table */}
          <TeamTable stats={stats} />
        </div>
      </div>
    </>
  );
}
