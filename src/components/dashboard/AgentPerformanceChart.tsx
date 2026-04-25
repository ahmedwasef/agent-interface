'use client';

import Link from 'next/link';
import { WeeklyStats } from '@/lib/types';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

interface Props {
  stats: WeeklyStats[];
}

function DonutRing({ percent, color, size = 64 }: { percent: number; color: string; size?: number }) {
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
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  );
}

const rateColor = (r: number) => r >= 70 ? '#10B981' : r >= 40 ? '#F59E0B' : '#EF4444';

export default function AgentPerformanceChart({ stats }: Props) {
  const t = useT();
  const { agents } = useStore();

  const sorted = [...stats].sort((a, b) => b.completionRate - a.completionRate);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">{t('chart.agentDist')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('chart.agentSub')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {sorted.map((s) => {
          const agent = agents.find((a) => a.id === s.agentId);
          const color = agent?.color ?? '#6366f1';
          const rc = rateColor(s.completionRate);

          return (
            <Link
              key={s.agentId}
              href={`/agent/${s.agentId}`}
              className="group relative flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/40 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
            >
              {/* Donut ring + avatar */}
              <div className="relative">
                <DonutRing percent={s.completionRate} color={rc} size={64} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-lg"
                    style={{ backgroundColor: color }}
                  >
                    {agent?.initials ?? '??'}
                  </div>
                </div>
              </div>

              {/* Rate label */}
              <span className="text-sm font-bold" style={{ color: rc }}>{s.completionRate}%</span>

              {/* Name */}
              <div className="text-center">
                <div className="text-xs font-semibold text-white leading-tight truncate w-full max-w-[100px]">
                  {s.agentName.split(' ')[0]}
                </div>
                <div className="text-[10px] text-slate-500 truncate w-full max-w-[100px]">
                  {s.agentName.split(' ').slice(1).join(' ')}
                </div>
              </div>

              {/* Mini status bar */}
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-700 flex">
                {s.completed > 0 && (
                  <div className="h-full bg-emerald-500" style={{ width: `${(s.completed / s.totalTasks) * 100}%` }} />
                )}
                {s.inProgress > 0 && (
                  <div className="h-full bg-blue-500" style={{ width: `${(s.inProgress / s.totalTasks) * 100}%` }} />
                )}
                {s.onHold > 0 && (
                  <div className="h-full bg-amber-500" style={{ width: `${(s.onHold / s.totalTasks) * 100}%` }} />
                )}
              </div>

              {/* Task counts tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs w-36">
                  <div className="font-semibold text-white mb-2 truncate">{s.agentName}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span className="text-emerald-400">{t('agents.done')}</span><span className="text-white font-medium">{s.completed}</span></div>
                    <div className="flex justify-between"><span className="text-blue-400">{t('agents.active')}</span><span className="text-white font-medium">{s.inProgress}</span></div>
                    <div className="flex justify-between"><span className="text-amber-400">{t('agents.hold')}</span><span className="text-white font-medium">{s.onHold}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">{t('agents.pending')}</span><span className="text-white font-medium">{s.notStarted}</span></div>
                    <div className="flex justify-between border-t border-slate-700 pt-1 mt-1"><span className="text-slate-300">{t('kpi.total')}</span><span className="text-white font-bold">{s.totalTasks}</span></div>
                  </div>
                </div>
                <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 mx-auto -mt-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-700/50 flex-wrap">
        {([
          ['#10B981', 'chart.completed'],
          ['#3B82F6', 'chart.inProgress'],
          ['#F59E0B', 'chart.onHold'],
          ['#6B7280', 'chart.notStarted'],
        ] as [string, Parameters<typeof t>[0]][]).map(([color, key]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-400">{t(key)}</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-slate-500 hidden sm:inline">{t('chart.hoverTip')}</span>
      </div>
    </div>
  );
}
