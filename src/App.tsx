import React from 'react';
import { PlanProvider, usePlan } from './context/PlanContext';
import { Navbar } from './components/Navbar';
import { DailyHybridView } from './components/DailyHybridView';
import { TrailView } from './components/TrailView';
import { WeeklyView } from './components/WeeklyView';
import { DumpView } from './components/DumpView';
import { MonthlyView } from './components/MonthlyView';
import { SemesterView } from './components/SemesterView';
import { HabitsView } from './components/HabitsView';
import { MorningCheckinModal } from './components/MorningCheckinModal';
import { RespiteModal } from './components/RespiteModal';
import { TaskModal } from './components/TaskModal';
import { EraModal } from './components/EraModal';
import { TimeBlockModal } from './components/TimeBlockModal';

const MainContent: React.FC = () => {
  const { activeTab } = usePlan();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {activeTab === 'dump' && <DumpView />}
      {activeTab === 'daily' && <DailyHybridView />}
      {activeTab === 'weekly' && <WeeklyView />}
      {activeTab === 'monthly' && <MonthlyView />}
      {activeTab === 'semester' && <SemesterView />}
      {activeTab === 'habits' && <HabitsView />}
      {activeTab === 'trail' && <TrailView />}
    </main>
  );
};

export default function App() {
  return (
    <PlanProvider>
      <div className="min-h-screen bg-[#FAF8F5] text-[#242220] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1">
          <MainContent />
        </div>

        {/* Global Dialogs and Modals */}
        <MorningCheckinModal />
        <RespiteModal />
        <TaskModal />
        <EraModal />
        <TimeBlockModal />
      </div>
    </PlanProvider>
  );
}
