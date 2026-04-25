'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { AGENTS } from '@/lib/agents';
import { TaskStatus } from '@/lib/types';
import { STATUS_LABELS, STATUS_BG, STATUS_COLORS, PRIORITY_COLORS, formatDate, formatDateTime } from '@/lib/utils';
import Header from '@/components/Header';
import {
  ArrowLeft, CheckCircle2, Clock, PauseCircle, Circle,
  Calendar, User, BarChart2, FileText, Save, History, Info,
} from 'lucide-react';

const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'not_started', label: 'Not Started',  icon: <Circle size={16} />,       desc: 'Task has not been started yet' },
  { value: 'in_progress', label: 'In Progress',  icon: <Clock size={16} />,         desc: 'Currently being worked on' },
  { value: 'on_hold',     label: 'On Hold',       icon: <PauseCircle size={16} />,   desc: 'Paused — waiting for input' },
  { value: 'completed',   label: 'Completed',     icon: <CheckCircle2 size={16} />,  desc: 'Task finished successfully' },
];

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-xs text-slate-300 font-medium">{String(value)}</div>
    </div>
  );
}

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { tasks, updateTaskStatus, updateTaskNotes, initialize } = useStore();
  const router = useRouter();
  const [note, setNote] = useState('');
  const [changedBy, setChangedBy] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { initialize(); }, [initialize]);

  const task = tasks.find((t) => t.id === taskId);
  useEffect(() => {
    if (task) setTaskNotes(task.notes || '');
  }, [task?.id]);

  if (!task) return <div className="p-6 text-slate-400">Task not found.</div>;

  const agent = AGENTS.find((a) => a.id === task.agentId);

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (newStatus === task.status) return;
    updateTaskStatus(task.id, newStatus, changedBy.trim() || agent?.name || 'Unknown', note.trim() || undefined);
    setNote('');
  };

  const handleSaveNotes = () => {
    updateTaskNotes(task.id, taskNotes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Task Detail" subtitle={task.swatId || task.title} />
      <div className="flex-1 overflow-y-auto p-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-5">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Main column ── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Task info */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-indigo-300 text-sm font-bold">{task.swatId || task.title}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-xs ${STATUS_BG[task.status]}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-xs capitalize ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.codif && (
                    <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      CODIF: {task.codif}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div className="bg-slate-900/50 rounded-lg p-4 mb-5">
                  <div className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">Commentaire</div>
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">{task.description}</pre>
                </div>
              )}

              {/* Core fields grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex items-start gap-2">
                  <User size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-slate-500 mb-0.5">Responsable</div>
                    <div className="text-white font-medium">{agent?.name}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-slate-500 mb-0.5">DATE RV</div>
                    <div className="text-white font-medium">{task.dayName}, {formatDate(task.date)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BarChart2 size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-slate-500 mb-0.5">Est. Hours</div>
                    <div className="text-white font-medium">{task.estimatedHours}h</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SWAT reference fields */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                <Info size={14} />
                SWAT References
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <Field label="SWAT" value={task.swatId} />
                <Field label="PROJET" value={task.projet} />
                <Field label="AVION" value={task.avion} />
                <Field label="Cahier" value={task.cahier} />
                <Field label="RV" value={task.rv} />
                <Field label="RFC" value={task.rfc} />
                <Field label="GROUPE" value={task.groupe} />
                <Field label="PERIODE" value={task.periode} />
                <Field label="STATUT RV" value={task.statutRv} />
                <Field label="Programme" value={task.programme} />
                <Field label="Superviseur" value={task.superviseur} />
                <Field label="Position" value={task.position} />
                <Field label="DT1" value={task.dt1 !== undefined ? `${task.dt1} days` : null} />
                <Field label="DT2" value={task.dt2 !== undefined ? `${task.dt2}` : null} />
                <Field label="Harmo Manuel" value={task.harmoManuel ? 'VRAI' : 'FAUX'} />
              </div>
            </div>

            {/* Status changer */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Update Status</h3>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {STATUS_OPTIONS.map((opt) => {
                  const isActive = task.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-slate-700 hover:border-slate-500 hover:bg-slate-700/30'
                      }`}
                    >
                      <span style={{ color: STATUS_COLORS[opt.value] }} className="mt-0.5">{opt.icon}</span>
                      <div>
                        <div className={`text-sm font-medium ${isActive ? 'text-indigo-300' : 'text-white'}`}>{opt.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                      </div>
                      {isActive && <CheckCircle2 size={14} className="text-indigo-400 ml-auto flex-shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Changed by (your name)"
                  value={changedBy}
                  onChange={(e) => setChangedBy(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <textarea
                  placeholder="Add a note about this status change (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Notes — SWAT DESCR. */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                <FileText size={14} />
                SWAT DESCR. / Notes
              </h3>
              <textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="SWAT description or additional notes..."
                rows={4}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none mb-3"
              />
              <button
                onClick={handleSaveNotes}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <Save size={14} />
                {saved ? 'Saved!' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* ── Side column ── */}
          <div className="space-y-5">
            {/* Status history */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                <History size={14} />
                Status History
              </h3>
              <div className="space-y-3">
                {[...task.statusHistory].reverse().map((change, i) => (
                  <div key={change.id} className="relative pl-5">
                    {i < task.statusHistory.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-0 w-px bg-slate-700" />
                    )}
                    <div
                      className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800"
                      style={{ backgroundColor: STATUS_COLORS[change.status] }}
                    />
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_BG[change.status]}`}>
                        {STATUS_LABELS[change.status]}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1.5">{formatDateTime(change.timestamp)}</div>
                      <div className="text-[11px] text-slate-500">by {change.changedBy}</div>
                      {change.note && (
                        <div className="text-[11px] text-slate-400 mt-1 italic">"{change.note}"</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Task ID</span>
                <span className="text-slate-400 font-mono text-[10px]">{task.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-400">{formatDateTime(task.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Updated</span>
                <span className="text-slate-400">{formatDateTime(task.updatedAt)}</span>
              </div>
              {task.prioriteNum !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Priorité #</span>
                  <span className="text-slate-400">{task.prioriteNum}</span>
                </div>
              )}
              {task.pctProd !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-500">%PROD</span>
                  <span className="text-slate-400">{task.pctProd}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
