'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import { WeeklyStats } from '@/lib/types';

interface Props {
  stats: WeeklyStats[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: p.fill }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-medium text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AgentPerformanceChart({ stats }: Props) {
  const data = stats.map((s) => ({
    name: s.agentName.split(' ')[0],
    fullName: s.agentName,
    Completed: s.completed,
    'In Progress': s.inProgress,
    'On Hold': s.onHold,
    'Not Started': s.notStarted,
  }));

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Task Distribution by Agent</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94A3B8', fontSize: 10 }}
            angle={-40}
            textAnchor="end"
          />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#94A3B8', paddingTop: '8px' }}
          />
          <Bar dataKey="Completed"    stackId="a" fill="#10B981" radius={[0,0,0,0]} />
          <Bar dataKey="In Progress"  stackId="a" fill="#3B82F6" radius={[0,0,0,0]} />
          <Bar dataKey="On Hold"      stackId="a" fill="#F59E0B" radius={[0,0,0,0]} />
          <Bar dataKey="Not Started"  stackId="a" fill="#6B7280" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
