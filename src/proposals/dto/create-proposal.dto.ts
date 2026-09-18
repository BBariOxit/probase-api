import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateProposalSchema = z.object({
  projectTypeId: z.coerce.number().int().positive(),
  requestedLecturerId: z.coerce
    .number('Vui lòng chọn giảng viên bạn muốn gửi đề xuất')
    .int()
    .positive(),
  title: z.string().trim().min(1, 'Vui lòng nhập tên đề tài').max(255),
  description: z.string().trim().min(1, 'Vui lòng mô tả đề tài bạn muốn làm'),
  expectedOutcomes: z
    .string()
    .trim()
    .min(1, 'Vui lòng nêu bạn định làm ra được gì'),
});

export class CreateProposalDto extends createZodDto(CreateProposalSchema) {}
