import { supabase } from '../lib/supabase';

type AuditAction = 'create' | 'update' | 'delete';
type EntityType = 'member' | 'transaction' | 'budget';

export async function logAuditEvent(
  action: AuditAction,
  entityType: EntityType,
  entityId: string,
  changes: Record<string, any>
) {
  try {
    const { data, error } = await supabase.rpc('record_audit_log', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_changes: changes
    });

    if (error) {
      console.error('Error recording audit log:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in logAuditEvent:', error);
    // Don't throw error to prevent disrupting main flow
  }
}