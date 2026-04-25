export type TaskStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed';
export type Priority = 'low' | 'medium' | 'high';

export interface StatusChange {
  id: string;
  status: TaskStatus;
  timestamp: string;
  changedBy: string;
  note?: string;
}

export interface Task {
  id: string;
  agentId: string;

  // Core fields
  title: string;       // SWAT ID e.g. SW-230-765
  description: string; // Commentaire (HTML stripped)
  date: string;        // DATE RV (ISO)
  dayName: string;
  priority: Priority;
  status: TaskStatus;
  category: string;    // CODIF (ATT MET, GO, ATT ING, etc.)
  estimatedHours: number;
  statusHistory: StatusChange[];
  notes: string;       // SWAT DESCR. (HTML stripped)
  createdAt: string;
  updatedAt: string;

  // SWAT-specific fields
  swatId?: string;       // SWAT column value (SW-XXX-XXX)
  projet?: string;       // PROJET
  avion?: string;        // AVION
  position?: string;     // Position
  cahier?: string;       // Cahier (TRSW-XXX-XXX-XX)
  rv?: string;           // RV
  codif?: string;        // CODIF raw value
  pctProd?: number;      // %PROD
  groupe?: string;       // GROUPE (MET-ELEC13, etc.)
  rfc?: string;          // RFC
  statutRv?: string;     // STATUT RV (PREPARE, TBD, CLOSED)
  periode?: string;      // PERIODE (TBD, PREPROD, PIS, PRECONV)
  superviseur?: string;  // Superviseur
  programme?: string;    // Programme (Lib G7500, G5500, etc.)
  manager?: string;      // Manager
  dt1?: number;          // DT1
  dt2?: number;          // DT2
  harmoManuel?: boolean; // Harmo Manuel
  dateMethodes?: string; // DATE METHODES
  dateAlgo?: string;     // DATE ALGO
  prioriteNum?: number;  // Priorité (2, 3, 4)
}

export interface Agent {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  initials: string;
  color: string;
}

export interface WeeklyStats {
  agentId: string;
  agentName: string;
  totalTasks: number;
  completed: number;
  inProgress: number;
  onHold: number;
  notStarted: number;
  completionRate: number;
}

export interface DaySummary {
  date: string;
  dayName: string;
  tasks: Task[];
  total: number;
  completed: number;
  inProgress: number;
  onHold: number;
  notStarted: number;
}
