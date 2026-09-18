import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const QueryMyGroupSchema = z.object({
  semesterId: z.coerce.number().int().positive().optional(),
});

export class QueryMyGroupDto extends createZodDto(QueryMyGroupSchema) {}
