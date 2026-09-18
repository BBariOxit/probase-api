import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { AllocationMode } from '../../../generated/prisma/client';

export const CohortSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, 'Khóa phải là năm nhập học gồm bốn chữ số');

export const RoundPlanSchema = z
  .object({
    projectTypeId: z.coerce.number().int().positive(),
    registrationStart: z.coerce.date(),
    registrationEnd: z.coerce.date(),

    cohorts: z.array(CohortSchema).min(1).max(20),
    allocationMode: z.enum(AllocationMode).optional(),
  })
  .refine((plan) => plan.registrationEnd > plan.registrationStart, {
    message: 'Ngày kết thúc đăng ký phải sau ngày mở đăng ký',
    path: ['registrationEnd'],
  });

export const SetSemesterRoundsSchema = z
  .object({ rounds: z.array(RoundPlanSchema).min(1).max(20) })
  .refine(
    (body) =>
      new Set(body.rounds.map((round) => round.projectTypeId)).size ===
      body.rounds.length,
    {
      message: 'Mỗi loại đồ án chỉ được khai một đợt trong học kỳ',
      path: ['rounds'],
    },
  );

export class SetSemesterRoundsDto extends createZodDto(
  SetSemesterRoundsSchema,
) {}
