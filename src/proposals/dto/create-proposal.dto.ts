import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateProposalSchema = z.object({
  projectTypeId: z.coerce.number().int().positive(),
  requestedLecturerId: z.coerce
    .number('Vui lòng chọn giảng viên bạn muốn gửi đề xuất')
    .int()
    .positive(),
  title: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên đề tài')
    .max(200, 'Tên đề tài tối đa 200 ký tự'),
  description: z
    .string()
    .trim()
    .min(1, 'Vui lòng mô tả đề tài bạn muốn làm')
    .max(3000, 'Mô tả tối đa 3000 ký tự'),
  expectedOutcomes: z
    .string()
    .trim()
    .min(1, 'Vui lòng nêu bạn định làm ra được gì')
    .max(3000, 'Yêu cầu đầu ra tối đa 3000 ký tự'),
});

export class CreateProposalDto extends createZodDto(CreateProposalSchema) {}
