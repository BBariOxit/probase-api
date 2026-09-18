import { Prisma } from '../../generated/prisma/client';

export interface AuditEntry {
  userId: number;

  action: string;
  targetTable: string;
  targetId: string | number;

  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
}

export function recordAudit(tx: Prisma.TransactionClient, entry: AuditEntry) {
  return tx.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      targetTable: entry.targetTable,
      targetId: String(entry.targetId),
      ...(entry.oldValue !== undefined && { oldValue: entry.oldValue }),
      ...(entry.newValue !== undefined && { newValue: entry.newValue }),
    },
  });
}
