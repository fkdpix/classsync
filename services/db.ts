
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Plan } from '../types';

export interface SyncConfig {
  url: string;
  key: string;
}

export const getSyncConfig = (): SyncConfig | null => {
  const saved = localStorage.getItem('class_sync_db_config');
  return saved ? JSON.parse(saved) : null;
};

export const saveSyncConfig = (config: SyncConfig) => {
  localStorage.setItem('class_sync_db_config', JSON.stringify(config));
};

export const clearSyncConfig = () => {
  localStorage.removeItem('class_sync_db_config');
};

export const createSyncClient = (config: SyncConfig) => {
  return createClient(config.url, config.key);
};

// Funções de Persistência
export const pushToCloud = async (plans: Plan[], config: SyncConfig) => {
  const supabase = createSyncClient(config);
  // Simplificação: Salvamos o estado inteiro em um único registro para facilitar o "Sync de Usuário Único"
  // Em um sistema real multi-usuário, teríamos tabelas separadas.
  const { error } = await supabase
    .from('class_sync_data')
    .upsert({ id: 'current_user_data', plans: plans }, { onConflict: 'id' });
  
  if (error) throw error;
};

export const pullFromCloud = async (config: SyncConfig): Promise<Plan[] | null> => {
  const supabase = createSyncClient(config);
  const { data, error } = await supabase
    .from('class_sync_data')
    .select('plans')
    .eq('id', 'current_user_data')
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // Ignora erro de "não encontrado"
  return data?.plans || null;
};
