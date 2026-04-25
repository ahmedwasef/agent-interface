'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { getWeeklyStats, STATUS_BG, PRIORITY_COLORS } from '@/lib/utils';
import { TaskStatus } from '@/lib/types';
import Header from '@/components/Header';
import StatsCards from '@/components/dashboard/StatsCards';
import AgentPerformanceChart from '@/components/dashboard/AgentPerformanceChart';
import StatusDistributionChart from '@/components/dashboard/StatusDistributionChart';
import WeeklyTrendChart from '@/components/dashboard/WeeklyTrendChart';
import TeamTable from '@/components/dashboard/TeamTable';
import OnboardingTour from '@/components/OnboardingTour';
import { ExternalLink, ChevronDown, ChevronUp, LayoutGrid, ListFilter } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/lib/langStore';

type TabId = 'overview' | 'all' | TaskStatus;

const STATUS_TAB_DOT: Record<string, string> = {
  completed:   'bg-emerald-400',
  in_progress: 'bg-blue-400',
  on_hold:     'bg-amber-400',
  not_started: 'bg-gray-400',
};

export default function DashboardPage() {
  const t = useT();
  const { lang } = useLangStore();
  const { tasks, agents, initialize, resetOnboarding } = useStore();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [teamExpanded, setTeamExpanded] = useState(false);

  useEffect(() => { initialize(); }, [initialize]);

  const stats = getWeeklyStats(tasks, agents);
  const today = new Date().toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const filteredTasks =
    activeTab === 'overview' || activeTab === 'all'
      ? tasks
      : tasks.filter((task) => task.status === activeTab);

  const agentMap = new Map(agents.map((a) => [a.id, a]));

  const handleCardFilter = (key: string) => {
    if (key === 'rate') { setActiveTab('overview'); return; }
    setActiveTab(key as TabId);
  };

  const tabs: { id: TabId; label: string; count: number | null }[] = [
    { id: 'overview',    label: t('dash.tabOverview'), count: null },
    { id: 'all',         label: t('dash.tabAll'),      count: tasks.length },
    { id: 'completed',   label: t('kpi.completed'),    count: tasks.filter(t => t.status === 'completed').length },
    { id: 'in_progress', label: t('kpi.inProgress'),   count: tasks.filter(t => t.status === 'in_progress').length },
    { id: 'on_hold',     label: t('kpi.onHold'),       count: tasks.filter(t => t.status === 'on_hold').length },
    { id: 'not_started', label: t('kpi.notStarted'),   count: tasks.filter(t => t.status === 'not_started').length },
  ];

  return (
    <>
      <OnboardingTour />
      <div className="flex flex-col h-full overflow-hidden">
        <Header
          title={t('dash.title')}
          subtitle={`Damien/Constance equipe — ${today}`}
          onHelp={resetOnboarding}
        />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">

          <StatsCards
            tasks={tasks}
            activeFilter={activeTab === 'overview' ? null : activeTab}
            onFilter={handleCardFilter}
          />

          {/* Tab bar — horizontal scroll on mobile */}
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 bg-slate-800/40 border border-slate-700/50 rounded-xl p-1.5 w-fit min-w-full sm:min-w-0">
              {tabs.map(({ id, label, count }) => {
                const isActive = activeTab === id;
                return (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    {id === 'overview'
                      ? <LayoutGrid size={11} />
                      : id === 'all'
                      ? <ListFilter size={11} />
                      : <span className={`w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 ${STATUS_TAB_DOT[id] ?? 'bg-slate-400'}`} />}
                    {label}
                    {count !== null && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                      }`}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              <AgentPerformanceChart stats={stats} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                <StatusDistributionChart tasks={tasks} />
                <WeeklyTrendChart tasks={tasks} />
              </div>

              {/* Team ranking — collapsed accordion */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setTeamExpanded((v) => !v)}
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-slate-700/20 transition-colors group"
                >
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {t('dash.teamRanking')}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {teamExpanded ? t('dash.rankingDesc2') : t('dash.rankingDesc')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 group-hover:text-indigo-300 transition-colors">
                    <span className="hidden sm:inline">{teamExpanded ? t('dash.collapse') : t('dash.showRanking')}</span>
                    {teamExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {teamExpanded && (
                  <div className="border-t border-slate-700/50 overflow-x-auto">
                    <TeamTable stats={stats} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── TASK LIST ── */}
          {activeTab !== 'overview' && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-700/50">
                <h3 className="text-sm font-semibold text-white">
                  {activeTab === 'all' ? t('dash.tabAll') : t(`status.${activeTab}` as Parameters<typeof t>[0])}
                  <span className="ml-2 text-xs font-normal text-slate-400">({filteredTasks.length})</span>
                </h3>
                <button onClick={() => setActiveTab('overview')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition-colors">
                  <LayoutGrid size={12} /> {t('dash.generalView')}
                </button>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="px-5 py-12 text-center text-slate-500 text-sm">{t('dash.noTasks')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left px-4 sm:px-5 py-3 text-slate-400 font-medium">SWAT ID</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('team.agent')}</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">Date</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">CODIF</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">{t('kpi.completed').slice(0,6)}…</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">Prio.</th>
                        <th className="px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => {
                        const agent = agentMap.get(task.agentId);
                        return (
                          <tr key={task.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                            <td className="px-4 sm:px-5 py-3 font-mono text-indigo-300 font-medium">{task.swatId || task.title}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {agent && (
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                                    style={{ backgroundColor: agent.color }}>
                                    {agent.initials}
                                  </div>
                                )}
                                <span className="text-slate-300 truncate max-w-[100px]">{agent?.name ?? task.agentId}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{task.date}</td>
                            <td className="px-4 py-3 text-amber-300 font-medium hidden md:table-cell">{task.codif || task.category}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${STATUS_BG[task.status]}`}>
                                {t(`status.${task.status}` as Parameters<typeof t>[0])}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize ${PRIORITY_COLORS[task.priority]}`}>
                                {t(`priority.${task.priority}` as Parameters<typeof t>[0])}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <Link href={`/task/${task.id}`}
                                className="flex items-center justify-center w-6 h-6 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors">
                                <ExternalLink size={12} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
