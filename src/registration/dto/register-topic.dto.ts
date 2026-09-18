import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterTopicSchema = z.object({
  declaredSize: z.coerce.number().int().min(2).max(10).optional(),
  name: z.string().trim().min(1).max(120).optional(),
});

export class RegisterTopicDto extends createZodDto(RegisterTopicSchema) {}
