'use client';

import Link from 'next/link';
import { WeeklyStats } from '@/lib/types';
import { AGENTS } from '@/lib/agents';
import { ChevronRight } from 'lucide-react';

interface Props {
  stats: WeeklyStats[];
}

export default function TeamTable({ stats }: Props) {
  const sorted = [...stats].sort((a, b) => b.completionRate - a.completionRate);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-white">Team Performance</h3>
        <p className="text-xs text-slate-500 mt-0.5">Ranked by completion rate</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left px-5 py-3 text-slate-400 font-medium">#</th>
              <th className="text-left px-5 py-3 text-slate-400 font-medium">Agent</th>
              <th className="text-center px-3 py-3 text-slate-400 font-medium">Total</th>
              <th className="text-center px-3 py-3 text-emerald-400 font-medium">Done</th>
              <th className="text-center px-3 py-3 text-blue-400 font-medium">Active</th>
              <th className="text-center px-3 py-3 text-amber-400 font-medium">Hold</th>
              <th className="text-center px-3 py-3 text-gray-400 font-medium">Pending</th>
              <th className="text-left px-5 py-3 text-slate-400 font-medium">Rate</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const agent = AGENTS.find((a) => a.id === s.agentId);
              return (
                <tr
                  key={s.agentId}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                >
                  <td className="px-5 py-3 text-slate-500">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: agent?.color }}
                      >
                        {agent?.initials}
                      </div>
                      <span className="text-white font-medium">{s.agentName}</span>
                    </div>
                  </td>
                  <td className="text-center px-3 py-3 text-slate-300">{s.totalTasks}</td>
                  <td className="text-center px-3 py-3 text-emerald-400 font-semibold">{s.completed}</td>
                  <td className="text-center px-3 py-3 text-blue-400">{s.inProgress}</td>
                  <td className="text-center px-3 py-3 text-amber-400">{s.onHold}</td>
                  <td className="text-center px-3 py-3 text-gray-400">{s.notStarted}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden w-20">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${s.completionRate}%`,
                            backgroundColor: s.completionRate >= 70 ? '#10B981' : s.completionRate >= 40 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </div>
                      <span className="text-white font-semibold w-8 text-right">{s.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/agent/${s.agentId}`}
                      className="flex items-center justify-center w-6 h-6 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
