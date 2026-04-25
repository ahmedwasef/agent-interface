'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Task } from '@/lib/types';
import { getDaySummaries } from '@/lib/utils';

interface Props {
  tasks: Task[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: p.stroke }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-medium text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function WeeklyTrendChart({ tasks }: Props) {
  const summaries = getDaySummaries(tasks);
  const data = summaries.map((s) => ({
    day: s.dayName.slice(0, 3),
    Completed: s.completed,
    'In Progress': s.inProgress,
    'On Hold': s.onHold,
    Total: s.total,
  }));

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-1">Weekly Progress Trend</h3>
      <p className="text-xs text-slate-500 mb-4">Task status evolution across the week</p>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradInProgress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 11 }} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
          <Area type="monotone" dataKey="Total"       stroke="#6366F1" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" />
          <Area type="monotone" dataKey="Completed"   stroke="#10B981" fill="url(#gradCompleted)" strokeWidth={2} />
          <Area type="monotone" dataKey="In Progress" stroke="#3B82F6" fill="url(#gradInProgress)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
