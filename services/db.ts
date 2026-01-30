
import { createClient } from '@supabase/supabase-js';
import { Plan } from '../types';

export interface SyncConfig {
  url: string;
  key: string;
}

export const getSyncConfig = (): SyncConfig | null => {
  const saved = localStorage.getItem('class_sync_db_config');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

export const saveSyncConfig = (config: SyncConfig) => {
  // Normaliza a URL removendo espaços e barras finais
  const normalizedUrl = config.url.trim().replace(/\/$/, "");
  const normalizedKey = config.key.trim();
  localStorage.setItem('class_sync_db_config', JSON.stringify({ url: normalizedUrl, key: normalizedKey }));
};

export const clearSyncConfig = () => {
  localStorage.removeItem('class_sync_db_config');
};

export const createSyncClient = (config: SyncConfig) => {
  return createClient(config.url, config.key, {
    auth: { persistSession: false }
  });
};

export const pushToCloud = async (plans: Plan[], config: SyncConfig) => {
  try {
    const supabase = createSyncClient(config);
    const { error } = await supabase
      .from('class_sync_data')
      .upsert({ id: 'current_user_data', plans: plans }, { onConflict: 'id' });
    
    if (error) {
      console.error("Erro no Supabase Push:", error.message);
      throw new Error(error.message);
    }
  } catch (err) {
    console.error("Falha catastrófica no Push:", err);
    throw err;
  }
};

export const pullFromCloud = async (config: SyncConfig): Promise<Plan[] | null> => {
  try {
    const supabase = createSyncClient(config);
    const { data, error } = await supabase
      .from('class_sync_data')
      .select('plans')
      .eq('id', 'current_user_data')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Registro não existe ainda
      console.error("Erro no Supabase Pull:", error.message);
      throw new Error(error.message);
    }
    return data?.plans || null;
  } catch (err) {
    console.error("Falha catastrófica no Pull:", err);
    throw err;
  }
};
