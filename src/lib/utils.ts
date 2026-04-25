import { Task, TaskStatus, WeeklyStats, DaySummary, Agent } from './types';
import { AGENTS as DEFAULT_AGENTS } from './agents';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  on_hold:     'On Hold',
  completed:   'Completed',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: '#6B7280',
  in_progress: '#3B82F6',
  on_hold:     '#F59E0B',
  completed:   '#10B981',
};

export const STATUS_BG: Record<TaskStatus, string> = {
  not_started: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  on_hold:     'bg-amber-500/20 text-amber-300 border-amber-500/30',
  completed:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low:    'bg-slate-500/20 text-slate-300 border-slate-500/30',
  medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  high:   'bg-red-500/20 text-red-300 border-red-500/30',
};

// agents param is optional — defaults to hardcoded list for backward compat
export function getWeeklyStats(tasks: Task[], agents: Agent[] = DEFAULT_AGENTS): WeeklyStats[] {
  return agents.map((agent) => {
    const agentTasks = tasks.filter((t) => t.agentId === agent.id);
    const completed  = agentTasks.filter((t) => t.status === 'completed').length;
    const inProgress = agentTasks.filter((t) => t.status === 'in_progress').length;
    const onHold     = agentTasks.filter((t) => t.status === 'on_hold').length;
    const notStarted = agentTasks.filter((t) => t.status === 'not_started').length;
    const total      = agentTasks.length;
    return {
      agentId:        agent.id,
      agentName:      agent.name,
      totalTasks:     total,
      completed,
      inProgress,
      onHold,
      notStarted,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
}

export function getDaySummaries(tasks: Task[]): DaySummary[] {
  const byDate = new Map<string, Task[]>();
  tasks.forEach((t) => {
    const list = byDate.get(t.date) || [];
    list.push(t);
    byDate.set(t.date, list);
  });
  return Array.from(byDate.entries())
    .map(([date, dayTasks]) => ({
      date,
      dayName:    dayTasks[0]?.dayName || '',
      tasks:      dayTasks,
      total:      dayTasks.length,
      completed:  dayTasks.filter((t) => t.status === 'completed').length,
      inProgress: dayTasks.filter((t) => t.status === 'in_progress').length,
      onHold:     dayTasks.filter((t) => t.status === 'on_hold').length,
      notStarted: dayTasks.filter((t) => t.status === 'not_started').length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// CSV export uses exact same column headers as the SWAT PowerBI import template
export function exportToCSV(tasks: Task[], agents: Agent[] = DEFAULT_AGENTS): void {
  const headers = [
    'SWAT', 'PROJET', 'AVION', 'Position', 'Cahier', 'RV', 'CODIF', '%PROD',
    'RESPONSABLE', 'DATE PS', 'DATE RV', 'DT1', 'GROUPE', 'RFC', 'STATUT RV',
    'PERIODE', 'Commentaire', 'DT2', 'Superviseur', 'SWAT DESCR.', 'Priorité',
    'Programme', 'Manager', 'Meuble', 'DATE METHODES', 'DATE ALGO',
    'Harmo Manuel', 'SumTime_Estimate_Hours',
  ];

  const agentMap = new Map(agents.map((a) => [a.id, a.name]));

  // Map internal status back to SWAT STATUT RV vocabulary
  const toStatutRv = (status: TaskStatus): string => {
    if (status === 'completed')   return 'CLOSED';
    if (status === 'in_progress') return 'PREPARE';
    if (status === 'on_hold')     return 'ATT';
    return 'TBD';
  };

  const rows = tasks.map((task) => [
    task.swatId      || '',
    task.projet      || '',
    task.avion       || '',
    task.position    || '',
    task.cahier      || '',
    task.rv          || '',
    task.codif       || task.category || '',
    task.pctProd !== undefined ? String(task.pctProd) : '0',
    agentMap.get(task.agentId) || '',
    '',                                             // DATE PS — not stored
    task.date,
    task.dt1 !== undefined ? String(task.dt1) : '',
    task.groupe      || '',
    task.rfc         || '',
    task.statutRv    || toStatutRv(task.status),
    task.periode     || '',
    task.description || '',
    task.dt2 !== undefined ? String(task.dt2) : '',
    task.superviseur || '',
    task.notes       || '',
    task.prioriteNum !== undefined ? String(task.prioriteNum) : '',
    task.programme   || '',
    task.manager     || '',
    '',                                             // Meuble — not stored
    '',                                             // DATE METHODES — not stored
    '',                                             // DATE ALGO — not stored
    task.harmoManuel ? 'VRAI' : 'FAUX',
    String(task.estimatedHours),
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `SWAT-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
