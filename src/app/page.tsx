'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getWeeklyStats } from '@/lib/utils';
import Header from '@/components/Header';
import StatsCards from '@/components/dashboard/StatsCards';
import AgentPerformanceChart from '@/components/dashboard/AgentPerformanceChart';
import StatusDistributionChart from '@/components/dashboard/StatusDistributionChart';
import WeeklyTrendChart from '@/components/dashboard/WeeklyTrendChart';
import TeamTable from '@/components/dashboard/TeamTable';
import OnboardingTour from '@/components/OnboardingTour';

export default function DashboardPage() {
  const { tasks, initialize, resetOnboarding } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const stats = getWeeklyStats(tasks);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <>
      <OnboardingTour />
      <div className="flex flex-col h-full overflow-hidden">
        <Header
          title="Team Dashboard"
          subtitle={`Performance overview — ${today}`}
          onHelp={resetOnboarding}
        />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <StatsCards tasks={tasks} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AgentPerformanceChart stats={stats} />
            </div>
            <StatusDistributionChart tasks={tasks} />
          </div>

          <WeeklyTrendChart tasks={tasks} />

          <TeamTable stats={stats} />
        </div>
      </div>
    </>
  );
}
