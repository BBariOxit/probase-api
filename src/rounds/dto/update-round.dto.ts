import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { AllocationMode } from '../../../generated/prisma/client';
import { CohortSchema } from './set-semester-rounds.dto';

export const UpdateRoundSchema = z.object({
  registrationStart: z.coerce.date().optional(),
  registrationEnd: z.coerce.date().optional(),
  cohorts: z.array(CohortSchema).min(1).max(20).optional(),
  allocationMode: z.enum(AllocationMode).optional(),
});

export class UpdateRoundDto extends createZodDto(UpdateRoundSchema) {}
