'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useStore } from '@/lib/store';
import { useAuthStore, LoginUser, UserRole } from '@/lib/authStore';
import { Task, Agent } from '@/lib/types';
import { STATUS_LABELS, STATUS_BG, formatDate } from '@/lib/utils';
import {
  exportExcel, exportPDF, exportOutlookHTML, exportWord, exportToCSV,
} from '@/lib/exportFormats';
import Header from '@/components/Header';
import {
  Upload, Download, Trash2, Plus, RefreshCw, CheckCircle2, AlertCircle,
  FileSpreadsheet, Database, X, Users, ArrowRightLeft, FileDown,
  Edit2, Save, Shield, User, Eye, EyeOff, Lock,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

// ─────────────────────────────────────────────────────────────────────────────
// SWAT column helpers
// ─────────────────────────────────────────────────────────────────────────────
const PBI_PREFIX = 'SWAT_RV_WIP[';
function stripPrefix(key: string) { return key.startsWith(PBI_PREFIX) ? key.slice(PBI_PREFIX.length, -1) : key; }
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/\s{2,}/g,' ').trim();
}
function statutToStatus(statut: string, codif: string) {
  const s = statut.toUpperCase().trim(), c = codif.toUpperCase().trim();
  if (s === 'CLOSED') return 'completed' as const;
  if (s === 'PREPARE') return 'in_progress' as const;
  if (c.startsWith('ATT')) return 'on_hold' as const;
  if (c.startsWith('GO')) return 'in_progress' as const;
  return 'not_started' as const;
}
function parseDateCell(raw: unknown): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  if (raw instanceof Date) return raw.toISOString().split('T')[0];
  if (typeof raw === 'number') return new Date((raw - 25569) * 86400000).toISOString().split('T')[0];
  const s = String(raw).trim();
  const p = new Date(s); return isNaN(p.getTime()) ? new Date().toISOString().split('T')[0] : p.toISOString().split('T')[0];
}

const AGENT_COLORS = [
  '#4F46E5','#7C3AED','#DB2777','#DC2626','#D97706',
  '#059669','#0891B2','#2563EB','#BE185D','#065F46',
  '#1D4ED8','#9333EA','#C2410C','#0F766E','#6D28D9',
  '#1E40AF','#D946EF',
];

type TabId = 'import' | 'tasks' | 'reassign' | 'users' | 'export';

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const t = useT();
  const {
    tasks, agents, importTasks, deleteTask, deleteTasks,
    updateTask, reassignTasks, addAgent, updateAgent, removeAgent,
    clearAllTasks, initialize, resetOnboarding,
  } = useStore();
  const { currentUser, users, addUser, updateUser, removeUser, changePassword, isAdmin } = useAuthStore();
  const [tab, setTab] = useState<TabId>('import');

  useEffect(() => { initialize(); }, [initialize]);

  const adminOnly = isAdmin();

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'import',   label: t('admin.import'),  icon: Upload },
    { id: 'tasks',    label: t('admin.tasks'),   icon: Database },
    { id: 'reassign', label: t('admin.reassign'),icon: ArrowRightLeft },
    { id: 'users',    label: t('admin.users'),   icon: Users },
    { id: 'export',   label: t('admin.export'),  icon: FileDown },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title={t('admin.title')} subtitle={t('admin.subtitle')} onHelp={resetOnboarding} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">

        {/* Role notice */}
        {!adminOnly && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-300">
            <Lock size={14} />
            {t('admin.readOnly')}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 mb-6 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'import'   && <ImportTab agents={agents} importTasks={importTasks} clearAllTasks={clearAllTasks} initialize={initialize} adminOnly={adminOnly} />}
        {tab === 'tasks'    && <TasksTab tasks={tasks} agents={agents} deleteTask={deleteTask} deleteTasks={deleteTasks} updateTask={updateTask} adminOnly={adminOnly} />}
        {tab === 'reassign' && <ReassignTab tasks={tasks} agents={agents} reassignTasks={reassignTasks} currentUser={currentUser?.displayName ?? 'Admin'} adminOnly={adminOnly} />}
        {tab === 'users'    && <UsersTab agents={agents} addAgent={addAgent} updateAgent={updateAgent} removeAgent={removeAgent} users={users} addUser={addUser} updateUser={updateUser} removeUser={removeUser} changePassword={changePassword} adminOnly={adminOnly} />}
        {tab === 'export'   && <ExportTab tasks={tasks} agents={agents} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: IMPORT
// ─────────────────────────────────────────────────────────────────────────────
function ImportTab({ agents, importTasks, clearAllTasks, initialize, adminOnly }: any) {
  const [status, setStatus] = useState<{ type: 'success'|'error'; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setStatus(null);
    try {
      const buf = await file.arrayBuffer();
      const wb  = XLSX.read(buf, { type: 'array', cellDates: true });
      const ws  = wb.Sheets[wb.SheetNames[0]];
      const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);
      if (!rawRows.length) { setStatus({ type: 'error', msg: 'File is empty.' }); return; }

      const rows = rawRows.map(row => {
        const n: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) n[stripPrefix(k).trim()] = v;
        return n;
      });

      const agentByName = new Map<string, Agent>();
      agents.forEach((a: Agent) => {
        agentByName.set(a.name.toLowerCase(), a);
        agentByName.set(a.firstName.toLowerCase(), a);
        a.name.toLowerCase().split(' ').forEach(p => { if (!agentByName.has(p)) agentByName.set(p, a); });
      });
      const findAgent = (name: string) => {
        const n = name.toLowerCase().trim();
        return agentByName.get(n) ?? agents.find((a: Agent) => a.name.toLowerCase().includes(n.split(' ')[0]) && n.length > 2);
      };

      const newTasks = rows.map(row => {
        const agent   = findAgent(String(row['RESPONSABLE'] || ''));
        const codif   = String(row['CODIF']     || '').trim();
        const statutRv= String(row['STATUT RV'] || '').trim();
        const dateRv  = parseDateCell(row['DATE RV']);
        const d       = new Date(dateRv + 'T12:00:00');
        const swatId  = String(row['SWAT'] || '').trim();
        return {
          agentId: agent?.id || '',
          title:   swatId || `SWAT-${Date.now()}`,
          description: stripHtml(String(row['Commentaire'] || '')),
          date: dateRv,
          dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
          priority: (() => { const n = parseInt(String(row['Priorité']||'3')); return n<=2?'low':n===3?'medium':'high'; })() as any,
          prioriteNum: parseInt(String(row['Priorité']||'3'))||3,
          status: statutToStatus(statutRv, codif),
          category: codif || 'TBD',
          codif, estimatedHours: parseFloat(String(row['SumTime_Estimate_Hours']||'1'))||1,
          notes: stripHtml(String(row['SWAT DESCR.']||'')),
          swatId, projet: String(row['PROJET']||''), avion: String(row['AVION']||''),
          position: String(row['Position']||''), cahier: String(row['Cahier']||''),
          rv: String(row['RV']||''), pctProd: parseFloat(String(row['%PROD']||'0'))||0,
          groupe: String(row['GROUPE']||''), rfc: String(row['RFC']||''),
          statutRv, periode: String(row['PERIODE']||''),
          superviseur: String(row['Superviseur']||''), programme: String(row['Programme']||''),
          manager: String(row['Manager']||''),
          dt1: parseInt(String(row['DT1']||'0'))||0, dt2: parseInt(String(row['DT2']||'0'))||0,
          harmoManuel: String(row['Harmo Manuel']||'').toUpperCase()==='VRAI',
        } as Partial<Task>;
      });

      const valid = newTasks.filter(t => t.swatId?.startsWith('SW-'));
      importTasks(valid);
      setStatus({ type: 'success', msg: `Imported ${valid.length} SWAT tasks from "${file.name}"${newTasks.length-valid.length>0?` (${newTasks.length-valid.length} skipped)`:''}.` });
    } catch (err) { setStatus({ type: 'error', msg: `Parse error: ${err}` }); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const downloadTemplate = () => {
    const COLS = ['SWAT','PROJET','AVION','Position','Cahier','RV','CODIF','%PROD','RESPONSABLE','DATE PS','DATE RV','DT1','GROUPE','RFC','STATUT RV','PERIODE','Commentaire','DT2','Superviseur','SWAT DESCR.','Priorité','Programme','Manager','Meuble','DATE METHODES','DATE ALGO','Harmo Manuel','SumTime_Estimate_Hours'];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([COLS, ['SW-230-001','G025-MD','G025-MD','350','TRSW-230-001-01','RV-584-100 A','ATT MET','0','Ahmed AMasha','','4/28/2026','-5','MET-ELEC13','RFC-115500','PREPARE','PREPROD','Instructions de travail: ...','7','Damien Marie','Circuit breakers not assigned','3','Lib G7500','Annabelle Almeida','','','4/2/2026','FAUX','1']]);
    ws['!cols'] = COLS.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, 'SWAT Tasks');
    XLSX.writeFile(wb, 'SWAT-tasks-template.xlsx');
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {status && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${status.type==='success'?'bg-emerald-500/10 border-emerald-500/30 text-emerald-300':'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          {status.type==='success'?<CheckCircle2 size={16} className="mt-0.5 flex-shrink-0"/>:<AlertCircle size={16} className="mt-0.5 flex-shrink-0"/>}
          <span>{status.msg}</span>
          <button onClick={()=>setStatus(null)} className="ml-auto"><X size={14}/></button>
        </div>
      )}
      <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors">
        <FileSpreadsheet size={40} className="text-slate-600 mx-auto mb-3"/>
        <h3 className="text-sm font-semibold text-white mb-1">Upload PowerBI SWAT Extract</h3>
        <p className="text-xs text-slate-400 mb-4">Direct export from PowerBI (<code className="text-indigo-400">Extract power BI_SWAT(Export).csv</code>) or template below. Supports .csv · .xlsx · .xls</p>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" id="swat-upload" disabled={!adminOnly}/>
        <label htmlFor="swat-upload" className={`inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-lg transition-colors ${adminOnly?'bg-indigo-600 hover:bg-indigo-500 cursor-pointer':'bg-slate-700 cursor-not-allowed opacity-50'}`}>
          <Upload size={14}/>Choose File
        </label>
      </div>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-2">STATUT RV → Status Mapping</h3>
        <div className="space-y-1.5 text-xs mb-4">
          {[['CLOSED','Completed','bg-emerald-500/10 text-emerald-400 border-emerald-500/20'],['PREPARE','In Progress','bg-blue-500/10 text-blue-400 border-blue-500/20'],['ATT* (CODIF)','On Hold','bg-amber-500/10 text-amber-400 border-amber-500/20'],['GO* / TBD','Not Started / Active','bg-gray-500/10 text-gray-400 border-gray-500/20']].map(([src,lbl,cls])=>(
            <div key={src} className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">{src}</span>
              <span className={`px-2.5 py-0.5 rounded-full border text-xs ${cls}`}>{lbl}</span>
            </div>
          ))}
        </div>
        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Download size={14}/>Download Template (.xlsx)
        </button>
      </div>
      {adminOnly && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h3>
          <p className="text-xs text-slate-400 mb-4">Reset all task data to generated sample SWAT tasks, or wipe everything.</p>
          <div className="flex gap-3">
            <button onClick={()=>{if(confirm('Reset to sample data?')){clearAllTasks();setTimeout(()=>initialize(),100);}}} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
              <RefreshCw size={14}/>Reset to Sample Data
            </button>
            <button onClick={()=>{if(confirm('Delete ALL tasks permanently?'))clearAllTasks();}} className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium rounded-lg border border-red-500/30 transition-colors">
              <Trash2 size={14}/>Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: TASKS
// ─────────────────────────────────────────────────────────────────────────────
function TasksTab({ tasks, agents, deleteTask, deleteTasks, updateTask, adminOnly }: any) {
  const [filterAgent, setFilterAgent]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [editingId, setEditingId]        = useState<string|null>(null);
  const [editForm, setEditForm]          = useState<Partial<Task>>({});

  const filtered = tasks.filter((t: Task) => {
    if (filterAgent !== 'all' && t.agentId !== filterAgent) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const toggle = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id)?s.delete(id):s.add(id); return s; });
  const toggleAll = () => setSelected(selected.size===filtered.length?new Set():new Set(filtered.map((t:Task)=>t.id)));

  const startEdit = (task: Task) => { setEditingId(task.id); setEditForm({ ...task }); };
  const saveEdit  = () => { if (editingId) { updateTask(editingId, editForm); setEditingId(null); } };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterAgent} onChange={e=>setFilterAgent(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
          <option value="all">All Agents</option>
          {agents.map((a:Agent)=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <span className="text-xs text-slate-400">{filtered.length} tasks{selected.size>0?` · ${selected.size} selected`:''}</span>
        {selected.size>0 && adminOnly && (
          <button onClick={()=>{if(confirm(`Delete ${selected.size} tasks?`)){deleteTasks([...selected]);setSelected(new Set());}}} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs hover:bg-red-600/40 transition-colors">
            <Trash2 size={12}/>Delete Selected
          </button>
        )}
      </div>

      {/* Inline edit modal */}
      {editingId && (
        <EditTaskModal
          form={editForm}
          agents={agents}
          onChange={setEditForm}
          onSave={saveEdit}
          onCancel={()=>setEditingId(null)}
        />
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50">
                {adminOnly && <th className="px-4 py-3 w-8"><input type="checkbox" checked={selected.size===filtered.length&&filtered.length>0} onChange={toggleAll} className="accent-indigo-500"/></th>}
                <th className="text-left px-4 py-3 text-indigo-400 font-medium">SWAT</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Agent</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">CODIF</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">GROUPE</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Priority</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Est.h</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                {adminOnly && <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,100).map((task:Task) => {
                const agent = agents.find((a:Agent)=>a.id===task.agentId);
                return (
                  <tr key={task.id} className={`border-b border-slate-700/20 transition-colors ${selected.has(task.id)?'bg-indigo-500/5':'hover:bg-slate-700/10'}`}>
                    {adminOnly && <td className="px-4 py-3"><input type="checkbox" checked={selected.has(task.id)} onChange={()=>toggle(task.id)} className="accent-indigo-500"/></td>}
                    <td className="px-4 py-3 font-mono text-indigo-300 whitespace-nowrap">{task.swatId||task.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{backgroundColor:agent?.color}}>{agent?.initials}</div>
                        <span className="text-slate-300 whitespace-nowrap">{agent?.name??'—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{task.codif||task.category}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{task.groupe||'—'}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{task.dayName?.slice(0,3)}, {formatDate(task.date)}</td>
                    <td className="px-4 py-3 capitalize text-slate-400">{task.priority}</td>
                    <td className="px-4 py-3 text-slate-400">{task.estimatedHours}h</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full border ${STATUS_BG[task.status]}`}>{STATUS_LABELS[task.status]}</span></td>
                    {adminOnly && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={()=>startEdit(task)} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"><Edit2 size={12}/></button>
                          <button onClick={()=>{if(confirm('Delete this task?'))deleteTask(task.id);}} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={12}/></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 100 && <div className="px-4 py-3 text-xs text-slate-500 text-center">Showing 100 of {filtered.length} tasks</div>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Task Modal
// ─────────────────────────────────────────────────────────────────────────────
function EditTaskModal({ form, agents, onChange, onSave, onCancel }: any) {
  const F = (k: string) => (e: any) => onChange((prev: any) => ({ ...prev, [k]: e.target.value }));
  return (
    <div className="bg-slate-800/90 border border-indigo-500/40 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Edit2 size={14} className="text-indigo-400"/>Edit Task</h3>
        <button onClick={onCancel}><X size={16} className="text-slate-400 hover:text-white"/></button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="SWAT ID"     value={form.swatId||''}     onChange={F('swatId')} />
        <Field label="CODIF"       value={form.codif||''}      onChange={F('codif')} />
        <Field label="GROUPE"      value={form.groupe||''}     onChange={F('groupe')} />
        <Field label="PROJET"      value={form.projet||''}     onChange={F('projet')} />
        <Field label="AVION"       value={form.avion||''}      onChange={F('avion')} />
        <Field label="RFC"         value={form.rfc||''}        onChange={F('rfc')} />
        <Field label="Cahier"      value={form.cahier||''}     onChange={F('cahier')} />
        <Field label="DATE RV"     value={form.date||''}       onChange={F('date')} type="date" />
        <Field label="Est. Hours"  value={form.estimatedHours||''} onChange={F('estimatedHours')} type="number" />
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Agent</label>
          <select value={form.agentId||''} onChange={F('agentId')} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="">— unassigned —</option>
            {agents.map((a:Agent)=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Priority</label>
          <select value={form.priority||'medium'} onChange={F('priority')} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Status</label>
          <select value={form.status||'not_started'} onChange={F('status')} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            {Object.entries(STATUS_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">STATUT RV</label>
          <select value={form.statutRv||''} onChange={F('statutRv')} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="">—</option><option value="TBD">TBD</option><option value="PREPARE">PREPARE</option><option value="CLOSED">CLOSED</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">PERIODE</label>
          <select value={form.periode||''} onChange={F('periode')} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="">—</option><option value="TBD">TBD</option><option value="PREPROD">PREPROD</option><option value="PIS">PIS</option><option value="PRECONV">PRECONV</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <label className="text-xs text-slate-400 mb-1 block">Description (Commentaire)</label>
          <textarea rows={3} value={form.description||''} onChange={F('description')} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"/>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"><Save size={13}/>Save Changes</button>
        <button onClick={onCancel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type='text' }: any) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={onChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: REASSIGN
// ─────────────────────────────────────────────────────────────────────────────
function ReassignTab({ tasks, agents, reassignTasks, currentUser, adminOnly }: any) {
  const [filterAgent, setFilterAgent]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [targetAgent, setTargetAgent]   = useState('');
  const [note, setNote]                 = useState('');
  const [done, setDone]                 = useState(false);

  const filtered = tasks.filter((t: Task) => {
    if (filterAgent !== 'all' && t.agentId !== filterAgent) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const toggle = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id)?s.delete(id):s.add(id); return s; });
  const toggleAll = () => setSelected(selected.size===filtered.length?new Set():new Set(filtered.map((t:Task)=>t.id)));

  const handleReassign = () => {
    if (!targetAgent || selected.size === 0) return;
    reassignTasks([...selected], targetAgent, currentUser, note || undefined);
    setSelected(new Set()); setNote(''); setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <div className="space-y-4">
      {!adminOnly && <LockedNotice />}

      {done && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
          <CheckCircle2 size={15}/>Tasks successfully reassigned.
        </div>
      )}

      {/* Controls */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Step 1 — Filter & Select Tasks</h3>
        <div className="flex flex-wrap gap-3">
          <select value={filterAgent} onChange={e=>setFilterAgent(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="all">All Agents</option>
            {agents.map((a:Agent)=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
          <span className="text-xs text-slate-400 self-center">{selected.size} / {filtered.length} selected</span>
        </div>

        <div className="border border-slate-700/50 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-900">
              <tr className="border-b border-slate-700/50">
                <th className="px-3 py-2 w-8"><input type="checkbox" checked={selected.size===filtered.length&&filtered.length>0} onChange={toggleAll} className="accent-indigo-500"/></th>
                <th className="text-left px-3 py-2 text-slate-400">SWAT ID</th>
                <th className="text-left px-3 py-2 text-slate-400">Current Agent</th>
                <th className="text-left px-3 py-2 text-slate-400">CODIF</th>
                <th className="text-left px-3 py-2 text-slate-400">Date</th>
                <th className="text-left px-3 py-2 text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task:Task)=>{
                const agent = agents.find((a:Agent)=>a.id===task.agentId);
                return (
                  <tr key={task.id} onClick={()=>adminOnly&&toggle(task.id)} className={`border-b border-slate-700/20 transition-colors ${adminOnly?'cursor-pointer':''} ${selected.has(task.id)?'bg-indigo-500/10':''} hover:bg-slate-700/20`}>
                    <td className="px-3 py-2"><input type="checkbox" checked={selected.has(task.id)} onChange={()=>toggle(task.id)} className="accent-indigo-500" disabled={!adminOnly}/></td>
                    <td className="px-3 py-2 font-mono text-indigo-300">{task.swatId||task.title}</td>
                    <td className="px-3 py-2 text-slate-300">{agent?.name||'—'}</td>
                    <td className="px-3 py-2 text-slate-400">{task.codif||task.category}</td>
                    <td className="px-3 py-2 text-slate-400">{task.date}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full border ${STATUS_BG[task.status]}`}>{STATUS_LABELS[task.status]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Step 2 — Choose New Agent & Confirm</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Reassign to</label>
            <select value={targetAgent} onChange={e=>setTargetAgent(e.target.value)} disabled={!adminOnly} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50">
              <option value="">Select agent…</option>
              {agents.map((a:Agent)=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Note (optional)</label>
            <input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="Reason for reassignment…" disabled={!adminOnly} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"/>
          </div>
        </div>
        <button
          onClick={handleReassign}
          disabled={!adminOnly || selected.size===0 || !targetAgent}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          <ArrowRightLeft size={14}/>
          Reassign {selected.size > 0 ? `${selected.size} Task${selected.size>1?'s':''}` : '…'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: USERS & AGENTS
// ─────────────────────────────────────────────────────────────────────────────
function UsersTab({ agents, addAgent, updateAgent, removeAgent, users, addUser, updateUser, removeUser, changePassword, adminOnly }: any) {
  const [section, setSection] = useState<'accounts'|'agents'>('accounts');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddAgent,   setShowAddAgent]   = useState(false);
  const [editAccount,    setEditAccount]    = useState<LoginUser|null>(null);
  const [editAgent,      setEditAgentState] = useState<Agent|null>(null);
  const [pwDialog, setPwDialog] = useState<{id:string;name:string}|null>(null);

  if (!adminOnly) return <LockedNotice />;

  return (
    <div className="space-y-5">
      {/* Section toggle */}
      <div className="flex gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 w-fit">
        {(['accounts','agents'] as const).map(s => (
          <button key={s} onClick={()=>setSection(s)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${section===s?'bg-indigo-600 text-white':'text-slate-400 hover:text-white'}`}>
            {s==='accounts'?'Login Accounts':'Agent Profiles'}
          </button>
        ))}
      </div>

      {/* ── Login Accounts ── */}
      {section === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Login Accounts ({users.length})</h3>
            <button onClick={()=>setShowAddAccount(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"><Plus size={13}/>Add Account</button>
          </div>

          {showAddAccount && <AddAccountForm agents={agents} onAdd={addUser} onClose={()=>setShowAddAccount(false)}/>}
          {editAccount && <EditAccountForm user={editAccount} agents={agents} onSave={(u:any)=>{updateUser(editAccount.id,u);setEditAccount(null);}} onClose={()=>setEditAccount(null)}/>}
          {pwDialog && <ChangePasswordDialog id={pwDialog.id} name={pwDialog.name} onSave={(pw:string)=>{changePassword(pwDialog.id,pw);setPwDialog(null);}} onClose={()=>setPwDialog(null)}/>}

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">User</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Username</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Email</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: LoginUser) => (
                  <tr key={u.id} className="border-b border-slate-700/20 hover:bg-slate-700/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-700">
                          {u.role==='admin'?<Shield size={12} className="text-indigo-400"/>:u.role==='supervisor'?<Shield size={12} className="text-emerald-400"/>:<User size={12} className="text-slate-400"/>}
                        </div>
                        <span className="text-white font-medium">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-xs capitalize ${
                        u.role==='admin'?'bg-indigo-500/20 text-indigo-300 border-indigo-500/30':
                        u.role==='supervisor'?'bg-emerald-500/20 text-emerald-300 border-emerald-500/30':
                        'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={()=>updateUser(u.id,{active:!u.active})} className={`px-2 py-0.5 rounded-full border text-xs ${u.active?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20':'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {u.active?'Active':'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={()=>setEditAccount(u)} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="Edit"><Edit2 size={12}/></button>
                        <button onClick={()=>setPwDialog({id:u.id,name:u.displayName})} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Change password"><Lock size={12}/></button>
                        {u.id !== 'u0' && <button onClick={()=>{if(confirm(`Remove ${u.displayName}?`))removeUser(u.id);}} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete"><Trash2 size={12}/></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Agent Profiles ── */}
      {section === 'agents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Agent Profiles ({agents.length})</h3>
            <button onClick={()=>setShowAddAgent(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"><Plus size={13}/>Add Agent</button>
          </div>

          {showAddAgent && <AddAgentForm onAdd={addAgent} onClose={()=>setShowAddAgent(false)}/>}
          {editAgent && <EditAgentForm agent={editAgent} onSave={(u:any)=>{updateAgent(editAgent.id,u);setEditAgentState(null);}} onClose={()=>setEditAgentState(null)}/>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map((agent: Agent) => (
              <div key={agent.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{backgroundColor:agent.color}}>
                  {agent.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{agent.name}</div>
                  <div className="text-xs text-slate-500">{agent.role}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={()=>setEditAgentState(agent)} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"><Edit2 size={12}/></button>
                  <button onClick={()=>{if(confirm(`Remove agent ${agent.name}? Their tasks will be orphaned.`))removeAgent(agent.id);}} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: EXPORT
// ─────────────────────────────────────────────────────────────────────────────
function ExportTab({ tasks, agents }: { tasks: Task[]; agents: Agent[] }) {
  const [exporting, setExporting] = useState<string|null>(null);

  const run = useCallback(async (label: string, fn: () => Promise<void>|void) => {
    setExporting(label);
    try { await fn(); } finally { setTimeout(()=>setExporting(null), 1000); }
  }, []);

  const formats = [
    {
      id: 'excel',
      label: 'Excel Workbook (.xlsx)',
      desc: 'Multi-sheet XLSX: Summary, All Tasks, per-agent sheets. Ideal for pivot tables and Excel analysis.',
      icon: '📊',
      color: 'border-emerald-500/30 hover:border-emerald-500/60',
      fn: () => exportExcel(tasks, agents),
    },
    {
      id: 'pdf',
      label: 'PDF Report (.pdf)',
      desc: 'Formatted PDF with team summary table and full task detail list. Printable A4 landscape.',
      icon: '📄',
      color: 'border-red-500/30 hover:border-red-500/60',
      fn: () => exportPDF(tasks, agents),
    },
    {
      id: 'outlook',
      label: 'Outlook / Email HTML (.html)',
      desc: 'Professional email-ready HTML report with inline CSS. Open directly in Outlook, browser, or print to PDF.',
      icon: '📧',
      color: 'border-blue-500/30 hover:border-blue-500/60',
      fn: () => exportOutlookHTML(tasks, agents),
    },
    {
      id: 'word',
      label: 'Word Document (.doc)',
      desc: 'HTML-based report that opens in Microsoft Word. Includes styled tables for easy formatting.',
      icon: '📝',
      color: 'border-indigo-500/30 hover:border-indigo-500/60',
      fn: () => exportWord(tasks, agents),
    },
    {
      id: 'csv',
      label: 'CSV / PowerBI (.csv)',
      desc: 'Flat CSV with all SWAT fields + timestamped status history. Direct feed into PowerBI data model.',
      icon: '📋',
      color: 'border-amber-500/30 hover:border-amber-500/60',
      fn: () => exportToCSV(tasks, agents),
    },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {formats.map(f => (
          <button
            key={f.id}
            onClick={()=>run(f.id, f.fn)}
            disabled={!!exporting}
            className={`bg-slate-800/50 border rounded-xl p-5 text-left transition-all disabled:opacity-60 ${f.color}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5">{f.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                  {f.label}
                  {exporting===f.id && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin ml-1"/>}
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">{f.desc}</div>
              </div>
              <Download size={14} className="text-slate-500 flex-shrink-0 mt-0.5"/>
            </div>
          </button>
        ))}
      </div>

      {/* Per-agent CSV export */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Export by Agent</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {agents.map((agent: Agent) => {
            const count = tasks.filter((t: Task) => t.agentId === agent.id).length;
            return (
              <button key={agent.id} onClick={()=>exportToCSV(tasks.filter((t:Task)=>t.agentId===agent.id), agents)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-left transition-colors">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{backgroundColor:agent.color}}>{agent.initials}</div>
                <span className="text-slate-300 flex-1 truncate">{agent.name}</span>
                <span className="text-slate-500 flex-shrink-0">{count}</span>
                <Download size={10} className="text-slate-500 flex-shrink-0"/>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-forms
// ─────────────────────────────────────────────────────────────────────────────
function LockedNotice() {
  return (
    <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
      <Lock size={16}/>Admin access required for this action.
    </div>
  );
}

function AddAccountForm({ agents, onAdd, onClose }: any) {
  const [f, setF] = useState({ username:'', password:'', displayName:'', email:'', role:'agent' as UserRole, agentId:'', active:true });
  const submit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); onAdd(f); onClose(); };
  return (
    <form onSubmit={submit} className="bg-slate-800/80 border border-indigo-500/30 rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-center"><h3 className="text-sm font-semibold text-white">New Login Account</h3><button type="button" onClick={onClose}><X size={15} className="text-slate-400 hover:text-white"/></button></div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Display Name *" value={f.displayName} onChange={(e:any)=>setF({...f,displayName:e.target.value})}/>
        <Field label="Username *"     value={f.username}    onChange={(e:any)=>setF({...f,username:e.target.value})}/>
        <Field label="Password *"     value={f.password}    onChange={(e:any)=>setF({...f,password:e.target.value})} type="password"/>
        <Field label="Email"          value={f.email}       onChange={(e:any)=>setF({...f,email:e.target.value})}/>
        <div><label className="text-xs text-slate-400 mb-1 block">Role</label>
          <select value={f.role} onChange={e=>setF({...f,role:e.target.value as UserRole})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="agent">Agent</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option>
          </select>
        </div>
        <div><label className="text-xs text-slate-400 mb-1 block">Linked Agent</label>
          <select value={f.agentId} onChange={e=>setF({...f,agentId:e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="">— none —</option>
            {agents.map((a:Agent)=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"><Plus size={13}/>Add Account</button>
        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
      </div>
    </form>
  );
}

function EditAccountForm({ user, agents, onSave, onClose }: any) {
  const [f, setF] = useState({ displayName:user.displayName, email:user.email, role:user.role, agentId:user.agentId||'', active:user.active });
  const submit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); onSave(f); };
  return (
    <form onSubmit={submit} className="bg-slate-800/80 border border-indigo-500/30 rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-center"><h3 className="text-sm font-semibold text-white">Edit — {user.username}</h3><button type="button" onClick={onClose}><X size={15} className="text-slate-400 hover:text-white"/></button></div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Display Name" value={f.displayName} onChange={(e:any)=>setF({...f,displayName:e.target.value})}/>
        <Field label="Email"        value={f.email}       onChange={(e:any)=>setF({...f,email:e.target.value})}/>
        <div><label className="text-xs text-slate-400 mb-1 block">Role</label>
          <select value={f.role} onChange={e=>setF({...f,role:e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="agent">Agent</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option>
          </select>
        </div>
        <div><label className="text-xs text-slate-400 mb-1 block">Linked Agent</label>
          <select value={f.agentId} onChange={e=>setF({...f,agentId:e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="">— none —</option>
            {agents.map((a:Agent)=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-4">
          <input type="checkbox" id="active" checked={f.active} onChange={e=>setF({...f,active:e.target.checked})} className="accent-indigo-500"/>
          <label htmlFor="active" className="text-sm text-slate-300">Account active</label>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"><Save size={13}/>Save</button>
        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
      </div>
    </form>
  );
}

function ChangePasswordDialog({ name, onSave, onClose }: any) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  return (
    <div className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-5">
      <div className="flex justify-between items-center mb-3"><h3 className="text-sm font-semibold text-white">Change Password — {name}</h3><button onClick={onClose}><X size={15} className="text-slate-400 hover:text-white"/></button></div>
      <div className="relative mb-3">
        <input type={show?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} placeholder="New password" className="w-full pl-3 pr-9 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"/>
        <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show?<EyeOff size={14}/>:<Eye size={14}/>}</button>
      </div>
      <div className="flex gap-3">
        <button onClick={()=>{if(pw.length>=6)onSave(pw);}} disabled={pw.length<6} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"><Lock size={13}/>Update Password</button>
        <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function AddAgentForm({ onAdd, onClose }: any) {
  const [f, setF] = useState({ name:'', firstName:'', lastName:'', role:'Agent', initials:'', color: AGENT_COLORS[Math.floor(Math.random()*AGENT_COLORS.length)] });
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const initials = f.initials || `${f.firstName[0]||''}${f.lastName[0]||''}`.toUpperCase();
    onAdd({ ...f, initials, name: f.name || `${f.firstName} ${f.lastName}`.trim() });
    onClose();
  };
  return (
    <form onSubmit={submit} className="bg-slate-800/80 border border-indigo-500/30 rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-center"><h3 className="text-sm font-semibold text-white">New Agent Profile</h3><button type="button" onClick={onClose}><X size={15} className="text-slate-400 hover:text-white"/></button></div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name *" value={f.firstName} onChange={(e:any)=>setF({...f,firstName:e.target.value})}/>
        <Field label="Last Name *"  value={f.lastName}  onChange={(e:any)=>setF({...f,lastName:e.target.value})}/>
        <Field label="Full Name (override)" value={f.name} onChange={(e:any)=>setF({...f,name:e.target.value})}/>
        <Field label="Initials"     value={f.initials}  onChange={(e:any)=>setF({...f,initials:e.target.value})}/>
        <div><label className="text-xs text-slate-400 mb-1 block">Avatar Color</label>
          <div className="flex gap-1.5 flex-wrap">
            {AGENT_COLORS.slice(0,10).map(c=>(
              <button key={c} type="button" onClick={()=>setF({...f,color:c})} className={`w-6 h-6 rounded-full border-2 transition-all ${f.color===c?'border-white scale-110':'border-transparent'}`} style={{backgroundColor:c}}/>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"><Plus size={13}/>Add Agent</button>
        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
      </div>
    </form>
  );
}

function EditAgentForm({ agent, onSave, onClose }: any) {
  const [f, setF] = useState({ name:agent.name, firstName:agent.firstName, lastName:agent.lastName, role:agent.role, initials:agent.initials, color:agent.color });
  const submit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); onSave(f); };
  return (
    <form onSubmit={submit} className="bg-slate-800/80 border border-indigo-500/30 rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-center"><h3 className="text-sm font-semibold text-white">Edit Agent — {agent.name}</h3><button type="button" onClick={onClose}><X size={15} className="text-slate-400 hover:text-white"/></button></div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full Name"   value={f.name}      onChange={(e:any)=>setF({...f,name:e.target.value})}/>
        <Field label="First Name"  value={f.firstName} onChange={(e:any)=>setF({...f,firstName:e.target.value})}/>
        <Field label="Last Name"   value={f.lastName}  onChange={(e:any)=>setF({...f,lastName:e.target.value})}/>
        <Field label="Initials"    value={f.initials}  onChange={(e:any)=>setF({...f,initials:e.target.value})}/>
        <div><label className="text-xs text-slate-400 mb-1 block">Avatar Color</label>
          <div className="flex gap-1.5 flex-wrap">
            {AGENT_COLORS.slice(0,10).map(c=>(
              <button key={c} type="button" onClick={()=>setF({...f,color:c})} className={`w-6 h-6 rounded-full border-2 transition-all ${f.color===c?'border-white scale-110':'border-transparent'}`} style={{backgroundColor:c}}/>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"><Save size={13}/>Save</button>
        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
      </div>
    </form>
  );
}
