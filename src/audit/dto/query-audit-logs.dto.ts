import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const QueryAuditLogsSchema = z.object({
  action: z.string().trim().min(1).max(100).optional(),
  userId: z.coerce.number().int().positive().optional(),
  targetTable: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export class QueryAuditLogsDto extends createZodDto(QueryAuditLogsSchema) {}
