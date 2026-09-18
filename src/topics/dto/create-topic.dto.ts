import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateTopicSchema = z.object({
  semesterId: z.coerce.number().int().positive(),
  projectTypeId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, 'Vui lòng nhập tên đề tài').max(255),
  description: z.string().trim().min(1, 'Vui lòng nhập mô tả đề tài'),
  expectedOutcomes: z.string().trim().min(1, 'Vui lòng nhập kết quả mong đợi'),
  // Capped so a typo cannot turn one topic into a whole cohort.
  maxStudents: z.coerce.number().int().min(1).max(10).default(1),
});

export class CreateTopicDto extends createZodDto(CreateTopicSchema) {}
