
import React, { useRef } from 'react';
import { X, Printer, Calendar, CheckCircle2, XCircle, FileText, Copy, Info, Ban, RefreshCw, MoveRight } from 'lucide-react';
import { Plan, AttendanceRecord } from '../types';
import { format, parseISO } from 'date-fns';
// Fix: Import ptBR from specific subpath
import { ptBR } from 'date-fns/locale/pt-BR';
import { calculatePlanMetrics } from '../utils/dateHelpers';

interface Props {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
}

interface GroupedMonth {
  attended: AttendanceRecord[];
  cancelled: AttendanceRecord[];
}

const ReportModal: React.FC<Props> = ({ plan, isOpen, onClose }) => {
  if (!isOpen) return null;

  const metrics = calculatePlanMetrics(plan);
  const reportRef = useRef<HTMLDivElement>(null);

  // Agrupar histórico por mês e depois por status
  const groupedHistory = plan.history.reduce((acc, record) => {
    const monthYear = format(parseISO(record.date), 'MMMM yyyy', { locale: ptBR });
    if (!acc[monthYear]) {
      acc[monthYear] = { attended: [], cancelled: [] };
    }
    if (record.status === 'attended') acc[monthYear].attended.push(record);
    if (record.status === 'cancelled') acc[monthYear].cancelled.push(record);
    return acc;
  }, {} as Record<string, GroupedMonth>);

  const handlePrint = () => {
    // Adiciona classe ao body para o CSS de impressão agir
    document.body.classList.add('is-printing');
    
    // Pequeno delay para garantir que o DOM está pronto e o layout ajustado para impressão
    setTimeout(() => {
      window.print();
      // Remove a classe após a abertura do diálogo de impressão
      document.body.classList.remove('is-printing');
    }, 150);
  };

  const copyToClipboard = () => {
    const historyEntries = Object.entries(groupedHistory) as [string, GroupedMonth][];
    
    const text = `
*📊 RELATÓRIO DE AULAS - ClassSync*
---------------------------------------
*👤 Aluno:* ${plan.studentName}
*📅 Início:* ${format(parseISO(plan.startDate), "dd/MM/yyyy ' ('EEEE')'", { locale: ptBR })}
*📅 Término Original:* ${format(metrics.originalEndDate, "dd/MM/yyyy ' ('EEEE')'", { locale: ptBR })}
*🏁 Término Projetado:* ${format(metrics.currentEndDate, "dd/MM/yyyy ' ('EEEE')'", { locale: ptBR })}

*📈 RESUMO GERAL:*
✅ Presenças: ${metrics.totalAttended}
❌ Total Faltas: ${metrics.totalCancelled}
🔄 Reposições Geradas: ${metrics.totalCancelledExtending}

*🗓️ DETALHAMENTO MENSAL:*
${historyEntries.map(([month, data]) => `
*${month.toUpperCase()}*
${data.attended.length > 0 ? `✅ Presenças: ${data.attended.map(r => format(parseISO(r.date), 'dd/MM')).join(', ')}` : ''}
${data.cancelled.length > 0 ? `❌ Faltas:\n${data.cancelled.map(r => `• ${format(parseISO(r.date), 'dd/MM')} [${r.extendsPlan === false ? 'AULA PERDIDA' : 'REPOSIÇÃO'}]: ${r.reason}`).join('\n')}` : ''}
`).join('')}
---------------------------------------
_Gerado automaticamente pelo ClassSync_
    `.trim();

    navigator.clipboard.writeText(text);
    alert("Relatório copiado! Agora é só colar no WhatsApp do aluno.");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[150] flex items-center justify-center p-0 sm:p-4 print:p-0 print:bg-white print:static print-container">
      <div className="bg-white rounded-none sm:rounded-3xl w-full max-w-2xl h-full sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl print:shadow-none print:h-auto print:rounded-none">
        
        {/* Header - Hidden on Print */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center no-print bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              <FileText size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Relatório Situacional</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600 transition-colors bg-slate-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div ref={reportRef} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 print:overflow-visible print:p-0">
          
          {/* Main Stats Header */}
          <div className="text-center space-y-3 border-b-4 border-slate-900 pb-8">
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{plan.studentName}</h1>
            <div className="inline-block bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
              Histórico de Frequência
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Início</p>
              <p className="text-sm font-black text-slate-900 capitalize leading-tight">
                {format(parseISO(plan.startDate), "dd/MM/yyyy", { locale: ptBR })}
                <br />
                <span className="text-[10px] text-slate-400">{format(parseISO(plan.startDate), "EEEE", { locale: ptBR })}</span>
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 opacity-60">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Término Original</p>
              <p className="text-sm font-black text-slate-900 capitalize leading-tight">
                {format(metrics.originalEndDate, "dd/MM/yyyy", { locale: ptBR })}
                <br />
                <span className="text-[10px] text-slate-400">{format(metrics.originalEndDate, "EEEE", { locale: ptBR })}</span>
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-200 text-right">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Término Projetado</p>
              <div className="flex flex-col items-end">
                <div className="flex items-center justify-end gap-2">
                  {metrics.currentEndDate.getTime() > metrics.originalEndDate.getTime() && (
                    <RefreshCw size={14} className="text-indigo-400 animate-spin-slow" />
                  )}
                  <p className="text-sm font-black text-indigo-700">
                    {format(metrics.currentEndDate, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <span className="text-[10px] text-indigo-400 font-black capitalize">
                  {format(metrics.currentEndDate, "EEEE", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><CheckCircle2 size={28} /></div>
              <div>
                <p className="text-[10px] font-black text-emerald-800/60 uppercase">Realizadas</p>
                <p className="text-2xl font-black text-emerald-900">{metrics.totalAttended}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-4 p-5 bg-rose-50 rounded-2xl border-2 border-rose-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm"><XCircle size={28} /></div>
              <div>
                <p className="text-[10px] font-black text-rose-800/60 uppercase">Total Faltas</p>
                <p className="text-2xl font-black text-rose-900">{metrics.totalCancelled}</p>
              </div>
            </div>
          </div>

          {/* Monthly Details */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">Detalhamento por Mês</h4>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            
            {(Object.entries(groupedHistory) as [string, GroupedMonth][]).map(([month, data]) => (
              <div key={month} className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">{month}</h5>
                </div>
                
                <div className="p-6 space-y-4">
                  {data.attended.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Aulas Realizadas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {data.attended.sort((a,b) => a.date.localeCompare(b.date)).map((r, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                            {format(parseISO(r.date), 'dd/MM')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.cancelled.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1">
                        <XCircle size={10} /> Histórico de Faltas
                      </p>
                      <div className="space-y-2">
                        {data.cancelled.sort((a,b) => a.date.localeCompare(b.date)).map((r, i) => (
                          <div key={i} className={`flex items-start justify-between p-3 rounded-xl border ${r.extendsPlan === false ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-rose-50/50 border-rose-100/50'}`}>
                            <div className="flex items-center gap-2">
                              <span className={`font-black text-xs w-12 ${r.extendsPlan === false ? 'text-slate-500' : 'text-rose-700'}`}>{format(parseISO(r.date), 'dd/MM')}</span>
                              <div className="flex items-center gap-1">
                                {r.extendsPlan === false ? <Ban size={10} className="text-slate-400" /> : <RefreshCw size={10} className="text-rose-400" />}
                                <span className={`text-[8px] font-black uppercase tracking-tighter ${r.extendsPlan === false ? 'text-slate-400' : 'text-rose-400'}`}>
                                  {r.extendsPlan === false ? 'Aula Perdida' : 'Repos.'}
                                </span>
                              </div>
                            </div>
                            <span className="flex-1 text-xs text-slate-900 font-bold italic leading-snug text-right">
                              "{r.reason}"
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4">
            <Info className="text-indigo-600 shrink-0" size={20} />
            <div className="space-y-1">
              <p className="text-[11px] text-indigo-900 font-bold leading-relaxed italic">
                *Nota:* Faltas com direito a reposição prorrogaram o término original ({format(metrics.originalEndDate, 'dd/MM/yyyy')}) para a nova data.
              </p>
              <p className="text-[11px] text-indigo-900 font-bold leading-relaxed italic">
                Término Atualizado: <strong>{format(metrics.currentEndDate, "dd/MM/yyyy ' ('EEEE')'", { locale: ptBR })}</strong>.
              </p>
            </div>
          </div>

          <div className="pt-8 text-center border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] print:block">
            ClassSync • Sistema de Gestão de Aulas
          </div>
        </div>

        {/* Footer Actions - Hidden on Print */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3 no-print">
          <button onClick={copyToClipboard} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 font-black py-4 rounded-2xl hover:bg-slate-100 flex items-center justify-center gap-2 text-sm uppercase transition-all active:scale-95">
            <Copy size={18} /> Copiar para WhatsApp
          </button>
          <button onClick={handlePrint} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 text-sm uppercase transition-all active:scale-95">
            <Printer size={18} /> Gerar PDF / Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
