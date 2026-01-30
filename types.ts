
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

export interface ClassSchedule {
  dayOfWeek: DayOfWeek;
  time: string;
}

export interface AttendanceRecord {
  date: string; // ISO format (yyyy-MM-dd)
  time: string; // Horário em que a aula estava agendada (HH:mm)
  status: 'attended' | 'cancelled' | 'pending';
  reason?: string; 
  note?: string;
}

export interface Plan {
  id: string;
  studentName: string;
  startDate: string; // ISO format
  durationMonths: number;
  totalContractedClasses: number; // FIXO: calculado na criação
  schedules: ClassSchedule[];
  history: AttendanceRecord[];
}

export interface PlanCalculations {
  originalEndDate: Date;
  currentEndDate: Date;
  totalPlannedClasses: number;
  totalCancelled: number;
  totalAttended: number;
  nextClassDate: Date | null;
}

export interface MonthlyStats {
  monthYear: string; 
  attended: number;
  cancelled: number;
}
