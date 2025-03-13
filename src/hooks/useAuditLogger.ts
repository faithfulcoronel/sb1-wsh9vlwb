import { useCallback } from 'react';
import { logAuditEvent } from '../utils/auditLogger';

export function useAuditLogger() {
  const logMemberEvent = useCallback(async (
    action: 'create' | 'update' | 'delete',
    memberId: string,
    changes: Record<string, any>
  ) => {
    return logAuditEvent(action, 'member', memberId, changes);
  }, []);

  const logTransactionEvent = useCallback(async (
    action: 'create' | 'update' | 'delete',
    transactionId: string,
    changes: Record<string, any>
  ) => {
    return logAuditEvent(action, 'transaction', transactionId, changes);
  }, []);

  const logBudgetEvent = useCallback(async (
    action: 'create' | 'update' | 'delete',
    budgetId: string,
    changes: Record<string, any>
  ) => {
    return logAuditEvent(action, 'budget', budgetId, changes);
  }, []);

  return {
    logMemberEvent,
    logTransactionEvent,
    logBudgetEvent
  };
}