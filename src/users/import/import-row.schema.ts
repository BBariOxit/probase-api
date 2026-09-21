import { z } from 'zod';
import { emailSchema } from '../../common/email.schema';
import {
  cohortFromStudentCode,
  studentCodeMatchesEmail,
} from '../student-code.util';

// Expected spreadsheet columns (header names, case-insensitive):
// email, role, fullName, code, majorCode (STUDENT), class, academicTitle,
// researchInterests (LECTURER-only, optional), phone, bio (optional, both
// roles).
//
// There is deliberately no `cohort` column any more: it is derived from the
// student code, which is the same string as the email's local part.

const StudentImportRowSchema = z
  .object({
    role: z.literal('STUDENT'),
    email: emailSchema,
    fullName: z.string().min(1, 'fullName is required').max(255),
    code: z
      .string()
      .trim()
      .regex(
        /^\d{7}$/,
        'code must be a 7-digit student number (2 digits intake year + 5 digits sequence)',
      ),
    majorCode: z
      .string()
      .min(1, 'majorCode is required for STUDENT rows')
      .max(50),
    // Not free text: a class code re-encodes the intake and the major, both of
    // which arrive on this row from elsewhere. UsersService cross-checks it —
    // the intake against the student code here on the row, and the major against
    // every other row sharing the same class code. See class-code.util.ts.
    class: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    bio: z.string().max(2000).optional(),
  })
  // Checked here rather than in the service so a mismatched row fails as a
  // validation error alongside every other bad field, instead of surviving
  // into an account whose cohort silently disagrees with its address.
  .refine((row) => studentCodeMatchesEmail(row.code, row.email), {
    path: ['email'],
    message: 'email must start with the student code (e.g. 2212345@dlu.edu.vn)',
  })
  .transform((row) => ({
    ...row,
    // Non-null by construction: the regex above has already guaranteed the
    // shape this reads.
    cohort: cohortFromStudentCode(row.code)!,
  }));

const LecturerImportRowSchema = z.object({
  role: z.literal('LECTURER'),
  email: emailSchema,
  fullName: z.string().min(1, 'fullName is required').max(255),
  code: z.string().min(1, 'code is required').max(50),
  academicTitle: z.string().max(100).optional(),
  researchInterests: z.string().max(1000).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(2000).optional(),
});

export const ImportRowSchema = z.discriminatedUnion('role', [
  StudentImportRowSchema,
  LecturerImportRowSchema,
]);

export type StudentImportRow = z.infer<typeof StudentImportRowSchema>;
export type LecturerImportRow = z.infer<typeof LecturerImportRowSchema>;
export type ImportRow = z.infer<typeof ImportRowSchema>;

const asOptional = (value: string | undefined) =>
  value && value.length > 0 ? value : undefined;

/**
 * Convert a raw row (header-keyed by the file's original column names,
 * lowercased) to the canonical input shape for ImportRowSchema.
 *
 * Used by the legacy single-step bulk-import path where the file must already
 * use the standard English column names.
 */
export function toImportRowInput(raw: Record<string, string>): unknown {
  return {
    role: asOptional(raw.role)?.toUpperCase(),
    email: asOptional(raw.email),
    fullName: asOptional(raw.fullname),
    code: asOptional(raw.code),
    majorCode: asOptional(raw.majorcode),
    class: asOptional(raw.class),
    academicTitle: asOptional(raw.academictitle),
    researchInterests: asOptional(raw.researchinterests),
    phone: asOptional(raw.phone),
    bio: asOptional(raw.bio),
  };
}

/**
 * Convert a pre-mapped field object (already keyed by SystemField names) to
 * the canonical input shape for ImportRowSchema.
 *
 * Used by the wizard import path after `applyMapping()` has been called.
 */
export function toImportRowInputFromMapped(
  mapped: Record<string, string | undefined>,
): unknown {
  return {
    role: mapped.role ? mapped.role.toUpperCase() : undefined,
    email: mapped.email || undefined,
    fullName: mapped.fullName || undefined,
    code: mapped.code || undefined,
    majorCode: mapped.majorCode || undefined,
    class: mapped.class || undefined,
    academicTitle: mapped.academicTitle || undefined,
    researchInterests: mapped.researchInterests || undefined,
    phone: mapped.phone || undefined,
    bio: mapped.bio || undefined,
  };
}

export function formatImportRowError(error: z.ZodError): string {
  return error.issues
    .map((issue) =>
      issue.path.length
        ? `${issue.path.join('.')}: ${issue.message}`
        : issue.message,
    )
    .join('; ');
}
