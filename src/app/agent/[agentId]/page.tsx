'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { AGENTS } from '@/lib/agents';
import { getDaySummaries, STATUS_COLORS, STATUS_LABELS, formatDate } from '@/lib/utils';
import Header from '@/components/Header';
import { ArrowLeft, ChevronRight, CheckCircle2, Clock, PauseCircle, Circle } from 'lucide-react';
import { DaySummary } from '@/lib/types';

function StatusBadge({ count, type }: { count: number; type: string }) {
  const colors: Record<string, string> = {
    completed: 'text-emerald-400',
    in_progress: 'text-blue-400',
    on_hold: 'text-amber-400',
    not_started: 'text-gray-400',
  };
  const icons: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 size={12} />,
    in_progress: <Clock size={12} />,
    on_hold: <PauseCircle size={12} />,
    not_started: <Circle size={12} />,
  };
  if (!count) return null;
  return (
    <span className={`flex items-center gap-1 text-xs ${colors[type]}`}>
      {icons[type]}
      {count}
    </span>
  );
}

export default function AgentPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { tasks, initialize, resetOnboarding } = useStore();
  const router = useRouter();

  useEffect(() => { initialize(); }, [initialize]);

  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent) return <div className="p-6 text-slate-400">Agent not found.</div>;

  const agentTasks = tasks.filter((t) => t.agentId === agentId);
  const summaries = getDaySummaries(agentTasks);

  const total = agentTasks.length;
  const completed = agentTasks.filter((t) => t.status === 'completed').length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={agent.name}
        subtitle={`Weekly task overview — ${total} tasks this week`}
        onHelp={resetOnboarding}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Back + summary */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: agent.color }}
            >
              {agent.initials}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{agent.name}</div>
              <div className="text-xs text-slate-400">{rate}% complete this week</div>
            </div>
            <div className="h-2 w-32 bg-slate-700 rounded-full overflow-hidden ml-4">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${rate}%`,
                  backgroundColor: rate >= 70 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444',
                }}
              />
            </div>
          </div>
        </div>

        {/* Day rows */}
        {summaries.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No tasks assigned this week.</div>
        ) : (
          <div className="space-y-2">
            {summaries.map((day) => (
              <DayRow key={day.date} day={day} agentId={agentId} router={router} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DayRow({ day, agentId, router }: { day: DaySummary; agentId: string; router: ReturnType<typeof useRouter> }) {
  const allDone = day.completed === day.total && day.total > 0;
  const hasHold = day.onHold > 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Day header — clickable */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
        onClick={() => router.push(`/agent/${agentId}/day/${day.date}`)}
      >
        <div className="w-28">
          <div className="text-sm font-bold text-white">{day.dayName}</div>
          <div className="text-xs text-slate-400">{formatDate(day.date)}</div>
        </div>

        <div className="flex-1 flex items-center gap-6">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{day.total}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Tasks</div>
          </div>

          {/* Progress */}
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Progress</span>
              <span className={allDone ? 'text-emerald-400' : 'text-slate-300'}>
                {day.completed}/{day.total}
              </span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${day.total > 0 ? (day.completed / day.total) * 100 : 0}%`,
                  backgroundColor: allDone ? '#10B981' : '#3B82F6',
                }}
              />
            </div>
          </div>

          {/* Status breakdown */}
          <div className="flex items-center gap-4">
            <StatusBadge count={day.completed} type="completed" />
            <StatusBadge count={day.inProgress} type="in_progress" />
            <StatusBadge count={day.onHold} type="on_hold" />
            <StatusBadge count={day.notStarted} type="not_started" />
          </div>
        </div>

        {/* Overall status chip */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
          allDone
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : hasHold
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            : day.inProgress > 0
            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
            : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        }`}>
          {allDone ? 'Complete' : hasHold ? 'On Hold' : day.inProgress > 0 ? 'In Progress' : 'Not Started'}
        </div>

        <ChevronRight size={16} className="text-slate-500" />
      </div>

      {/* Quick task list preview */}
      <div className="border-t border-slate-700/30 divide-y divide-slate-700/20">
        {day.tasks.slice(0, 3).map((task) => (
          <button
            key={task.id}
            onClick={() => router.push(`/task/${task.id}`)}
            className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-slate-700/20 transition-colors text-left group"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: STATUS_COLORS[task.status] }}
            />
            <span className="text-sm text-slate-300 flex-1 group-hover:text-white transition-colors">
              {task.title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
              task.status === 'on_hold' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-gray-500/10 text-gray-400 border-gray-500/20'
            }`}>
              {STATUS_LABELS[task.status]}
            </span>
            <ChevronRight size={12} className="text-slate-600 group-hover:text-slate-400" />
          </button>
        ))}
        {day.tasks.length > 3 && (
          <button
            onClick={() => router.push(`/agent/${agentId}/day/${day.date}`)}
            className="w-full px-5 py-2 text-xs text-indigo-400 hover:text-indigo-300 text-left transition-colors"
          >
            +{day.tasks.length - 3} more tasks — view all
          </button>
        )}
      </div>
    </div>
  );
}
