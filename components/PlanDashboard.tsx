
import React, { useMemo, useState } from 'react';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  CalendarDays,
  Settings,
  BarChart3,
  X,
  Trash2,
  Plus,
  MessageSquare,
  AlertTriangle,
  History,
  LayoutList,
  UserCheck,
  UserX,
  RotateCcw
} from 'lucide-react';
import { Plan, AttendanceRecord, DayOfWeek, ClassSchedule } from '../types';
import { calculatePlanMetrics, generateClassList, calculateMonthlyStats } from '../utils/dateHelpers';

interface Props {
  plan: Plan;
  onUpdateHistory: (record: AttendanceRecord) => void;
  onUpdatePlan: (plan: Plan) => void;
}

const DAYS_OPTIONS = [
  { label: 'Segunda', value: DayOfWeek.MONDAY },
  { label: 'Terça', value: DayOfWeek.TUESDAY },
  { label: 'Quarta', value: DayOfWeek.WEDNESDAY },
  { label: 'Quinta', value: DayOfWeek.THURSDAY },
  { label: 'Sexta', value: DayOfWeek.FRIDAY },
  { label: 'Sábado', value: DayOfWeek.SATURDAY },
  { label: 'Domingo', value: DayOfWeek.SUNDAY },
];

const PlanDashboard: React.FC<Props> = ({ plan, onUpdateHistory, onUpdatePlan }) => {
  const metrics = useMemo(() => calculatePlanMetrics(plan), [plan]);
  const classList = useMemo(() => generateClassList(plan), [plan]);
  const monthlyStats = useMemo(() => calculateMonthlyStats(plan.history), [plan.history]);

  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [tempSchedules, setTempSchedules] = useState<ClassSchedule[]>(plan.schedules);
  
  const [cancellationModal, setCancellationModal] = useState<{date: Date, time: string} | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const getRecord = (date: Date) => {
    const iso = format(date, 'yyyy-MM-dd');
    return plan.history.find(h => h.date === iso);
  };

  const markAttendance = (date: Date, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const iso = format(date, 'yyyy-MM-dd');
    const scheduleForDay = plan.schedules.find(s => s.dayOfWeek === date.getDay());
    onUpdateHistory({ 
      date: iso, 
      time: scheduleForDay?.time || '--:--',
      status: 'attended' 
    });
  };

  const openCancelModal = (date: Date, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const record = getRecord(date);
    const scheduleForDay = plan.schedules.find(s => s.dayOfWeek === date.getDay());
    setCancellationModal({ 
      date, 
      time: record?.time || scheduleForDay?.time || '--:--' 
    });
    setCancelReason('');
  };

  const resetStatus = (date: Date, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const iso = format(date, 'yyyy-MM-dd');
    const scheduleForDay = plan.schedules.find(s => s.dayOfWeek === date.getDay());
    onUpdateHistory({ 
      date: iso, 
      time: scheduleForDay?.time || '--:--',
      status: 'pending' 
    });
  };

  const confirmCancellation = () => {
    if (!cancellationModal) return;
    const iso = format(cancellationModal.date, 'yyyy-MM-dd');
    onUpdateHistory({ 
      date: iso, 
      time: cancellationModal.time,
      status: 'cancelled', 
      reason: cancelReason || 'Não informado'
    });
    setCancellationModal(null);
  };

  const handleSaveSchedule = () => {
    onUpdatePlan({ ...plan, schedules: tempSchedules });
    setEditingSchedule(false);
  };

  const filteredClasses = useMemo(() => {
    if (activeTab === 'all') return classList;
    return classList.filter(date => {
      const record = getRecord(date);
      return !record || record.status === 'pending';
    });
  }, [classList, activeTab, plan.history]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center shadow-inner">
            <User size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{plan.studentName}</h2>
            <p className="text-slate-800 text-sm flex items-center gap-1 font-bold">
              <Calendar size={14} className="text-indigo-600" /> Plano de {plan.durationMonths} meses
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-300 text-center">
            <p className="text-[10px] uppercase font-black text-slate-600">Início</p>
            <p className="font-bold text-slate-900">{format(parseISO(plan.startDate), 'dd/MM/yyyy')}</p>
          </div>
          <div className="bg-indigo-100 px-4 py-2 rounded-xl border border-indigo-200 text-center">
            <p className="text-[10px] uppercase font-black text-indigo-700">Término Projetado</p>
            <p className="font-bold text-indigo-900">{format(metrics.currentEndDate, 'dd/MM/yyyy')}</p>
          </div>
          <button 
            onClick={() => { setTempSchedules(plan.schedules); setEditingSchedule(true); }}
            className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm font-black active:scale-95"
          >
            <Settings size={18} /> Alterar Dias
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<CalendarDays className="text-blue-700" />} label="Total Previsto" value={metrics.totalPlannedClasses + metrics.totalCancelled} color="blue" />
        <StatCard icon={<CheckCircle className="text-emerald-700" />} label="Presenças" value={metrics.totalAttended} color="emerald" />
        <StatCard icon={<XCircle className="text-rose-700" />} label="Faltas / Reposições" value={metrics.totalCancelled} color="rose" />
        <StatCard icon={<Clock className="text-amber-700" />} label="Próxima Aula" value={metrics.nextClassDate ? format(metrics.nextClassDate, 'dd/MM') : '--'} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class List with Tabs */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden flex flex-col">
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'pending' ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutList size={16} /> Cronograma Pendente
            </button>
            <button 
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'all' ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}
            >
              <History size={16} /> Todas as Aulas
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm border-b border-slate-300">
                <tr className="text-slate-800 text-[10px] uppercase tracking-wider font-black">
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Dia / Horário</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClasses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold italic">Nenhuma aula para exibir nesta aba.</td>
                  </tr>
                )}
                {filteredClasses.map((date, idx) => {
                  const record = getRecord(date);
                  const status = record?.status || 'pending';
                  const schedule = plan.schedules.find(s => s.dayOfWeek === date.getDay());
                  const isFuture = isBefore(startOfDay(new Date()), startOfDay(date));
                  const displayTime = record?.time || schedule?.time || '--:--';

                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50 transition-colors group ${status === 'pending' && !isFuture ? 'bg-amber-50' : 'bg-white'}`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">{format(date, 'dd/MM/yyyy')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 text-sm font-bold capitalize">{format(date, 'EEEE', { locale: ptBR })}</div>
                        <div className="text-xs text-indigo-700 font-black">{displayTime}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={status} reason={record?.reason} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {status === 'pending' ? (
                            <>
                              <button 
                                onClick={(e) => markAttendance(date, e)}
                                title="Marcar Presença"
                                className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              >
                                <UserCheck size={18} />
                              </button>
                              <button 
                                onClick={(e) => openCancelModal(date, e)}
                                title="Registrar Falta"
                                className="p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                              >
                                <UserX size={18} />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={(e) => resetStatus(date, e)}
                              title="Resetar para Pendente"
                              className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            >
                              <RotateCcw size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Statistics */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-300">
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <BarChart3 size={18} className="text-indigo-600" /> Presenças Mensais
            </h3>
            <div className="space-y-4">
              {monthlyStats.length === 0 && <p className="text-slate-800 text-sm py-4 text-center italic font-bold">Sem registros ainda</p>}
              {monthlyStats.map((stat, i) => {
                const total = stat.attended + stat.cancelled;
                const attendedPct = total > 0 ? (stat.attended / total) * 100 : 0;
                
                return (
                  <div key={i} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-sm font-black text-slate-900 capitalize">{stat.monthYear}</div>
                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                      <div className="h-full bg-emerald-600" style={{ width: `${attendedPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                      <span className="text-emerald-800">{stat.attended} Presenças</span>
                      <span className="text-rose-800">{stat.cancelled} Faltas</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-indigo-100 p-5 rounded-2xl border border-indigo-200 shadow-sm">
            <h4 className="text-indigo-900 font-black text-xs mb-2 flex items-center gap-2 uppercase tracking-widest">
              <AlertTriangle size={16} /> Dinâmica do Plano
            </h4>
            <p className="text-indigo-900 text-[11px] leading-relaxed font-bold mb-3">
              O plano foi calculado para durar <strong>{plan.durationMonths} meses</strong> (até {format(metrics.originalEndDate, 'dd/MM/yyyy')}). 
            </p>
            <p className="text-indigo-900 text-[11px] leading-relaxed font-bold">
              Cada falta registrada cria uma <strong>reposição</strong> que estende o término projetado. Atualmente, o término final está previsto para <strong>{format(metrics.currentEndDate, 'dd/MM/yyyy')}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Cancellation Reason Modal */}
      {cancellationModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-slate-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2 text-center">Registrar Falta</h3>
            <p className="text-slate-800 text-sm mb-6 text-center font-bold">Aula de {format(cancellationModal.date, 'dd/MM')} às {cancellationModal.time}</p>
            <div className="space-y-4">
              <textarea 
                className="w-full p-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 focus:ring-4 focus:ring-rose-200 outline-none h-32 text-base font-bold"
                placeholder="Motivo (ex: viagem, doente, feriado...)"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                autoFocus
              />
              <div className="flex gap-4">
                <button onClick={() => setCancellationModal(null)} className="flex-1 py-4 font-black text-slate-600 hover:text-slate-900 uppercase text-xs">Voltar</button>
                <button onClick={confirmCancellation} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-all uppercase text-xs">Confirmar Falta</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border-4 border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900">Novo Cronograma</h3>
              <button onClick={() => setEditingSchedule(false)} className="text-slate-900 hover:text-rose-600 transition-colors"><X size={32}/></button>
            </div>
            
            <div className="space-y-4 max-h-80 overflow-y-auto mb-6 pr-2">
              {tempSchedules.map((s, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-slate-100 rounded-2xl border-2 border-slate-200">
                  <select
                    className="flex-1 bg-white px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 text-sm font-black outline-none focus:border-indigo-500"
                    value={s.dayOfWeek}
                    onChange={e => {
                      const n = [...tempSchedules];
                      n[idx] = { ...n[idx], dayOfWeek: Number(e.target.value) };
                      setTempSchedules(n);
                    }}
                  >
                    {DAYS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <input
                    type="time"
                    className="w-32 bg-white px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 text-sm font-black outline-none focus:border-indigo-500"
                    value={s.time}
                    onChange={e => {
                      const n = [...tempSchedules];
                      n[idx] = { ...n[idx], time: e.target.value };
                      setTempSchedules(n);
                    }}
                  />
                  <button onClick={() => setTempSchedules(tempSchedules.filter((_, i) => i !== idx))} className="p-3 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"><Trash2 size={24} /></button>
                </div>
              ))}
              <button 
                onClick={() => setTempSchedules([...tempSchedules, { dayOfWeek: DayOfWeek.MONDAY, time: '14:00' }])}
                className="w-full py-4 border-4 border-dashed border-slate-300 rounded-2xl text-slate-700 hover:border-indigo-500 hover:text-indigo-600 text-sm font-black flex items-center justify-center gap-2 transition-all bg-slate-50"
              >
                <Plus size={20} /> ADICIONAR NOVO DIA
              </button>
            </div>

            <button onClick={handleSaveSchedule} disabled={tempSchedules.length === 0} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all text-lg uppercase tracking-widest">
              Salvar Alterações
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 border-blue-300 text-blue-900',
    emerald: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    rose: 'bg-rose-100 border-rose-300 text-rose-900',
    amber: 'bg-amber-100 border-amber-300 text-amber-900',
    indigo: 'bg-indigo-100 border-indigo-300 text-indigo-900'
  };

  return (
    <div className={`p-5 rounded-2xl shadow-md border-2 ${colorMap[color] || 'bg-white border-slate-300'}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-white rounded-lg shadow-inner">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-3xl font-black leading-none">{value}</div>
    </div>
  );
};

const StatusBadge = ({ status, reason }: { status: AttendanceRecord['status'], reason?: string }) => {
  switch (status) {
    case 'attended':
      return <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center w-fit gap-1 shadow-sm uppercase"><CheckCircle size={12}/> Presente</span>;
    case 'cancelled':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center w-fit gap-1 shadow-sm uppercase"><XCircle size={12}/> Cancelada</span>
          {reason && <div className="text-[10px] text-slate-900 font-black ml-1 italic max-w-[140px] leading-tight" title={reason}><MessageSquare size={10} className="inline mr-1 text-rose-600" />{reason}</div>}
        </div>
      );
    default:
      return <span className="bg-slate-200 text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center w-fit gap-1 border-2 border-slate-300 uppercase tracking-tighter"><Clock size={12}/> Pendente</span>;
  }
};

export default PlanDashboard;
