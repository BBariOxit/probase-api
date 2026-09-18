import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const externalLink = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) => /^https?:\/\//i.test(value),
    'Link phải bắt đầu bằng http:// hoặc https://',
  );

export const CreateSubmissionSchema = z.object({
  requirementId: z.coerce.number('Vui lòng chọn mục cần nộp').int().positive(),
  submissionUrl: externalLink.optional(),
});

export class CreateSubmissionDto extends createZodDto(CreateSubmissionSchema) {}

export const QuerySubmissionsSchema = z.object({
  requirementId: z.coerce.number().int().positive().optional(),

  groupId: z.coerce.number().int().positive().optional(),
  topicId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export class QuerySubmissionsDto extends createZodDto(QuerySubmissionsSchema) {}

export const SubmissionFeedbackSchema = z.object({
  feedback: z
    .string('Vui lòng nhập nhận xét cho nhóm')
    .trim()
    .min(1, 'Vui lòng nhập nhận xét cho nhóm')
    .max(4000),
});

export class SubmissionFeedbackDto extends createZodDto(
  SubmissionFeedbackSchema,
) {}
