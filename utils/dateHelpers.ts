
import { 
  addMonths, 
  getDay, 
  isAfter, 
  isBefore, 
  addDays, 
  isSameDay, 
  format, 
  endOfDay,
  parseISO,
  // Fix: startOfToday might not be exported in some versions, using startOfDay as replacement
  startOfDay
} from 'date-fns';
// Fix: Import ptBR from specific subpath as required by the project environment
import { ptBR } from 'date-fns/locale/pt-BR';
import { Plan, DayOfWeek, AttendanceRecord, PlanCalculations, MonthlyStats } from '../types';

export const isScheduledDay = (date: Date, schedules: { dayOfWeek: DayOfWeek }[]) => {
  const day = getDay(date);
  return schedules.some(s => s.dayOfWeek === day);
};

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

export const generateClassList = (plan: Plan): Date[] => {
  const historyDates = plan.history
    .map(h => parseISO(h.date))
    .sort((a, b) => a.getTime() - b.getTime());

  const lastHistoryDate = historyDates.length > 0 ? historyDates[historyDates.length - 1] : null;
  const startDate = parseISO(plan.startDate);
  
  const totalCancelledExtending = plan.history.filter(h => h.status === 'cancelled' && h.extendsPlan !== false).length;
  const targetTotal = plan.totalContractedClasses + totalCancelledExtending;

  const result: Date[] = [...historyDates];
  
  let current = lastHistoryDate ? addDays(lastHistoryDate, 1) : new Date(startDate);
  
  while (result.length < targetTotal) {
    if (isScheduledDay(current, plan.schedules)) {
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
  const theoreticalEndDate = endOfDay(addMonths(parseISO(plan.startDate), plan.durationMonths));
  const currentEndDate = classList.length > 0 ? classList[classList.length - 1] : theoreticalEndDate;

  // Fix: Using startOfDay(new Date()) instead of startOfToday()
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
    totalCancelledExtending: plan.history.filter(h => h.status === 'cancelled' && h.extendsPlan !== false).length,
    totalAttended: plan.history.filter(h => h.status === 'attended').length,
    nextClassDate: nextClass
  };
};

export const calculateMonthlyStats = (history: AttendanceRecord[]): MonthlyStats[] => {
  const statsMap: Record<string, { attended: number, cancelled: number }> = {};
  history.forEach(record => {
    const date = parseISO(record.date);
    const key = format(date, 'MMMM yyyy', { locale: ptBR });
    if (!statsMap[key]) statsMap[key] = { attended: 0, cancelled: 0 };
    if (record.status === 'attended') statsMap[key].attended++;
    if (record.status === 'cancelled') statsMap[key].cancelled++;
  });
  return Object.entries(statsMap).map(([monthYear, counts]) => ({ monthYear, ...counts }));
};
