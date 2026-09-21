import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateTopicSchema = z.object({
  semesterId: z.coerce.number().int().positive(),
  projectTypeId: z.coerce.number().int().positive(),
  title: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên đề tài')
    .max(200, 'Tên đề tài tối đa 200 ký tự'),
  description: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mô tả đề tài')
    .max(3000, 'Mô tả tối đa 3000 ký tự'),
  expectedOutcomes: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập kết quả mong đợi')
    .max(3000, 'Yêu cầu đầu ra tối đa 3000 ký tự'),
  // Capped so a typo cannot turn one topic into a whole cohort.
  maxStudents: z.coerce.number().int().min(1).max(10).default(3),
});

export class CreateTopicDto extends createZodDto(CreateTopicSchema) {}
