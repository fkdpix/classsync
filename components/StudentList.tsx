
import React from 'react';
import { Plan, DayOfWeek } from '../types';
import { calculatePlanMetrics } from '../utils/dateHelpers';
import { User, Calendar, CheckCircle, Clock, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface Props {
  plans: Plan[];
  onSelect: (plan: Plan) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
}

const DAY_NAMES: Record<number, string> = {
  [DayOfWeek.SUNDAY]: 'Dom',
  [DayOfWeek.MONDAY]: 'Seg',
  [DayOfWeek.TUESDAY]: 'Ter',
  [DayOfWeek.WEDNESDAY]: 'Qua',
  [DayOfWeek.THURSDAY]: 'Qui',
  [DayOfWeek.FRIDAY]: 'Sex',
  [DayOfWeek.SATURDAY]: 'Sáb',
};

const StudentList: React.FC<Props> = ({ plans, onSelect, onDelete, onAddClick }) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Seus Alunos</h1>
          <p className="text-slate-600 font-bold">Gerencie presenças e cronogramas de {plans.length} {plans.length === 1 ? 'aluno' : 'alunos'}.</p>
        </div>
        <button 
          onClick={onAddClick}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-black px-6 py-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest text-sm"
        >
          <Plus size={20} /> Novo Aluno
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white border-4 border-dashed border-slate-200 rounded-3xl p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <User size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase">Nenhum aluno cadastrado</h3>
          <p className="text-slate-500 font-bold mt-2 mb-8">Comece adicionando seu primeiro aluno para gerenciar as aulas.</p>
          <button 
            onClick={onAddClick}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg uppercase tracking-widest"
          >
            Cadastrar agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => {
            const metrics = calculatePlanMetrics(plan);
            const progress = (metrics.totalAttended / (plan.totalContractedClasses || 1)) * 100;
            
            const scheduleSummary = plan.schedules
              .map(s => `${DAY_NAMES[s.dayOfWeek]} ${s.time}`)
              .join(', ');

            return (
              <div 
                key={plan.id}
                className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all group overflow-hidden flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      <User size={24} />
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
                      className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{plan.studentName}</h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                        {scheduleSummary}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-black uppercase tracking-widest mb-6">
                    <Calendar size={14} /> {plan.durationMonths} Meses
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-black uppercase">
                      <span className="text-slate-500">Progresso</span>
                      <span className="text-indigo-600">{metrics.totalAttended} / {plan.totalContractedClasses}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-1000" 
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Próxima</p>
                        <p className="text-sm font-black text-slate-900">{metrics.nextClassDate ? format(metrics.nextClassDate, 'dd/MM') : '--'}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Término</p>
                        <p className="text-sm font-black text-slate-900">{format(metrics.currentEndDate, 'dd/MM/yy')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => onSelect(plan)}
                  className="w-full py-4 bg-slate-50 border-t-2 border-slate-100 text-slate-900 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-all"
                >
                  Ver Detalhes <ChevronRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentList;
