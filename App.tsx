
import React, { useState, useEffect, useCallback } from 'react';
import { Plan, AttendanceRecord } from './types';
import PlanCreator from './components/PlanCreator';
import PlanDashboard from './components/PlanDashboard';
import StudentList from './components/StudentList';
import SyncModal from './components/SyncModal';
import { CalendarRange, ChevronLeft, Cloud, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { getSyncConfig, pullFromCloud, pushToCloud } from './services/db';
import { format } from 'date-fns';

const App: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Carregar dados iniciais (Local + Nuvem)
  useEffect(() => {
    const loadData = async () => {
      // 1. Carregar local primeiro para rapidez
      const saved = localStorage.getItem('class_sync_plans');
      if (saved) {
        try {
          setPlans(JSON.parse(saved));
        } catch (e) { console.error(e); }
      }

      // 2. Se houver nuvem, tentar puxar e sobrescrever o local se houver algo novo
      const config = getSyncConfig();
      if (config) {
        setSyncStatus('syncing');
        try {
          const cloudPlans = await pullFromCloud(config);
          if (cloudPlans) {
            setPlans(cloudPlans);
            setSyncStatus('synced');
            setLastSyncTime(format(new Date(), 'HH:mm:ss'));
          }
        } catch (e) {
          console.error("Cloud pull error", e);
          setSyncStatus('error');
        }
      }
    };
    loadData();
  }, []);

  // Salvar sempre que plans mudar (com Debounce para evitar excesso de requisições)
  useEffect(() => {
    localStorage.setItem('class_sync_plans', JSON.stringify(plans));
    
    const config = getSyncConfig();
    if (config && plans.length > 0) {
      setSyncStatus('syncing');
      const timer = setTimeout(async () => {
        try {
          await pushToCloud(plans, config);
          setSyncStatus('synced');
          setLastSyncTime(format(new Date(), 'HH:mm:ss'));
        } catch (e) {
          console.error("Cloud push error", e);
          setSyncStatus('error');
        }
      }, 1500); // 1.5 segundos de espera após parar de mexer
      return () => clearTimeout(timer);
    }
  }, [plans]);

  const activePlan = plans.find(p => p.id === selectedPlanId) || null;

  const handleCreatePlan = (newPlan: Plan) => {
    setPlans(prev => [...prev, newPlan]);
    setIsCreating(false);
    setSelectedPlanId(newPlan.id);
  };

  const handleDeletePlan = (id: string) => {
    if (confirm("Deseja realmente excluir este aluno e todo o seu histórico?")) {
      setPlans(prev => prev.filter(p => p.id !== id));
      if (selectedPlanId === id) setSelectedPlanId(null);
    }
  };

  const handleUpdateHistory = (record: AttendanceRecord) => {
    if (!selectedPlanId) return;
    setPlans(prev => prev.map(plan => {
      if (plan.id !== selectedPlanId) return plan;
      const existingIdx = plan.history.findIndex(h => h.date === record.date);
      let newHistory = [...plan.history];
      if (record.status === 'pending') {
        newHistory = newHistory.filter(h => h.date !== record.date);
      } else if (existingIdx > -1) {
        newHistory[existingIdx] = record;
      } else {
        newHistory.push(record);
      }
      return { ...plan, history: newHistory };
    }));
  };

  const handleUpdatePlan = (updatedPlan: Plan) => {
    setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
  };

  const triggerManualRefresh = async () => {
    const config = getSyncConfig();
    if (!config) return setIsSyncModalOpen(true);
    
    setSyncStatus('syncing');
    try {
      const cloudPlans = await pullFromCloud(config);
      if (cloudPlans) {
        setPlans(cloudPlans);
        setSyncStatus('synced');
        setLastSyncTime(format(new Date(), 'HH:mm:ss'));
      }
    } catch (e) {
      setSyncStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200">
      <nav className="bg-white border-b-2 border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => { setSelectedPlanId(null); setIsCreating(false); }}
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <CalendarRange size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter hidden sm:block">
              Class<span className="text-indigo-600">Sync</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <button 
                onClick={() => setIsSyncModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${
                  syncStatus === 'synced' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                  syncStatus === 'syncing' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                  syncStatus === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                  'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : 
                 syncStatus === 'synced' ? <Check size={14} /> : 
                 syncStatus === 'error' ? <AlertCircle size={14} /> : <Cloud size={14} />}
                
                <span className="hidden md:inline">{
                  syncStatus === 'synced' ? 'Nuvem Ativa' :
                  syncStatus === 'syncing' ? 'Salvando...' :
                  syncStatus === 'error' ? 'Erro de Sync' : 'Ativar Nuvem'
                }</span>
              </button>
              {lastSyncTime && (
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1 pr-1">
                  Último Sync: {lastSyncTime}
                </span>
              )}
            </div>

            {(activePlan || isCreating) && (
              <button 
                onClick={() => { setSelectedPlanId(null); setIsCreating(false); }}
                className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest border-2 border-slate-100 px-4 py-2 rounded-xl hover:bg-indigo-50"
              >
                <ChevronLeft size={16} /> Voltar
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {isCreating ? (
          <div className="animate-in fade-in duration-500">
            <PlanCreator onCreate={handleCreatePlan} />
          </div>
        ) : activePlan ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Painel do Aluno</h1>
              <div className="h-1 flex-1 bg-slate-200 rounded-full"></div>
            </div>
            <PlanDashboard 
              plan={activePlan} 
              onUpdateHistory={handleUpdateHistory} 
              onUpdatePlan={handleUpdatePlan}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            <StudentList 
              plans={plans} 
              onSelect={(p) => setSelectedPlanId(p.id)} 
              onDelete={handleDeletePlan}
              onAddClick={() => setIsCreating(true)}
            />
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 mt-12 border-t-2 border-slate-200 text-center">
        <p className="text-slate-900 text-xs font-black uppercase tracking-[0.2em] opacity-50">
          © {new Date().getFullYear()} ClassSync. Dados protegidos localmente e na nuvem.
        </p>
      </footer>

      <SyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
        onConfigUpdated={() => {
          triggerManualRefresh();
        }}
      />
    </div>
  );
};

export default App;
