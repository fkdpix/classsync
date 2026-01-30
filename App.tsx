
import React, { useState, useEffect, useCallback } from 'react';
import { Plan, AttendanceRecord } from './types';
import PlanCreator from './components/PlanCreator';
import PlanDashboard from './components/PlanDashboard';
import StudentList from './components/StudentList';
import SyncModal from './components/SyncModal';
import { CalendarRange, ChevronLeft, Cloud, RefreshCw, AlertCircle, Check, Trash2, AlertTriangle, X } from 'lucide-react';
import { getSyncConfig, pullFromCloud, pushToCloud } from './services/db';
import { format } from 'date-fns';

const App: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  // Estado para controle da exclusão customizada
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const saved = localStorage.getItem('class_sync_plans');
      if (saved) {
        try {
          setPlans(JSON.parse(saved));
        } catch (e) { console.error(e); }
      }

      const config = getSyncConfig();
      if (config) {
        setSyncStatus('syncing');
        try {
          const cloudPlans = await pullFromCloud(config);
          if (cloudPlans) {
            setPlans(cloudPlans);
            setSyncStatus('synced');
            setLastSyncTime(format(new Date(), 'HH:mm:ss'));
          } else {
            setSyncStatus('synced');
          }
        } catch (e) {
          setSyncStatus('error');
        }
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('class_sync_plans', JSON.stringify(plans));
    
    const config = getSyncConfig();
    if (config) {
      setSyncStatus('syncing');
      const timer = setTimeout(async () => {
        try {
          await pushToCloud(plans, config);
          setSyncStatus('synced');
          setLastSyncTime(format(new Date(), 'HH:mm:ss'));
        } catch (e) {
          setSyncStatus('error');
        }
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [plans]);

  const activePlan = plans.find(p => p.id === selectedPlanId) || null;

  const handleCreatePlan = (newPlan: Plan) => {
    setPlans(prev => [...prev, newPlan]);
    setIsCreating(false);
    setSelectedPlanId(newPlan.id);
  };

  const initiateDelete = (id: string) => {
    const plan = plans.find(p => p.id === id);
    if (plan) {
      setPlanToDelete(plan);
    }
  };

  const confirmDelete = () => {
    if (!planToDelete) return;
    
    const id = planToDelete.id;
    setPlans(prev => prev.filter(p => p.id !== id));
    
    if (selectedPlanId === id) {
      setSelectedPlanId(null);
    }
    
    setPlanToDelete(null);
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
      }
      setSyncStatus('synced');
      setLastSyncTime(format(new Date(), 'HH:mm:ss'));
    } catch (e) {
      setSyncStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200 safe-area-padding">
      <nav className="bg-white border-b-2 border-slate-200 sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => { setSelectedPlanId(null); setIsCreating(false); }}
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <CalendarRange size={20} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter hidden xs:block">
              Class<span className="text-indigo-600">Sync</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <button 
                onClick={() => setIsSyncModalOpen(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all font-black text-[9px] uppercase tracking-widest ${
                  syncStatus === 'synced' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                  syncStatus === 'syncing' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                  syncStatus === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                  'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {syncStatus === 'syncing' ? <RefreshCw size={12} className="animate-spin" /> : 
                 syncStatus === 'synced' ? <Check size={12} /> : 
                 syncStatus === 'error' ? <AlertCircle size={12} /> : <Cloud size={12} />}
                
                <span className="hidden sm:inline">{
                  syncStatus === 'synced' ? 'Nuvem OK' :
                  syncStatus === 'syncing' ? 'Salvando' :
                  syncStatus === 'error' ? 'Erro Sync' : 'Nuvem'
                }</span>
              </button>
            </div>

            {(activePlan || isCreating) && (
              <button 
                onClick={() => { setSelectedPlanId(null); setIsCreating(false); }}
                className="flex items-center gap-2 text-[9px] font-black text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest border-2 border-slate-100 px-3 py-2 rounded-xl hover:bg-indigo-50"
              >
                <ChevronLeft size={14} /> <span className="hidden xs:inline">Voltar</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isCreating ? (
          <div className="animate-in fade-in duration-500">
            <PlanCreator onCreate={handleCreatePlan} />
          </div>
        ) : activePlan ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
            <PlanDashboard 
              plan={activePlan} 
              onUpdateHistory={handleUpdateHistory} 
              onUpdatePlan={handleUpdatePlan}
              onDeletePlan={initiateDelete}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            <StudentList 
              plans={plans} 
              onSelect={(p) => setSelectedPlanId(p.id)} 
              onDelete={initiateDelete}
              onAddClick={() => setIsCreating(true)}
            />
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 mt-12 border-t-2 border-slate-200 text-center pb-12 no-print">
        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
          ClassSync v1.1 • PWA Ready
        </p>
      </footer>

      {/* Modal de Sincronização */}
      <SyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
        onConfigUpdated={() => {
          triggerManualRefresh();
        }}
      />

      {/* Modal de Confirmação de Exclusão Customizado */}
      {planToDelete && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4 no-print animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-t-8 border-rose-500">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle size={32} />
              </div>
            </div>
            
            <h3 className="text-xl font-black text-slate-900 text-center uppercase tracking-tighter mb-2">Excluir Registro?</h3>
            <p className="text-slate-600 text-sm text-center font-bold mb-8">
              Você está prestes a apagar permanentemente o histórico de <span className="text-rose-600 font-black">{planToDelete.studentName}</span>. Esta ação não pode ser desfeita.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Confirmar Exclusão
              </button>
              <button 
                onClick={() => setPlanToDelete(null)}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
              >
                Manter Aluno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
