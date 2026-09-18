import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const QueryRoundsSchema = z.object({
  semesterId: z.coerce.number().int().positive().optional(),
  projectTypeId: z.coerce.number().int().positive().optional(),

  mine: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export class QueryRoundsDto extends createZodDto(QueryRoundsSchema) {}
