import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim())
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional();

export const UpdateMyProfileSchema = z
  .object({
    phone: optionalText(20),
    bio: optionalText(2000),

    academicTitle: optionalText(100),
    researchInterests: optionalText(1000),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    {
      message: 'Không có thay đổi nào để lưu',
    },
  );

export class UpdateMyProfileDto extends createZodDto(UpdateMyProfileSchema) {}

export const LECTURER_ONLY_FIELDS = [
  'academicTitle',
  'researchInterests',
] as const;
