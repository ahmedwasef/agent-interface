import { Task, TaskStatus, Priority, StatusChange } from './types';
import { AGENTS } from './agents';

// Dummy data — real values removed for privacy
const CODIF_VALUES = [
  'WAIT-ENG', 'WAIT-MTH', 'WAIT-QC', 'READY', 'READY-ENG', 'READY-QC', 'READY-MTH', 'WAIT-PARTS',
];
const GROUPES = [
  'GRP-ELEC-A', 'GRP-ELEC-B', 'GRP-ELEC-C', 'GRP-CFG-A', 'GRP-CFG-B',
  'GRP-SUP-A', 'GRP-NPI-A', 'GRP-ELEC-D',
];
const PROJETS = ['PROJ-001', 'PROJ-002', 'PROJ-003', 'PROJ-004', 'PROJ-005'];
const AVIONS  = ['AC-001', 'AC-002', 'AC-003', 'AC-004', 'AC-005'];
const PROGRAMMES = ['Program Alpha', 'Program Beta', 'Program Gamma', 'Program Delta', 'Program Echo', 'Program Zeta'];
const PERIODES = ['PHASE-1', 'TBD', 'PHASE-2', 'PHASE-3'];
const SUPERVISORS = ['Damien Marie', 'Marc Tremblay', 'Sophie Leclerc'];
const MANAGERS = ['Sophie Leclerc'];

const POSITIONS = [
  'POS-A', 'POS-B1', 'POS-B2', 'POS-C1', 'POS-D', '', '', '', '',
];

const SWAT_DESCRIPTIONS = [
  {
    title: 'Issue type A',
    description: 'Work instructions: Bla bla bla bla bla bla.\nTechnical issue: Bla bla bla bla bla bla bla bla bla.\nEngineering issue: Bla bla bla bla bla.\nProcess improvement: N/A',
  },
  {
    title: 'Issue type B',
    description: 'Work instructions: Bla bla bla bla bla bla.\nTechnical issue: Bla bla bla bla bla bla bla bla bla.\nEngineering issue: Bla bla bla bla bla.\nProcess improvement: Bla bla bla bla.',
  },
  {
    title: 'Issue type C',
    description: 'Work instructions: Bla bla bla bla bla bla.\nTechnical issue: Bla bla bla bla bla bla bla bla bla.\nEngineering issue: Bla bla bla bla bla.\nProcess improvement: Bla bla bla bla.',
  },
  {
    title: 'Issue type D',
    description: 'Work instructions: Bla bla bla bla bla bla.\nTechnical issue: Bla bla bla bla bla bla bla bla bla.\nEngineering issue: Bla bla bla bla bla.\nProcess improvement: Bla bla bla bla.',
  },
  {
    title: 'Issue type E',
    description: 'Work instructions: N/A\nTechnical issue: Bla bla bla bla bla bla bla bla bla.\nEngineering issue: Bla bla bla bla bla.\nProcess improvement: Bla bla bla bla.',
  },
  {
    title: 'Issue type F',
    description: 'Work instructions: Bla bla bla bla bla bla.\nTechnical issue: Bla bla bla bla bla bla bla bla bla.\nEngineering issue: N/A\nProcess improvement: Bla bla bla bla.',
  },
  {
    title: 'Issue type G',
    description: 'Work instructions: N/A\nTechnical issue: Bla bla bla bla bla bla bla bla bla.\nEngineering issue: Bla bla bla bla bla.\nProcess improvement: N/A',
  },
  {
    title: 'Issue type H',
    description: 'Work instructions: N/A\nTechnical issue: N/A\nEngineering issue: Bla bla bla bla bla bla bla bla bla.\nProcess improvement: N/A',
  },
  {
    title: 'Issue type I',
    description: 'Work instructions: Bla bla bla bla bla bla.\nTechnical issue: Bla bla bla bla bla bla bla bla bla.\nEngineering issue: Bla bla bla bla bla.\nProcess improvement: N/A',
  },
  {
    title: 'Issue type J',
    description: 'Work instructions: Bla bla bla bla bla bla.\nTechnical issue: Bla bla bla bla bla bla bla bla bla.\nEngineering issue: N/A\nProcess improvement: Bla bla bla bla.',
  },
  {
    title: 'Issue type K',
    description: 'Work instructions: Bla bla bla bla bla bla.\nTechnical issue: N/A\nEngineering issue: N/A\nProcess improvement: N/A',
  },
  {
    title: 'Issue type L',
    description: 'Work instructions: Bla bla bla bla bla bla.\nTechnical issue: N/A\nEngineering issue: N/A\nProcess improvement: N/A',
  },
];

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function swatCounter() {
  let n = 100000 + randBetween(100, 999);
  return () => {
    n += randBetween(1, 50);
    return `SW-${String(Math.floor(n / 1000)).padStart(3, '0')}-${String(n % 1000).padStart(3, '0')}`;
  };
}

function codifToStatus(codif: string, statutRv: string): TaskStatus {
  const stat = statutRv.toUpperCase();
  if (stat === 'CLOSED') return 'completed';
  if (stat === 'PREPARE') return 'in_progress';
  if (codif.startsWith('ATT')) return 'on_hold';
  if (codif.startsWith('GO')) return 'in_progress';
  return 'not_started';
}

function prioriteNumToPriority(n: number): Priority {
  if (n <= 2) return 'low';
  if (n === 3) return 'medium';
  return 'high';
}

function generateStatusHistory(status: TaskStatus, date: string, agentName: string): StatusChange[] {
  const history: StatusChange[] = [];
  const baseTime = new Date(`${date}T08:00:00`);

  history.push({
    id: generateId(),
    status: 'not_started',
    timestamp: new Date(baseTime.getTime() - 86400000 * randBetween(1, 3)).toISOString(),
    changedBy: 'System Import',
    note: 'Task distributed via SWAT extract import',
  });

  if (status === 'in_progress' || status === 'on_hold' || status === 'completed') {
    history.push({
      id: generateId(),
      status: 'in_progress',
      timestamp: new Date(baseTime.getTime() + randBetween(0, 120) * 60000).toISOString(),
      changedBy: agentName,
    });
  }
  if (status === 'on_hold') {
    history.push({
      id: generateId(),
      status: 'on_hold',
      timestamp: new Date(baseTime.getTime() + randBetween(120, 300) * 60000).toISOString(),
      changedBy: agentName,
      note: 'Waiting for engineering/methods feedback',
    });
  }
  if (status === 'completed') {
    history.push({
      id: generateId(),
      status: 'completed',
      timestamp: new Date(baseTime.getTime() + randBetween(60, 360) * 60000).toISOString(),
      changedBy: agentName,
    });
  }
  return history;
}

function getWeekDates(): { date: string; dayName: string }[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((dayName, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { date: d.toISOString().split('T')[0], dayName };
  });
}

export function generateMockTasks(): Task[] {
  const tasks: Task[] = [];
  const weekDates = getWeekDates();
  const nextSwat = swatCounter();
  const today = new Date().toISOString().split('T')[0];

  AGENTS.forEach((agent) => {
    weekDates.forEach(({ date, dayName }) => {
      const taskCount = randBetween(2, 4);
      const shuffled = [...SWAT_DESCRIPTIONS].sort(() => Math.random() - 0.5).slice(0, taskCount);

      shuffled.forEach((tpl) => {
        const swatId = nextSwat();
        const codif = pick(CODIF_VALUES);
        const prioriteNum = pick([2, 3, 4]);
        const projet = pick(PROJETS);
        const avion = pick(AVIONS);

        const isPast = date < today;
        const isToday = date === today;
        let statutRv: string;
        if (isPast) {
          statutRv = pick(['CLOSED', 'CLOSED', 'CLOSED', 'PREPARE', 'TBD', 'PREPARE']);
        } else if (isToday) {
          statutRv = pick(['PREPARE', 'PREPARE', 'CLOSED', 'TBD', 'TBD']);
        } else {
          statutRv = pick(['TBD', 'TBD', 'TBD', 'PREPARE']);
        }

        // Override: ATT codif always = on_hold
        let status = codifToStatus(codif, statutRv);
        const estH = pick([0.25, 0.5, 1, 1, 1, 1.5, 2]);
        const createdAt = new Date(`${date}T07:00:00`).toISOString();
        const statusHistory = generateStatusHistory(status, date, agent.name);

        tasks.push({
          id: generateId(),
          agentId: agent.id,
          swatId,
          title: swatId,
          description: tpl.description,
          date,
          dayName,
          priority: prioriteNumToPriority(prioriteNum),
          prioriteNum,
          status,
          category: codif,
          codif,
          estimatedHours: estH,
          projet,
          avion,
          position: pick(POSITIONS),
          cahier: `WP-${swatId.replace('SW-', '')}-${String(randBetween(1, 20)).padStart(2, '0')}`,
          rv: Math.random() > 0.5 ? `RV-${randBetween(100, 999)}-${randBetween(100, 999)} A` : '',
          groupe: pick(GROUPES),
          rfc: Math.random() > 0.4 ? `RFC-${randBetween(110000, 120000)}` : '',
          statutRv,
          periode: pick(PERIODES),
          superviseur: pick(SUPERVISORS),
          programme: pick(PROGRAMMES),
          manager: pick(MANAGERS),
          pctProd: 0,
          dt1: randBetween(-90, 30),
          dt2: randBetween(0, 20),
          harmoManuel: Math.random() > 0.8,
          notes: `SWAT DESCR: ${tpl.title}`,
          createdAt,
          updatedAt: statusHistory[statusHistory.length - 1]?.timestamp || createdAt,
          statusHistory,
        });
      });
    });
  });

  return tasks;
}
