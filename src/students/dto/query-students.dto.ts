import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const QueryStudentsSchema = z.object({
  semesterId: z.coerce.number().int().positive().optional(),
  roundId: z.coerce.number().int().positive().optional(),
  cohort: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Khóa là năm nhập học gồm bốn chữ số')
    .optional(),
  majorId: z.coerce.number().int().positive().optional(),
  class: z.string().trim().min(1).max(100).optional(),
  lecturerId: z.coerce.number().int().positive().optional(),
  hasGroup: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export class QueryStudentsDto extends createZodDto(QueryStudentsSchema) {}
