
import { 
  addMonths, 
  getDay, 
  isAfter, 
  isBefore, 
  addDays, 
  isSameDay, 
  format, 
  parseISO, 
  startOfDay,
  endOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plan, DayOfWeek, AttendanceRecord, PlanCalculations, MonthlyStats } from '../types';

export const isScheduledDay = (date: Date, schedules: { dayOfWeek: DayOfWeek }[]) => {
  const day = getDay(date);
  return schedules.some(s => s.dayOfWeek === day);
};

/**
 * Calcula quantas aulas haveria originalmente entre start e theoreticalEnd.
 * Baseado puramente no calendário de meses contratados.
 */
export const calculateInitialClassCount = (start: Date, durationMonths: number, schedules: { dayOfWeek: DayOfWeek }[]): number => {
  const theoreticalEnd = endOfDay(addMonths(start, durationMonths));
  let count = 0;
  let current = new Date(start);
  while (isBefore(current, theoreticalEnd) || isSameDay(current, theoreticalEnd)) {
    if (isScheduledDay(current, schedules)) count++;
    current = addDays(current, 1);
    if (count > 2000) break;
  }
  return count;
};

/**
 * Gera a lista completa de datas (passadas e futuras) para o plano.
 * O saldo de aulas é fixado no momento da criação (meses contratados).
 * Cada cancelamento adiciona uma aula extra ao cronograma.
 */
export const generateClassList = (plan: Plan): Date[] => {
  const historyDates = plan.history
    .map(h => parseISO(h.date))
    .sort((a, b) => a.getTime() - b.getTime());

  const lastHistoryDate = historyDates.length > 0 ? historyDates[historyDates.length - 1] : null;
  const startDate = startOfDay(parseISO(plan.startDate));
  
  // Total de aulas que precisam ser ministradas
  // (Originalmente previstas nos X meses + reposições de canceladas)
  const totalCancelled = plan.history.filter(h => h.status === 'cancelled').length;
  const targetTotal = plan.totalContractedClasses + totalCancelled;

  const result: Date[] = [...historyDates];
  
  // Gerar datas futuras baseadas no cronograma até atingir o saldo necessário
  let current = lastHistoryDate ? addDays(lastHistoryDate, 1) : new Date(startDate);
  
  while (result.length < targetTotal) {
    if (isScheduledDay(current, plan.schedules)) {
      // Evita duplicar data se ela já estiver no histórico
      const iso = format(current, 'yyyy-MM-dd');
      if (!plan.history.some(h => h.date === iso)) {
        result.push(new Date(current));
      }
    }
    current = addDays(current, 1);
    if (result.length > 3000) break;
  }

  return result.sort((a, b) => a.getTime() - b.getTime());
};

export const calculatePlanMetrics = (plan: Plan): PlanCalculations => {
  const classList = generateClassList(plan);
  
  // A data teórica é exatamente X meses após o início
  const theoreticalEndDate = endOfDay(addMonths(parseISO(plan.startDate), plan.durationMonths));

  const currentEndDate = classList.length > 0 
    ? classList[classList.length - 1] 
    : theoreticalEndDate;

  const now = startOfDay(new Date());
  const nextClass = classList.find(d => {
    const isTodayOrFuture = isAfter(d, now) || isSameDay(d, now);
    const record = plan.history.find(h => h.date === format(d, 'yyyy-MM-dd'));
    return isTodayOrFuture && (!record || record.status === 'pending');
  }) || null;

  return {
    originalEndDate: theoreticalEndDate,
    currentEndDate,
    totalPlannedClasses: plan.totalContractedClasses,
    totalCancelled: plan.history.filter(h => h.status === 'cancelled').length,
    totalAttended: plan.history.filter(h => h.status === 'attended').length,
    nextClassDate: nextClass
  };
};

export const calculateMonthlyStats = (history: AttendanceRecord[]): MonthlyStats[] => {
  const statsMap: Record<string, { attended: number, cancelled: number }> = {};

  history.forEach(record => {
    const date = parseISO(record.date);
    const key = format(date, 'MMMM yyyy', { locale: ptBR });

    if (!statsMap[key]) {
      statsMap[key] = { attended: 0, cancelled: 0 };
    }

    if (record.status === 'attended') statsMap[key].attended++;
    if (record.status === 'cancelled') statsMap[key].cancelled++;
  });

  return Object.entries(statsMap)
    .map(([monthYear, counts]) => ({ monthYear, ...counts }))
    .sort((a, b) => 0);
};
