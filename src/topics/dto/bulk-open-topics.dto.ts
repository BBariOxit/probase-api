import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const BulkOpenTopicsSchema = z.object({
  semesterId: z.coerce.number().int().positive(),
});

export class BulkOpenTopicsDto extends createZodDto(BulkOpenTopicsSchema) {}
