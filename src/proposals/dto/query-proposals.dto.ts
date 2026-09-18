import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { TopicProposalStatus } from '../../../generated/prisma/client';

export const QueryProposalsSchema = z.object({
  status: z.enum(TopicProposalStatus).optional(),
  semesterId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export class QueryProposalsDto extends createZodDto(QueryProposalsSchema) {}
