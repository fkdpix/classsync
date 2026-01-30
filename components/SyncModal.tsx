
import React, { useState } from 'react';
import { Cloud, X, Info, ShieldCheck, Database, Trash2 } from 'lucide-react';
import { SyncConfig, getSyncConfig, saveSyncConfig, clearSyncConfig } from '../services/db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

const SyncModal: React.FC<Props> = ({ isOpen, onClose, onConfigUpdated }) => {
  const currentConfig = getSyncConfig();
  const [url, setUrl] = useState(currentConfig?.url || '');
  const [key, setKey] = useState(currentConfig?.key || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!url || !key) return alert("Preencha todos os campos!");
    saveSyncConfig({ url, key });
    onConfigUpdated();
    onClose();
  };

  const handleClear = () => {
    if (confirm("Deseja desconectar da nuvem? Os dados locais permanecerão.")) {
      clearSyncConfig();
      onConfigUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border-4 border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
              <Cloud size={24} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Sincronização Nuvem</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex gap-4">
            <div className="text-indigo-600 mt-1"><Info size={20} /></div>
            <p className="text-xs text-indigo-900 leading-relaxed font-bold">
              Para sincronizar dados entre dispositivos, use o <strong>Supabase</strong>. 
              Crie um projeto gratuito em <a href="https://supabase.com" target="_blank" className="underline">supabase.com</a> e cole as chaves "Project URL" e "Anon Key" aqui.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Project URL</label>
              <div className="relative">
                <Database className="absolute left-4 top-4 text-slate-400" size={18} />
                <input 
                  type="text" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-sm focus:border-indigo-600 outline-none"
                  placeholder="https://xxx.supabase.co"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">API Key (Anon)</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-4 text-slate-400" size={18} />
                <input 
                  type="password" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-sm focus:border-indigo-600 outline-none"
                  placeholder="eyJhbGciOiJIUzI1NiI..."
                  value={key}
                  onChange={e => setKey(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            {currentConfig && (
              <button 
                onClick={handleClear}
                className="p-4 bg-slate-100 text-rose-600 rounded-2xl hover:bg-rose-50 transition-all flex items-center justify-center"
                title="Limpar Configurações"
              >
                <Trash2 size={24} />
              </button>
            )}
            <button 
              onClick={handleSave}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all uppercase tracking-widest text-sm"
            >
              {currentConfig ? 'Atualizar Conexão' : 'Ativar Sincronização'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
