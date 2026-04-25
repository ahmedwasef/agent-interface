'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Task } from '@/lib/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';

interface Props {
  tasks: Task[];
}

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: payload[0].payload.fill }} />
        <span className="text-white font-semibold">{payload[0].name}</span>
        <span className="text-slate-400">— {payload[0].value} tasks</span>
      </div>
    </div>
  );
};

export default function StatusDistributionChart({ tasks }: Props) {
  const statuses = ['completed', 'in_progress', 'on_hold', 'not_started'] as const;
  const data = statuses
    .map((s) => ({
      name: STATUS_LABELS[s],
      value: tasks.filter((t) => t.status === s).length,
      fill: STATUS_COLORS[s],
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Status Distribution</h3>
      <ResponsiveContainer width="100%" height={360}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            outerRadius={130}
            innerRadius={65}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
            formatter={(value) => <span style={{ color: '#94A3B8' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
