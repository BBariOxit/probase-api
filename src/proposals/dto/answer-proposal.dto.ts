import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AcceptProposalSchema = z.object({
  // The same ceiling as a lecturer's own topic, so the two paths cannot produce
  // topics the rest of the system treats differently.
  maxStudents: z.coerce
    .number('Vui lòng nhập số sinh viên tối đa')
    .int()
    .min(1)
    .max(10),
});

export class AcceptProposalDto extends createZodDto(AcceptProposalSchema) {}

export const RejectProposalSchema = z.object({
  feedback: z
    .string('Vui lòng cho sinh viên biết vì sao đề xuất chưa được nhận')
    .trim()
    .min(1, 'Vui lòng cho sinh viên biết vì sao đề xuất chưa được nhận')
    .max(2000),
});

export class RejectProposalDto extends createZodDto(RejectProposalSchema) {}
