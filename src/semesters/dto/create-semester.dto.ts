import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateSemesterSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Vui lòng nhập tên học kỳ')
      .max(100, 'Tên học kỳ tối đa 100 ký tự'),
    code: z
      .string()
      .min(1, 'Vui lòng nhập mã học kỳ')
      .max(20, 'Mã học kỳ tối đa 20 ký tự')
      .transform((val) => val.toUpperCase()),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    gradeSubmissionDeadline: z.coerce.date().optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
  });

export class CreateSemesterDto extends createZodDto(CreateSemesterSchema) {}
