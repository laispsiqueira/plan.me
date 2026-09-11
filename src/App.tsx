import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlanProvider, usePlan } from './context/PlanContext';
import { AuthView } from './components/AuthView';
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
import { Loader2 } from 'lucide-react';

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

const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#2D332F] text-[#FAF8F5] flex items-center justify-center font-serif text-xl font-semibold mb-4 shadow-sm animate-pulse">
          p.
        </div>
        <div className="flex items-center space-x-2 text-[#5A544E] text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-[#385A48]" />
          <span>Sincronizando seu espaço...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

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
};

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
