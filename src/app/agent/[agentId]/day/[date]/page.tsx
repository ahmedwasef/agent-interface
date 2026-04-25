'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { AGENTS } from '@/lib/agents';
import { STATUS_LABELS, STATUS_COLORS, formatDate, PRIORITY_COLORS } from '@/lib/utils';
import Header from '@/components/Header';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export default function DayPage() {
  const { agentId, date } = useParams<{ agentId: string; date: string }>();
  const { tasks, initialize } = useStore();
  const router = useRouter();

  useEffect(() => { initialize(); }, [initialize]);

  const agent = AGENTS.find((a) => a.id === agentId);
  const dayTasks = tasks.filter((t) => t.agentId === agentId && t.date === date);
  const dayName = dayTasks[0]?.dayName ?? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={`${dayName} — ${formatDate(date)}`}
        subtitle={`${agent?.name} · ${dayTasks.length} tasks`}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-2"
        >
          <ArrowLeft size={16} />
          Back to weekly view
        </button>

        {dayTasks.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No tasks for this day.</div>
        ) : (
          dayTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => router.push(`/task/${task.id}`)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-5 py-4 text-left hover:border-indigo-500/40 hover:bg-slate-800 transition-all group flex items-center gap-4"
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[task.status] }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors mb-0.5">{task.title}</div>
                <div className="text-xs text-slate-400 truncate">{task.description}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${
                  task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  task.status === 'on_hold' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  {STATUS_LABELS[task.status]}
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
