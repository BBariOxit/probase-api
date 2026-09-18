import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UnlockRoundSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập lý do mở khoá')
    .max(500, 'Lý do mở khoá tối đa 500 ký tự'),
});

export class UnlockRoundDto extends createZodDto(UnlockRoundSchema) {}
