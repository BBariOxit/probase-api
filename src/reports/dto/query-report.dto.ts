import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const QueryReportSchema = z.object({
  semesterId: z.coerce.number().int().positive().optional(),
});

export class QueryReportDto extends createZodDto(QueryReportSchema) {}
