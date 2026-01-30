
import React, { useMemo, useState } from 'react';
// Fix: startOfToday might not be exported in some versions, using startOfDay as replacement
import { format, isBefore, startOfDay, parseISO } from 'date-fns';
// Fix: Import ptBR from specific subpath
import { ptBR } from 'date-fns/locale/pt-BR';
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
  RotateCcw,
  FileText,
  RefreshCw,
  Ban,
  ArrowRight,
  Edit2
} from 'lucide-react';
import { Plan, AttendanceRecord, DayOfWeek, ClassSchedule } from '../types';
import { calculatePlanMetrics, generateClassList, calculateMonthlyStats } from '../utils/dateHelpers';
import ReportModal from './ReportModal';

interface Props {
  plan: Plan;
  onUpdateHistory: (record: AttendanceRecord) => void;
  onUpdatePlan: (plan: Plan) => void;
  onDeletePlan: (id: string) => void;
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

const PlanDashboard: React.FC<Props> = ({ plan, onUpdateHistory, onUpdatePlan, onDeletePlan }) => {
  const metrics = useMemo(() => calculatePlanMetrics(plan), [plan]);
  const classList = useMemo(() => generateClassList(plan), [plan]);
  const monthlyStats = useMemo(() => calculateMonthlyStats(plan.history), [plan.history]);

  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  const [tempSchedules, setTempSchedules] = useState<ClassSchedule[]>(plan.schedules);
  const [tempName, setTempName] = useState(plan.studentName);
  
  const [cancellationModal, setCancellationModal] = useState<{date: Date, time: string} | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [shouldExtendPlan, setShouldExtendPlan] = useState(true);

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
    setShouldExtendPlan(true);
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
      extendsPlan: shouldExtendPlan,
      reason: cancelReason || 'Não informado'
    });
    setCancellationModal(null);
  };

  const handleSaveSettings = () => {
    if (!tempName.trim()) return alert("O nome não pode ser vazio.");
    onUpdatePlan({ ...plan, studentName: tempName, schedules: tempSchedules });
    setIsSettingsOpen(false);
  };

  const filteredClasses = useMemo(() => {
    if (activeTab === 'all') return classList;
    return classList.filter(date => {
      const record = getRecord(date);
      return !record || record.status === 'pending';
    });
  }, [classList, activeTab, plan.history]);

  const scheduleSummary = useMemo(() => {
    return plan.schedules
      .map(s => {
        const dayLabel = DAYS_OPTIONS.find(opt => opt.value === s.dayOfWeek)?.label.slice(0, 3);
        return `${dayLabel} (${s.time})`;
      })
      .join(', ');
  }, [plan.schedules]);

  return (
    <div className="space-y-6">
      <div className={isReportOpen ? "no-print space-y-6" : "space-y-6"}>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center shadow-inner">
              <User size={24} />
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{plan.studentName}</h2>
                  <button onClick={() => setIsSettingsOpen(true)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                </div>
                <div className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black text-slate-500 uppercase tracking-tighter sm:mt-1">{scheduleSummary}</div>
              </div>
              <p className="text-slate-800 text-sm flex items-center gap-1 font-bold"><Calendar size={14} className="text-indigo-600" /> Plano de {plan.durationMonths} meses</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setIsReportOpen(true)} className="p-3 bg-white text-slate-700 border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm font-black active:scale-95"><FileText size={18} /> Relatório</button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm font-black active:scale-95"><Settings size={18} /> Configurações</button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><CalendarDays size={14} /> Vigência do Contrato</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-2">
            <div className="flex-1 text-center sm:text-left bg-slate-50 p-3 rounded-xl border border-slate-100 w-full">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Início</p>
              <p className="text-sm font-black text-slate-900 capitalize">{format(parseISO(plan.startDate), "dd/MM/yyyy ' - ' EEEE", { locale: ptBR })}</p>
            </div>
            <ArrowRight className="text-slate-300 hidden sm:block" size={20} />
            <div className="flex-1 text-center sm:text-left bg-slate-50 p-3 rounded-xl border border-slate-100 w-full opacity-60">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Término Original</p>
              <p className="text-sm font-black text-slate-900 capitalize">{format(metrics.originalEndDate, "dd/MM/yyyy ' - ' EEEE", { locale: ptBR })}</p>
            </div>
            <ArrowRight className="text-slate-300 hidden sm:block" size={20} />
            <div className="flex-1 text-center sm:text-left bg-indigo-50 p-3 rounded-xl border-2 border-indigo-200 w-full">
              <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">Término Atualizado</p>
              <p className="text-sm font-black text-indigo-700 capitalize">{format(metrics.currentEndDate, "dd/MM/yyyy ' - ' EEEE", { locale: ptBR })}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<CalendarDays className="text-blue-700" />} label="Total Previsto" value={metrics.totalPlannedClasses + metrics.totalCancelledExtending} color="blue" />
          <StatCard icon={<CheckCircle className="text-emerald-700" />} label="Presenças" value={metrics.totalAttended} color="emerald" />
          <StatCard icon={<XCircle className="text-rose-700" />} label="Total Faltas" value={metrics.totalCancelled} color="rose" />
          <StatCard icon={<Clock className="text-amber-700" />} label="Próxima Aula" value={metrics.nextClassDate ? format(metrics.nextClassDate, 'dd/MM') : '--'} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden flex flex-col">
            <div className="flex border-b border-slate-200">
              <button onClick={() => setActiveTab('pending')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'pending' ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}><LayoutList size={16} /> Cronograma Pendente</button>
              <button onClick={() => setActiveTab('all')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'all' ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}><History size={16} /> Todas as Aulas</button>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left table-fixed sm:table-auto">
                <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm border-b border-slate-300">
                  <tr className="text-slate-800 text-[10px] uppercase tracking-wider font-black">
                    <th className="px-3 sm:px-6 py-3 w-20 sm:w-auto">Data</th>
                    <th className="px-3 sm:px-6 py-3">Aula</th>
                    <th className="px-3 sm:px-6 py-3 hidden sm:table-cell">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-right w-24 sm:w-auto">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredClasses.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold italic">Nenhuma aula para exibir.</td></tr>}
                  {filteredClasses.map((date, idx) => {
                    const record = getRecord(date);
                    const status = record?.status || 'pending';
                    // Fix: Using startOfDay(new Date()) instead of startOfToday()
                    const isFuture = isBefore(startOfDay(new Date()), date);
                    return (
                      <tr key={idx} className={`hover:bg-slate-50 transition-colors group ${status === 'pending' && !isFuture ? 'bg-amber-50' : 'bg-white'}`}>
                        <td className="px-3 sm:px-6 py-4"><span className="font-bold text-slate-900 text-xs sm:text-base">{format(date, 'dd/MM')}</span></td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="text-slate-900 text-xs sm:text-sm font-bold capitalize truncate">{format(date, 'EEEE', { locale: ptBR }).split('-')[0]}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 hidden sm:table-cell"><StatusBadge status={status} reason={record?.reason} extendsPlan={record?.extendsPlan} /></td>
                        <td className="px-3 sm:px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            {status === 'pending' ? (
                              <>
                                <button onClick={(e) => markAttendance(date, e)} className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><UserCheck size={16} /></button>
                                <button onClick={(e) => openCancelModal(date, e)} className="p-1.5 sm:p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"><UserX size={16} /></button>
                              </>
                            ) : (
                              <button onClick={(e) => resetStatus(date, e)} className="p-1.5 sm:p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><RotateCcw size={16} /></button>
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
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-300">
              <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><BarChart3 size={18} className="text-indigo-600" /> Presenças Mensais</h3>
              <div className="space-y-4">
                {monthlyStats.map((stat, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-sm font-black text-slate-900 capitalize">{stat.monthYear}</div>
                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                      <div className="h-full bg-emerald-600" style={{ width: `${(stat.attended / (stat.attended + stat.cancelled || 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => {
  const colorMap: Record<string, string> = { blue: 'bg-blue-100 border-blue-300 text-blue-900', emerald: 'bg-emerald-100 border-emerald-300 text-emerald-900', rose: 'bg-rose-100 border-rose-300 text-rose-900', amber: 'bg-amber-100 border-amber-300 text-amber-900' };
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

const StatusBadge = ({ status, reason, extendsPlan, compact }: any) => {
  if (status === 'pending') return <span className="bg-slate-200 text-slate-900 rounded-lg font-black px-3 py-1.5 text-[10px] uppercase">Pendente</span>;
  if (status === 'attended') return <span className="bg-emerald-600 text-white rounded-lg font-black px-3 py-1.5 text-[10px] uppercase">Presente</span>;
  return <span className={`rounded-lg font-black px-3 py-1.5 text-[10px] uppercase ${extendsPlan === false ? 'bg-slate-700 text-white' : 'bg-rose-600 text-white'}`}>{extendsPlan === false ? 'Perdida' : 'Repos.'}</span>;
};

export default PlanDashboard;
