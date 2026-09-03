import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const QuerySupervisedGroupsSchema = z.object({
  /** Defaults to the active semester when omitted. */
  semesterId: z.coerce.number().int().positive().optional(),
});

export class QuerySupervisedGroupsDto extends createZodDto(
  QuerySupervisedGroupsSchema,
) {}
