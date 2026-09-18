import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateGroupSchema = z
  .object({
    name: z.string().trim().min(1).max(120).nullable().optional(),
    openForJoin: z.boolean().optional(),

    declaredSize: z.coerce.number().int().min(2).max(10).nullable().optional(),

    releaseHold: z.literal(true).optional(),

    leaderId: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    {
      message: 'Không có thay đổi nào để lưu',
    },
  );

export class UpdateGroupDto extends createZodDto(UpdateGroupSchema) {}
