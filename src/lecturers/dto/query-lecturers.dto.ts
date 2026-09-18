import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const QueryLecturersSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export class QueryLecturersDto extends createZodDto(QueryLecturersSchema) {}
