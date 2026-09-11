import React from 'react';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';
import { ActiveTab, EnergyLevel } from '../types';
import { 
  Compass, 
  CalendarDays, 
  CalendarRange, 
  Calendar,
  Columns3,
  CheckSquare2,
  Plus, 
  Wind, 
  BatteryMedium, 
  Sparkles,
  Heart,
  Inbox,
  LogOut,
  User
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, userProfile, logout } = useAuth();
  const {
    activeTab,
    setActiveTab,
    dailyCheckin,
    tasks,
    setIsCheckinOpen,
    setIsRespiteBoxOpen,
    setIsTaskModalOpen,
    setIsEraModalOpen,
    respiteTasks,
    setEditingTask,
    setEditingEra,
    setPreselectedMilestoneId,
  } = usePlan();

  const getEnergyBadge = (level: EnergyLevel) => {
    switch (level) {
      case 'high':
        return {
          label: 'Energia Alta',
          desc: 'Foco pleno e impacto',
          bg: 'bg-[#EAF0EB] text-[#2C4835] border-[#C2D6C7]',
          dot: 'bg-[#407350]',
        };
      case 'medium':
        return {
          label: 'Energia Equilibrada',
          desc: 'Ritmo constante (3 pilares)',
          bg: 'bg-[#FBF1E6] text-[#7A4B1A] border-[#ECD5BE]',
          dot: 'bg-[#D97D29]',
        };
      case 'low_respite':
        return {
          label: 'Modo Resguardo',
          desc: 'Autocuidado e tarefas leves',
          bg: 'bg-[#F4EEF8] text-[#553C68] border-[#DDD0E6]',
          dot: 'bg-[#835CA3]',
        };
    }
  };

  const energyInfo = getEnergyBadge(dailyCheckin.energyLevel);

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const dumpTasksCount = tasks.filter(
    (t) => (!t.dueDate || t.dueDate.trim() === '') && t.status !== 'respite_moved' && t.status !== 'completed'
  ).length;

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dump', label: 'Despejo', icon: Inbox },
    { id: 'daily', label: 'Visão Diária', icon: CalendarDays },
    { id: 'weekly', label: 'Visão Semanal', icon: CalendarRange },
    { id: 'monthly', label: 'Visão Mensal', icon: Calendar },
    { id: 'semester', label: 'Visão Semestral', icon: Columns3 },
    { id: 'habits', label: 'Hábitos', icon: CheckSquare2 },
    { id: 'trail', label: 'Trilha dos Sonhos', icon: Compass },
  ];

  const handleNewTaskClick = () => {
    setEditingTask(null);
    setPreselectedMilestoneId(null);
    setIsTaskModalOpen(true);
  };

  const handleNewEraClick = () => {
    setEditingEra(null);
    setIsEraModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EBE6DD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between py-3.5 border-b border-[#F0EBE2]">
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#2D332F] text-[#FAF8F5] flex items-center justify-center font-serif text-lg font-semibold tracking-tight shadow-xs">
              p.
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-xl font-semibold tracking-tight text-[#242220]">
                  plan.me
                </span>
              </div>
              <p className="text-xs text-[#7B746D] capitalize">{capitalizedDate}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Energy Pill Button */}
            <button
              id="header-energy-button"
              onClick={() => setIsCheckinOpen(true)}
              title="Ajustar nível de energia e intenção"
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:shadow-xs cursor-pointer ${energyInfo.bg}`}
            >
              <span className={`w-2 h-2 rounded-full ${energyInfo.dot}`} />
              <div className="text-left">
                <div className="font-semibold leading-tight">{energyInfo.label}</div>
              </div>
              <BatteryMedium className="w-3.5 h-3.5 opacity-70 ml-0.5" />
            </button>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1.5 pl-1 border-l border-[#EBE6DD]">
              <button
                id="header-new-task-button"
                onClick={handleNewTaskClick}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#2D332F] text-[#FAF8F5] text-xs font-medium hover:bg-[#1C201E] transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Tarefa</span>
              </button>
              
              <button
                id="header-new-era-button"
                onClick={handleNewEraClick}
                title="Cadastrar novo Sonho"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#DDD6CB] bg-[#FFFFFF] text-[#403B36] text-xs font-medium hover:bg-[#F8F6F1] transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B85D3B]" />
                <span className="hidden md:inline">Novo Sonho</span>
              </button>
            </div>

            {/* User Account / Profile */}
            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-[#EBE6DD]">
                <div
                  className="flex items-center space-x-2 py-1 px-2 rounded-lg bg-[#F5EFEB] border border-[#E8DFC8] text-xs text-[#242220]"
                  title={user.email || ''}
                >
                  <div className="w-6 h-6 rounded-full bg-[#2D332F] text-[#FAF8F5] flex items-center justify-center font-serif text-[11px] font-semibold">
                    {(userProfile?.name || user.displayName || 'LS')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium max-w-[110px] truncate">
                    {userProfile?.name || user.displayName || 'Lais Siqueira'}
                  </span>
                </div>

                <button
                  id="header-logout-button"
                  onClick={logout}
                  title="Sair da conta"
                  className="p-1.5 rounded-lg border border-[#DDD6CB] bg-[#FFFFFF] text-[#7A736A] hover:text-[#B85D3B] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between py-2 overflow-x-auto no-scrollbar">
          <nav className="flex space-x-1 sm:space-x-2" aria-label="Abas">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#EFEAE1] text-[#242220] shadow-2xs font-semibold'
                      : 'text-[#6C665F] hover:text-[#242220] hover:bg-[#F5F1E9]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#385A48]' : 'text-[#8A837A]'}`} />
                  <span>{item.label}</span>
                  {item.id === 'dump' && dumpTasksCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#E5D7C2] text-[#69431A] text-[10px] font-mono font-semibold">
                      {dumpTasksCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center space-x-2 text-xs text-[#8A837A]">
            <Heart className="w-3.5 h-3.5 text-[#B85D3B]" />
            <span>Mais clareza, menos esforço.</span>
          </div>
        </div>
      </div>
    </header>
  );
};
