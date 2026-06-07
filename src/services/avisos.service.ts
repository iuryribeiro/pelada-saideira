import { supabase } from '@/lib/supabase/client';
import { Aviso } from '@/types/database';

export async function fetchAvisos(): Promise<Aviso[]> {
  const { data, error } = await supabase
    .from('avisos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function criarAviso(titulo: string, mensagem: string, adminId: string): Promise<Aviso> {
  const { data, error } = await supabase
    .from('avisos')
    .insert({ titulo, mensagem, admin_id: adminId, push_sent: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletarAviso(id: string): Promise<void> {
  const { error } = await supabase
    .from('avisos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
