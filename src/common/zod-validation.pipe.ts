import { BadRequestException, HttpStatus } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';

interface ZodIssueLike {
  message?: unknown;
  path?: unknown;
}

function firstIssueMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('issues' in error)) return null;

  const { issues } = error;
  if (!Array.isArray(issues) || issues.length === 0) return null;

  const [first] = issues as ZodIssueLike[];
  return typeof first.message === 'string' ? first.message : null;
}

class ValidationException extends BadRequestException {
  constructor(error: unknown) {
    const issues =
      error && typeof error === 'object' && 'issues' in error
        ? error.issues
        : undefined;

    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: firstIssueMessage(error) ?? 'Dữ liệu không hợp lệ',
      errors: issues,
    });
  }
}

export const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error) => new ValidationException(error),
});
