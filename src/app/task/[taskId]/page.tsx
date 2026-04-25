'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useAuthStore } from '@/lib/authStore';
import { TaskStatus } from '@/lib/types';
import { STATUS_BG, STATUS_COLORS, PRIORITY_COLORS, formatDate, formatDateTime } from '@/lib/utils';
import Header from '@/components/Header';
import { useT } from '@/lib/i18n';
import {
  ArrowLeft, CheckCircle2, Clock, PauseCircle, Circle,
  Calendar, User, BarChart2, FileText, Save, History, Info, Lock,
} from 'lucide-react';

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
  const t = useT();
  const { taskId } = useParams<{ taskId: string }>();
  const { tasks, agents, updateTaskStatus, updateTaskNotes, initialize } = useStore();
  const { currentUser } = useAuthStore();
  const router = useRouter();
  const [note, setNote] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'not_started', label: t('status.not_started'), icon: <Circle size={16} />,      desc: t('task.swatNotStarted') },
    { value: 'in_progress', label: t('status.in_progress'), icon: <Clock size={16} />,        desc: t('task.swatInProgress') },
    { value: 'on_hold',     label: t('status.on_hold'),     icon: <PauseCircle size={16} />,  desc: t('task.swatOnHold') },
    { value: 'completed',   label: t('status.completed'),   icon: <CheckCircle2 size={16} />, desc: t('task.swatCompleted') },
  ];

  useEffect(() => { initialize(); }, [initialize]);

  const task = tasks.find((tk) => tk.id === taskId);
  useEffect(() => {
    if (task) setTaskNotes(task.notes || '');
  }, [task?.id]);

  if (!task) return <div className="p-6 text-slate-400">Task not found.</div>;

  const agent = agents.find((a) => a.id === task.agentId);

  const canChangeStatus =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'supervisor' ||
    (currentUser?.role === 'agent' && currentUser?.agentId === task.agentId);

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (newStatus === task.status || !canChangeStatus) return;
    const changer = currentUser?.displayName || agent?.name || 'Unknown';
    updateTaskStatus(task.id, newStatus, changer, note.trim() || undefined);
    setNote('');
  };

  const handleSaveNotes = () => {
    updateTaskNotes(task.id, taskNotes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title={t('task.title')} subtitle={task.swatId || task.title} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-5">
          <ArrowLeft size={16} /> {t('task.back')}
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
          {/* ── Main column ── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Task info */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-3 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-indigo-300 text-sm font-bold">{task.swatId || task.title}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-xs ${STATUS_BG[task.status]}`}>
                      {t(`status.${task.status}` as Parameters<typeof t>[0])}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-xs capitalize ${PRIORITY_COLORS[task.priority]}`}>
                      {t(`priority.${task.priority}` as Parameters<typeof t>[0])}
                    </span>
                  </div>
                  {task.codif && (
                    <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      CODIF: {task.codif}
                    </span>
                  )}
                </div>
              </div>

              {task.description && (
                <div className="bg-slate-900/50 rounded-lg p-4 mb-5">
                  <div className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">{t('task.descTitle')}</div>
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">{task.description}</pre>
                </div>
              )}

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
                    <div className="text-slate-500 mb-0.5">{t('task.estHours')}</div>
                    <div className="text-white font-medium">{task.estimatedHours}h</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SWAT reference fields */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 sm:p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                <Info size={14} />
                {t('task.swatRefs')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <Field label="SWAT"       value={task.swatId} />
                <Field label="PROJET"     value={task.projet} />
                <Field label="AVION"      value={task.avion} />
                <Field label="Cahier"     value={task.cahier} />
                <Field label="RV"         value={task.rv} />
                <Field label="RFC"        value={task.rfc} />
                <Field label="GROUPE"     value={task.groupe} />
                <Field label="PERIODE"    value={task.periode} />
                <Field label="STATUT RV"  value={task.statutRv} />
                <Field label="Programme"  value={task.programme} />
                <Field label="Superviseur" value={task.superviseur} />
                <Field label="Position"   value={task.position} />
                <Field label="DT1"        value={task.dt1 !== undefined ? `${task.dt1} days` : null} />
                <Field label="DT2"        value={task.dt2 !== undefined ? `${task.dt2}` : null} />
                <Field label="Harmo Manuel" value={task.harmoManuel ? 'VRAI' : 'FAUX'} />
              </div>
            </div>

            {/* Status changer */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-semibold text-white">{t('task.updateStatus')}</h3>
                {!canChangeStatus && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                    <Lock size={12} />
                    {t('task.lockMsg')}
                  </div>
                )}
                {canChangeStatus && currentUser && (
                  <span className="text-xs text-slate-400">
                    {t('task.changingAs')} <span className="text-indigo-300 font-medium">{currentUser.displayName}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {STATUS_OPTIONS.map((opt) => {
                  const isActive = task.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      disabled={!canChangeStatus}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                        !canChangeStatus
                          ? 'opacity-40 cursor-not-allowed border-slate-700'
                          : isActive
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

              {canChangeStatus && (
                <textarea
                  placeholder={t('task.noteHint')}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              )}
            </div>

            {/* Notes */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 sm:p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                <FileText size={14} />
                {t('task.descNotes')}
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
                {saved ? t('task.saved') : t('task.saveNotes')}
              </button>
            </div>
          </div>

          {/* ── Side column ── */}
          <div className="space-y-5">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                <History size={14} />
                {t('task.statusHistory')}
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
                        {t(`status.${change.status}` as Parameters<typeof t>[0])}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1.5">{formatDateTime(change.timestamp)}</div>
                      <div className="text-[11px] text-slate-500">{t('general.by')} {change.changedBy}</div>
                      {change.note && (
                        <div className="text-[11px] text-slate-400 mt-1 italic">"{change.note}"</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('task.taskId')}</span>
                <span className="text-slate-400 font-mono text-[10px]">{task.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('task.created')}</span>
                <span className="text-slate-400">{formatDateTime(task.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('task.updated')}</span>
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
