import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RequirementSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Tên tài liệu không được để trống')
    .max(100, 'Tên tài liệu tối đa 100 ký tự'),
  dueAt: z.coerce.date(),

  isRequired: z.boolean().default(true),
});

export const SetRequirementsSchema = z
  .object({
    // Ten is not a business rule, it is a guard against a paste. A faculty
    // asking for more than ten separate documents from one project has a
    // process problem this screen cannot fix.
    requirements: z.array(RequirementSchema).max(10),
  })
  .refine(
    (body) =>
      new Set(body.requirements.map((one) => one.name.trim().toLowerCase()))
        .size === body.requirements.length,
    {
      message: 'Hai tài liệu trùng tên — sinh viên sẽ không biết chọn cái nào',
      path: ['requirements'],
    },
  );

export class SetRequirementsDto extends createZodDto(SetRequirementsSchema) {}
