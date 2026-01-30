
import React, { useState } from 'react';
import { Plus, Calendar, User, Clock, Trash2 } from 'lucide-react';
import { Plan, DayOfWeek, ClassSchedule } from '../types';
import { calculateInitialClassCount } from '../utils/dateHelpers';
import { parseISO } from 'date-fns';

interface Props {
  onCreate: (plan: Plan) => void;
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

const PlanCreator: React.FC<Props> = ({ onCreate }) => {
  const [studentName, setStudentName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(6);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([{ dayOfWeek: DayOfWeek.MONDAY, time: '14:00' }]);

  const addSchedule = () => {
    setSchedules([...schedules, { dayOfWeek: DayOfWeek.MONDAY, time: '14:00' }]);
  };

  const removeSchedule = (idx: number) => {
    setSchedules(schedules.filter((_, i) => i !== idx));
  };

  const updateSchedule = (idx: number, updates: Partial<ClassSchedule>) => {
    const newScheds = [...schedules];
    newScheds[idx] = { ...newScheds[idx], ...updates };
    setSchedules(newScheds);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || schedules.length === 0) return;

    const start = parseISO(startDate);
    const totalClasses = calculateInitialClassCount(start, duration, schedules);

    const newPlan: Plan = {
      id: Math.random().toString(36).substr(2, 9),
      studentName,
      startDate,
      durationMonths: duration,
      totalContractedClasses: totalClasses,
      schedules,
      history: []
    };
    onCreate(newPlan);
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-slate-200 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Novo Aluno</h2>
        <p className="text-slate-700 font-bold mt-2">Configure o contrato e os horários semanais.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-black text-slate-900 mb-2 flex items-center gap-2 uppercase tracking-widest">
            <User size={18} className="text-indigo-600" /> Nome do Aluno
          </label>
          <input
            required
            type="text"
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-300 bg-white text-slate-900 font-bold focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400"
            placeholder="Ex: João da Silva"
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-black text-slate-900 mb-2 flex items-center gap-2 uppercase tracking-widest">
              <Calendar size={18} className="text-indigo-600" /> Data de Início
            </label>
            <input
              required
              type="date"
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-300 bg-white text-slate-900 font-bold focus:border-indigo-600 outline-none transition-all"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-black text-slate-900 mb-2 flex items-center gap-2 uppercase tracking-widest">
              <Clock size={18} className="text-indigo-600" /> Duração (Meses)
            </label>
            <input
              required
              type="number"
              min="1"
              max="24"
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-300 bg-white text-slate-900 font-bold focus:border-indigo-600 outline-none transition-all"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
            <label className="block text-sm font-black text-slate-900 uppercase tracking-widest">Cronograma Semanal</label>
            <button type="button" onClick={addSchedule} className="text-xs font-black bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1 transition-all">
              <Plus size={14} /> ADICIONAR DIA
            </button>
          </div>

          <div className="space-y-3">
            {schedules.length === 0 && (
              <p className="text-center py-6 text-slate-500 font-bold italic border-2 border-dashed border-slate-200 rounded-2xl">Nenhum dia selecionado ainda.</p>
            )}
            {schedules.map((s, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
                <select
                  className="flex-1 min-w-[140px] bg-white px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 font-bold text-sm outline-none focus:border-indigo-500"
                  value={s.dayOfWeek}
                  onChange={e => updateSchedule(idx, { dayOfWeek: Number(e.target.value) })}
                >
                  {DAYS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <input
                  type="time"
                  className="w-36 bg-white px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 font-bold text-sm outline-none focus:border-indigo-500"
                  value={s.time}
                  onChange={e => updateSchedule(idx, { time: e.target.value })}
                />
                <button type="button" onClick={() => removeSchedule(idx)} className="p-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all text-lg uppercase tracking-widest mt-4">
          CADASTRAR ALUNO
        </button>
      </form>
    </div>
  );
};

export default PlanCreator;
