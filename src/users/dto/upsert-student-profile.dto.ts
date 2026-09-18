import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { checkClassCode } from '../class-code.util';
import { cohortFromStudentCode } from '../student-code.util';

export const UpsertStudentProfileSchema = z
  .object({
    studentCode: z
      .string()
      .transform((val) => val.trim())
      .pipe(
        z
          .string()
          .regex(
            /^\d{7}$/,
            'Mã sinh viên phải gồm 7 chữ số: 2 số khoá và 5 số thứ tự',
          ),
      ),
    fullName: z
      .string()
      .min(1, 'Vui lòng nhập họ tên')
      .max(255)
      .transform((val) => val.trim()),
    majorId: z.number().int().positive().optional().nullable(),
    class: z.string().max(100).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    bio: z.string().max(2000).optional().nullable(),

    note: z.string().max(2000).optional().nullable(),
  })
  // The same rule bulk import applies, so the hand-typed path cannot create the
  // row that the spreadsheet path rejects. Only an outright contradiction is
  // refused here; an unrecognised class shape is accepted, and the import's
  // per-row warning has no equivalent to be carried on a single response.
  .refine(
    (input) =>
      checkClassCode(input.class ?? undefined, input.studentCode).status !==
      'contradiction',
    {
      path: ['class'],
      message:
        'Mã lớp và mã sinh viên không khớp năm khoá — sửa lại cái nào sai',
    },
  )
  .transform((input) => ({
    ...input,
    // Non-null by construction — the regex above has already checked the shape.
    cohort: cohortFromStudentCode(input.studentCode)!,
  }));

export class UpsertStudentProfileDto extends createZodDto(
  UpsertStudentProfileSchema,
) {}
