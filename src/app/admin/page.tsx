'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useStore } from '@/lib/store';
import { AGENTS } from '@/lib/agents';
import { Task, TaskStatus } from '@/lib/types';
import { STATUS_LABELS, STATUS_BG, formatDate, formatDateTime, exportToCSV } from '@/lib/utils';
import Header from '@/components/Header';
import {
  Upload, Download, Trash2, Plus, RefreshCw, CheckCircle2,
  AlertCircle, FileSpreadsheet, Database, X,
} from 'lucide-react';

// Real SWAT CSV column headers from PowerBI extract
const SWAT_COLUMNS = [
  'SWAT', 'PROJET', 'AVION', 'Position', 'Cahier', 'RV', 'CODIF', '%PROD',
  'RESPONSABLE', 'DATE PS', 'DATE RV', 'DT1', 'GROUPE', 'RFC', 'STATUT RV',
  'PERIODE', 'Commentaire', 'DT2', 'Superviseur', 'SWAT DESCR.', 'Priorité',
  'Programme', 'Manager', 'Meuble', 'DATE METHODES', 'DATE ALGO', 'Harmo Manuel',
  'SumTime_Estimate_Hours',
];

// PowerBI column prefix used in the extract
const PBI_PREFIX = 'SWAT_RV_WIP[';

function stripPrefix(key: string): string {
  if (key.startsWith(PBI_PREFIX)) return key.slice(PBI_PREFIX.length, -1);
  return key;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ').trim();
}

function statutToStatus(statut: string, codif: string): TaskStatus {
  const s = (statut || '').toUpperCase().trim();
  const c = (codif || '').toUpperCase().trim();
  if (s === 'CLOSED') return 'completed';
  if (s === 'PREPARE') return 'in_progress';
  if (c.startsWith('ATT')) return 'on_hold';
  if (c.startsWith('GO')) return 'in_progress';
  return 'not_started';
}

function prioriteToLevel(raw: string | number): 'low' | 'medium' | 'high' {
  const n = Number(raw);
  if (n <= 2) return 'low';
  if (n === 3) return 'medium';
  return 'high';
}

function parseDateCell(raw: unknown): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  if (raw instanceof Date) return raw.toISOString().split('T')[0];
  if (typeof raw === 'number') {
    return new Date((raw - 25569) * 86400000).toISOString().split('T')[0];
  }
  const str = String(raw).trim();
  if (!str || str === '0') return new Date().toISOString().split('T')[0];
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
}

export default function AdminPage() {
  const { tasks, importTasks, addTask, deleteTask, clearAllTasks, initialize, resetOnboarding } = useStore();
  const [tab, setTab] = useState<'import' | 'tasks' | 'export'>('import');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { initialize(); }, [initialize]);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);

      if (!rawRows.length) {
        setImportStatus({ type: 'error', message: 'File is empty or has no readable rows.' });
        return;
      }

      // Normalize keys — strip PowerBI prefix and trim
      const rows = rawRows.map((row) => {
        const normalized: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          normalized[stripPrefix(k).trim()] = v;
        }
        return normalized;
      });

      // Build fuzzy agent name lookup
      const agentByName = new Map(
        AGENTS.flatMap((a) => [
          [a.name.toLowerCase(), a],
          [a.firstName.toLowerCase(), a],
          [`${a.firstName} ${a.lastName}`.toLowerCase(), a],
          [`${a.lastName} ${a.firstName}`.toLowerCase(), a],
          // Match last-name first (e.g. "Alejandro Munoz Gonzalez" → agent Gonzalez Alejandro Munoz)
          ...a.name.toLowerCase().split(' ').map((part) => [part, a] as [string, typeof a]),
        ])
      );

      const findAgent = (name: string) => {
        const n = name.toLowerCase().trim();
        if (!n) return undefined;
        if (agentByName.has(n)) return agentByName.get(n);
        return AGENTS.find((a) => a.name.toLowerCase().includes(n.split(' ')[0]) && n.length > 2);
      };

      const newTasks = rows.map((row) => {
        const responsable = String(row['RESPONSABLE'] || '');
        const agent = findAgent(responsable);

        const codif = String(row['CODIF'] || '').trim();
        const statutRv = String(row['STATUT RV'] || '').trim();
        const status = statutToStatus(statutRv, codif);

        const dateRv = parseDateCell(row['DATE RV']);
        const d = new Date(dateRv + 'T12:00:00');
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

        const swatId = String(row['SWAT'] || '').trim();
        const commentaire = stripHtml(String(row['Commentaire'] || ''));
        const swatDescr = stripHtml(String(row['SWAT DESCR.'] || ''));
        const estH = parseFloat(String(row['SumTime_Estimate_Hours'] || '1')) || 1;
        const prioriteNum = parseInt(String(row['Priorité'] || row['Priorité'] || '3')) || 3;

        return {
          agentId: agent?.id || '',
          title: swatId || `SWAT-${Date.now()}`,
          description: commentaire,
          date: dateRv,
          dayName,
          priority: prioriteToLevel(prioriteNum),
          prioriteNum,
          status,
          category: codif || 'TBD',
          codif,
          estimatedHours: estH,
          notes: swatDescr,
          swatId,
          projet: String(row['PROJET'] || ''),
          avion: String(row['AVION'] || ''),
          position: String(row['Position'] || ''),
          cahier: String(row['Cahier'] || ''),
          rv: String(row['RV'] || ''),
          pctProd: parseFloat(String(row['%PROD'] || '0')) || 0,
          groupe: String(row['GROUPE'] || ''),
          rfc: String(row['RFC'] || ''),
          statutRv,
          periode: String(row['PERIODE'] || ''),
          superviseur: String(row['Superviseur'] || ''),
          programme: String(row['Programme'] || ''),
          manager: String(row['Manager'] || ''),
          dt1: parseInt(String(row['DT1'] || '0')) || 0,
          dt2: parseInt(String(row['DT2'] || '0')) || 0,
          harmoManuel: String(row['Harmo Manuel'] || '').toUpperCase() === 'VRAI',
        } as Partial<Task>;
      });

      const valid = newTasks.filter((t) => t.swatId && t.swatId.startsWith('SW-'));
      importTasks(valid);
      setImportStatus({
        type: 'success',
        message: `Imported ${valid.length} SWAT tasks from "${file.name}"${newTasks.length - valid.length > 0 ? ` (${newTasks.length - valid.length} rows skipped — missing SWAT ID)` : ''}.`,
      });
    } catch (err) {
      setImportStatus({ type: 'error', message: `Failed to parse file: ${String(err)}` });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const sample = [
      SWAT_COLUMNS,
      [
        'SW-230-001', 'G025-MD', 'G025-MD', '350', 'TRSW-230-001-01', 'RV-584-100 A',
        'ATT MET', '0', 'Ahmed AMasha', '', '4/28/2026', '-5', 'MET-ELEC13', 'RFC-115500',
        'PREPARE', 'PREPROD',
        'Instructions de travail: KT8124-V0041\nEnjeu technique: Circuit breakers not assigned per drawing.\nEnjeu d\'Ingénierie: Electrical drawing update required.\nAmélioration de procédé: N/A',
        '7', 'Damien Marie', 'Circuit breakers not assigned per electrical drawing',
        '3', 'Lib G7500', 'Annabelle Almeida', '', '', '4/2/2026', 'FAUX', '1',
      ],
      [
        'SW-231-045', 'K1799', '60208', '', 'TRSW-231-045-02', '',
        'GO MET', '0', 'Thomas Houdebert', '', '4/29/2026', '3', 'MET-CFG62', '',
        'TBD', 'TBD',
        'Instructions de travail: N/A\nEnjeu technique: Bundle routing correction needed.\nEnjeu d\'Ingénierie: N/A\nAmélioration de procédé: N/A',
        '5', 'Damien Marie', 'Bundle routing correction zone B430',
        '4', 'G5500', 'Annabelle Almeida', '', '', '', 'FAUX', '0.5',
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(sample);
    ws['!cols'] = SWAT_COLUMNS.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, 'SWAT Tasks');
    XLSX.writeFile(wb, 'SWAT-tasks-template.xlsx');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterAgent !== 'all' && t.agentId !== filterAgent) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const TABS = [
    { id: 'import', label: 'Import SWAT Extract', icon: Upload },
    { id: 'tasks',  label: `Manage Tasks (${tasks.length})`, icon: Database },
    { id: 'export', label: 'Export Data', icon: Download },
  ] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Admin Panel" subtitle="Import SWAT extract, manage tasks, export to PowerBI" onHelp={resetOnboarding} />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 mb-6 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* IMPORT TAB */}
        {tab === 'import' && (
          <div className="space-y-5 max-w-2xl">
            {importStatus && (
              <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
                importStatus.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {importStatus.type === 'success'
                  ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                  : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
                <span>{importStatus.message}</span>
                <button onClick={() => setImportStatus(null)} className="ml-auto flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Upload zone */}
            <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors">
              <FileSpreadsheet size={40} className="text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1">Upload PowerBI SWAT Extract</h3>
              <p className="text-xs text-slate-400 mb-2">
                Accepts the direct PowerBI CSV export (<code className="text-indigo-400">Extract power BI_SWAT(Export).csv</code>)
                or the template Excel file below.
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Supported: .csv · .xlsx · .xls — columns auto-detected, PowerBI prefix stripped
              </p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileImport} className="hidden" id="file-upload" />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors"
              >
                <Upload size={14} />
                Choose File
              </label>
            </div>

            {/* Column reference */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Expected Columns (SWAT Format)</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs mb-4">
                {[
                  ['SWAT', 'Ticket ID (SW-XXX-XXX)'],
                  ['RESPONSABLE', 'Agent name → mapped to team'],
                  ['CODIF', 'ATT MET / GO / ATT ING / etc.'],
                  ['STATUT RV', 'PREPARE / TBD / CLOSED'],
                  ['DATE RV', 'Task date (MM/DD/YYYY)'],
                  ['SumTime_Estimate_Hours', 'Estimated hours'],
                  ['Priorité', 'Priority (2=low, 3=med, 4=high)'],
                  ['GROUPE', 'MET-ELEC13 / MET-CFG62 / etc.'],
                  ['PROJET / AVION', 'Aircraft project'],
                  ['Commentaire', 'Description (HTML stripped)'],
                  ['SWAT DESCR.', 'Notes (HTML stripped)'],
                  ['RFC / RV / Cahier', 'References'],
                ].map(([col, desc]) => (
                  <div key={col} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-mono whitespace-nowrap">{col}</span>
                    <span className="text-slate-500">{desc}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Download size={14} />
                Download SWAT Template (.xlsx)
              </button>
            </div>

            {/* STATUT RV mapping reference */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Status Mapping</h3>
              <div className="space-y-2 text-xs">
                {[
                  ['STATUT RV: CLOSED', 'Completed', 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'],
                  ['STATUT RV: PREPARE', 'In Progress', 'bg-blue-500/10 text-blue-400 border-blue-500/20'],
                  ['CODIF: ATT* (any)', 'On Hold', 'bg-amber-500/10 text-amber-400 border-amber-500/20'],
                  ['CODIF: GO* / STATUT: TBD', 'Not Started / In Progress', 'bg-gray-500/10 text-gray-400 border-gray-500/20'],
                ].map(([source, label, cls]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-slate-400 font-mono">{source}</span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-xs ${cls}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h3>
              <p className="text-xs text-slate-400 mb-4">Reset all data to generated sample SWAT tasks, or wipe everything.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { if (confirm('Clear all tasks and regenerate sample data?')) { clearAllTasks(); setTimeout(() => initialize(), 100); } }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <RefreshCw size={14} />
                  Reset to Sample Data
                </button>
                <button
                  onClick={() => { if (confirm('Delete ALL tasks permanently?')) clearAllTasks(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium rounded-lg border border-red-500/30 transition-colors"
                >
                  <Trash2 size={14} />
                  Clear All Tasks
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MANAGE TASKS TAB */}
        {tab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Agents</option>
                {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
              <span className="text-xs text-slate-400">{filteredTasks.length} tasks</span>
              <button
                onClick={() => setShowAddTask(true)}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={14} />
                Add Task
              </button>
            </div>

            {showAddTask && <AddTaskForm onClose={() => setShowAddTask(false)} onAdd={addTask} />}

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-4 py-3 text-indigo-400 font-medium">SWAT</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Agent</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">CODIF</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">GROUPE</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Priority</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Est. h</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Updated</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.slice(0, 100).map((task) => {
                      const agent = AGENTS.find((a) => a.id === task.agentId);
                      return (
                        <tr key={task.id} className="border-b border-slate-700/20 hover:bg-slate-700/10 transition-colors">
                          <td className="px-4 py-3 font-mono text-indigo-300 whitespace-nowrap">{task.swatId || task.title}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: agent?.color }}>
                                {agent?.initials}
                              </div>
                              <span className="text-slate-300 whitespace-nowrap">{agent?.name ?? '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{task.codif || task.category}</td>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{task.groupe || '—'}</td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{task.dayName?.slice(0, 3)}, {formatDate(task.date)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full border capitalize ${
                              task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              task.priority === 'medium' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>{task.priority}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full border ${STATUS_BG[task.status]}`}>
                              {STATUS_LABELS[task.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{task.estimatedHours}h</td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(task.updatedAt)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => { if (confirm('Delete this task?')) deleteTask(task.id); }}
                              className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredTasks.length > 100 && (
                  <div className="px-4 py-3 text-xs text-slate-500 text-center">
                    Showing 100 of {filteredTasks.length} tasks
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* EXPORT TAB */}
        {tab === 'export' && (
          <div className="space-y-5 max-w-2xl">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-2">Export All Task Data</h3>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Export all tasks with full status history and timestamps. The CSV is structured for
                direct import into PowerBI — each status change occupies dedicated columns for time-intelligence analysis.
              </p>
              <div className="bg-slate-900/50 rounded-lg p-4 mb-4 text-xs text-slate-400 grid grid-cols-2 gap-1">
                {[
                  'Task ID', 'SWAT ID', 'Agent Name', 'CODIF', 'GROUPE', 'PROJET', 'AVION',
                  'Cahier', 'RFC', 'STATUT RV', 'PERIODE', 'Date', 'Day', 'Priority (#)',
                  'Est. Hours', 'Status', 'Created At', 'Updated At',
                  'Status Change 1-4 (Status / Timestamp / Changed By)', 'Notes',
                ].map((col) => (
                  <div key={col} className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                    {col}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => exportToCSV(tasks)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Download size={14} />
                  Export All ({tasks.length} tasks)
                </button>
                <button
                  onClick={() => exportToCSV(tasks.filter((t) => t.status === 'completed'))}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-sm font-medium rounded-lg border border-emerald-500/30 transition-colors"
                >
                  <Download size={14} />
                  Completed Only ({tasks.filter((t) => t.status === 'completed').length})
                </button>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-3">Export by Agent</h3>
              <div className="grid grid-cols-2 gap-2">
                {AGENTS.map((agent) => {
                  const count = tasks.filter((t) => t.agentId === agent.id).length;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => exportToCSV(tasks.filter((t) => t.agentId === agent.id))}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-left transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: agent.color }}>
                        {agent.initials}
                      </div>
                      <span className="text-slate-300 flex-1 truncate">{agent.name}</span>
                      <span className="text-slate-500 flex-shrink-0">{count}</span>
                      <Download size={11} className="text-slate-500 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddTaskForm({ onClose, onAdd }: { onClose: () => void; onAdd: (task: any) => void }) {
  const [form, setForm] = useState({
    agentId: '', title: '', description: '', date: new Date().toISOString().split('T')[0],
    priority: 'medium', category: 'ATT MET', estimatedHours: 1, notes: '',
    groupe: '', projet: '', codif: 'ATT MET',
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.agentId || !form.title) return;
    const d = new Date(form.date + 'T12:00:00');
    onAdd({
      ...form,
      swatId: form.title,
      dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
      estimatedHours: Number(form.estimatedHours),
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/80 border border-indigo-500/30 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Add SWAT Task</h3>
        <button type="button" onClick={onClose}><X size={16} className="text-slate-400 hover:text-white" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Agent *</label>
          <select required value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="">Select agent</option>
            {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Date *</label>
          <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">SWAT ID *</label>
          <input required type="text" placeholder="SW-230-001" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">CODIF</label>
          <select value={form.codif} onChange={(e) => setForm({ ...form, codif: e.target.value, category: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            {['ATT MET', 'ATT ING', 'ATT GI', 'GO', 'GO MET', 'GO CSD', 'ATT PROD'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">GROUPE</label>
          <input type="text" placeholder="MET-ELEC13" value={form.groupe} onChange={(e) => setForm({ ...form, groupe: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="low">Low (2)</option>
            <option value="medium">Medium (3)</option>
            <option value="high">High (4)</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">Description (Commentaire)</label>
          <textarea rows={3} placeholder="Instructions de travail: ..." value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={14} />Add Task
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
