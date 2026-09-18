import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ExtendRoundSchema = z.object({
  registrationEnd: z.coerce.date(),
  reason: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập lý do gia hạn')
    .max(500, 'Lý do gia hạn tối đa 500 ký tự'),
});

export class ExtendRoundDto extends createZodDto(ExtendRoundSchema) {}
