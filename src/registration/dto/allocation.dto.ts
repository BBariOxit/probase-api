import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const PlaceStudentSchema = z.object({
  studentId: z.coerce.number('Vui lòng chọn sinh viên').int().positive(),
  topicId: z.coerce.number('Vui lòng chọn đề tài').int().positive(),
});

export class PlaceStudentDto extends createZodDto(PlaceStudentSchema) {}

export const FinalizeRoundSchema = z
  .object({
    acknowledgeUnplaced: z.coerce.boolean().default(false),
    reason: z.string().trim().max(500).optional(),
  })
  .refine(
    (input) => !input.acknowledgeUnplaced || (input.reason?.length ?? 0) > 0,
    {
      path: ['reason'],
      message:
        'Vui lòng ghi lý do chốt đợt khi vẫn còn sinh viên chưa được xếp',
    },
  );

export class FinalizeRoundDto extends createZodDto(FinalizeRoundSchema) {}
