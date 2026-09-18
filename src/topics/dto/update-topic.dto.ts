import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdateTopicSchema = z.object({
  projectTypeId: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().min(1).optional(),
  expectedOutcomes: z.string().trim().min(1).optional(),
  maxStudents: z.coerce.number().int().min(1).max(10).optional(),
});

export class UpdateTopicDto extends createZodDto(UpdateTopicSchema) {}
