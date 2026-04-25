'use client';

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, LayoutDashboard, Users, Settings, BarChart2, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';

const STEPS = [
  {
    icon: LayoutDashboard,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/20',
    title: 'Welcome to Agent Interface',
    body: "This platform helps you monitor and manage your team's weekly tasks in real time. You can track performance, update task statuses, and export reports — all from one place.",
  },
  {
    icon: BarChart2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    title: 'Team Dashboard',
    body: 'The main dashboard shows team-wide performance at a glance. Charts display task completion rates, status breakdowns, and weekly trends. Use the stats cards for quick KPI overview.',
  },
  {
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    title: 'Agent View',
    body: "Navigate to the Agents page and select an agent from the dropdown. You'll see their full weekly task list grouped by day — with task count and status summary per day. Click any day row to see its tasks.",
  },
  {
    icon: CheckCircle2,
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    title: 'Task Detail & Status Updates',
    body: "Click any task to open its detail page. You can change its status between Not Started, In Progress, On Hold, and Completed. Every status change is timestamped and recorded in the history log.",
  },
  {
    icon: Settings,
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    title: 'Admin Panel',
    body: 'The Admin Panel lets you import tasks from an Excel file, manage existing tasks, and export data as CSV — fully compatible with PowerBI and Excel dashboards. Access it from the sidebar.',
  },
];

export default function OnboardingTour() {
  const [step, setStep] = useState(0);
  const { hasSeenOnboarding, markOnboardingDone } = useStore();

  if (hasSeenOnboarding) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Close */}
        <button
          onClick={markOnboardingDone}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="px-8 py-8">
          {/* Step indicator */}
          <div className="flex gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i <= step ? 'bg-indigo-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl ${current.bg} flex items-center justify-center mb-5`}>
            <Icon size={28} className={current.color} />
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold text-white mb-3">{current.title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{current.body}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-800">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <span className="text-xs text-slate-600">
            {step + 1} / {STEPS.length}
          </span>
          {isLast ? (
            <button
              onClick={markOnboardingDone}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Get Started
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
