import { Task, TaskStatus, Priority, StatusChange } from './types';
import { AGENTS } from './agents';

// Real SWAT system values from PowerBI extract
const CODIF_VALUES = [
  'ATT MET', 'ATT ING', 'ATT GI', 'GO', 'GO MET', 'GO CSD', 'GO ING', 'ATT PROD',
];
const GROUPES = [
  'MET-ELEC13', 'MET-ELEC14', 'MET-ELEC17', 'MET-CFG55', 'MET-CFG62',
  'MET-SUP55', 'MET-NPI52', 'MET-ELEC11',
];
const PROJETS = ['G025-MD', 'K1799', 'K1809', 'BDE-G5500', 'BDE-G6500'];
const AVIONS  = ['G025-MD', '60208', '60218', 'BDE-G5500', 'BDE-G6500'];
const PROGRAMMES = ['Lib G7500', 'Lib G6500', 'Lib G5500', 'G5500', 'G6500', 'G7500'];
const PERIODES = ['PREPROD', 'TBD', 'PIS', 'PRECONV'];
const SUPERVISORS = ['Damien Marie', 'Jerome Caissy', 'Annabelle Almeida'];
const MANAGERS = ['Annabelle Almeida'];

const POSITIONS = [
  '350', 'AMG-SA150', 'AMR-SA150', 'AHG150', '10', '', '', '', '',
];

const SWAT_DESCRIPTIONS = [
  {
    title: 'Circuit breakers not assigned per electrical drawing',
    description: 'Instructions de travail: KT8124-V0041\nEnjeu technique: Circuit breakers not assigned per electrical drawing.\nEnjeu d\'Ingénierie: Electrical drawing\nAmélioration de procédé: N/A',
  },
  {
    title: 'Bundle routing blocking pocket door track',
    description: 'Instructions de travail: Verify routing per BAPS 145-003 and 145-213.\nEnjeu technique: Porte MID LH, pocket door ne s\'ouvre pas en raison de l\'épaisseur des bundles qui frotte sur la track.\nEnjeu d\'Ingénierie: Review bundle thickness tolerance.\nAmélioration de procédé: Follow BAPS 145-003 and 145-213 guidelines.',
  },
  {
    title: 'Missing drawing revision — RFC incorporation required',
    description: 'Instructions de travail: INCORPORATION DES NOUVEAU DWG SI REQUIS SUITE AU RFC\nEnjeu technique: Drawing revision mismatch on cahier baseline.\nEnjeu d\'Ingénierie: Verify RFC applicability on effectivity range.\nAmélioration de procédé: Align DWG revisions before production.',
  },
  {
    title: 'SUB cahier hours deficiency — multiple termination types',
    description: 'Instructions de travail: Review all SUB cahiers right and left side.\nEnjeu technique: Cahier de 6.42 heures contient CANBUS, MULTIPLE SPLICES, QUADRAX, OCTAX.\nEnjeu d\'Ingénierie: Methods must revise hours for OCTAX, QUADRAX, HDMI, CANBUS.\nAmélioration de procédé: Include interface gauche et droite avec tous types de terminaisons.',
  },
  {
    title: 'QUADRAX contacts not locking in dielectric — open circuit risk',
    description: 'Instructions de travail: N/A\nEnjeu technique: Connector A5495P1 QUADRAX — all 4 contacts do not lock with dielectric. Causing open circuit under vibration.\nEnjeu d\'Ingénierie: Verify contact retention force vs. dielectric specification.\nAmélioration de procédé: Evaluate alternate QUADRAX dielectric or contact p/n.',
  },
  {
    title: 'Wrong cahier reference — connector P4505 inscription error',
    description: 'Instructions de travail: Verify cahier cross-reference for connector P4505 (Zone N3).\nEnjeu technique: Perte de temps à trouver le cahier où sont inscrites les informations pour P4505.\nEnjeu d\'Ingénierie: N/A\nAmélioration de procédé: Inscrire les informations dans le bon cahier de montage.',
  },
  {
    title: 'RESALE — Add Starlink provision prior delivery',
    description: 'Instructions de travail: N/A\nEnjeu technique: Starlink provision missing from resale aircraft documentation.\nEnjeu d\'Ingénierie: Confirm Starlink effectivity and drawing reference.\nAmélioration de procédé: N/A',
  },
  {
    title: 'Stateroom wardrobe — missing drawing data for data transfer',
    description: 'Instructions de travail: N/A\nEnjeu technique: N/A\nEnjeu d\'Ingénierie: Missing information on G25070480, G25070481, G25070485-001. PCR 64130 solutions did not account for build-to-print constraint.\nAmélioration de procédé: N/A',
  },
  {
    title: 'Bed headboard cable routing — bend radius violation at zone B620',
    description: 'Instructions de travail: Opération 10 : routing\nEnjeu technique: Routing du câble GBH0047-AOG-26 du connecteur A4671J3 au A5325P3 ne respecte pas le bend radius du câble.\nEnjeu d\'Ingénierie: Voir le routing sur autres harnais déjà faits.\nAmélioration de procédé: N/A',
  },
  {
    title: 'PVA HDR++ cahier correction — wrong zone assignment B430',
    description: 'Instructions de travail: Page 16 de 24 zone B430 — connecteur A4400J1 et câbles GBC0080SH, GBC0105-AOG-22 incorrectement assignés.\nEnjeu technique: Connecteur A4400J1 et câbles ne vont pas dans zone B430.\nEnjeu d\'Ingénierie: N/A\nAmélioration de procédé: Ils vont au connecteur A4400J2 zone B420.',
  },
  {
    title: 'SSE AFT WAP Starlink integration — RFC suivi',
    description: 'Instructions de travail: Suivi RFC-115053 SSE AFT WAP Starlink integration verification.\nEnjeu technique: N/A\nEnjeu d\'Ingénierie: N/A\nAmélioration de procédé: N/A',
  },
  {
    title: 'FTER-BN700-247901 incorporation — provision GS et CR à ajouter',
    description: 'Instructions de travail: Incorporer FTER-BN700-247901 [-H].\nEnjeu technique: N/A\nEnjeu d\'Ingénierie: N/A\nAmélioration de procédé: N/A',
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
  let n = 229000 + randBetween(100, 999);
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
          cahier: `TRSW-${swatId.replace('SW-', '')}-${String(randBetween(1, 20)).padStart(2, '0')}`,
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
