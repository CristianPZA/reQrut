import { supabase } from './supabase';
import type { ActionLog } from '../types/logs';

export async function createLog(
  action_type: ActionLog['action_type'],
  entity_type: ActionLog['entity_type'],
  entity_id: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from('action_logs')
      .insert({
        user_id: session.user.id,
        action_type,
        entity_type,
        entity_id,
        details
      });
  } catch (error) {
    console.error('Error creating log:', error);
  }
}