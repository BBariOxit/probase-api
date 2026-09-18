import { Prisma } from '../../generated/prisma/client';

interface AdapterCause {
  originalMessage?: unknown;
  constraint?: { fields?: unknown; index?: unknown };
}

function adapterCause(
  err: Prisma.PrismaClientKnownRequestError,
): AdapterCause | null {
  const adapterError = (
    err.meta as { driverAdapterError?: unknown } | undefined
  )?.driverAdapterError;

  if (typeof adapterError !== 'object' || adapterError === null) return null;

  const cause = (adapterError as { cause?: unknown }).cause;
  if (typeof cause !== 'object' || cause === null) return null;

  return cause;
}

export function isUniqueViolation(
  err: unknown,
): err is Prisma.PrismaClientKnownRequestError {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}

export function uniqueConstraintName(
  err: Prisma.PrismaClientKnownRequestError,
): string {
  const cause = adapterCause(err);
  const index = cause?.constraint?.index;
  if (typeof index === 'string') return index.toLowerCase();

  // Postgres puts the name in the message text even when nothing structured
  // carries it: `... violates unique constraint "some_index_name"`.
  const message = cause?.originalMessage;
  if (typeof message === 'string') {
    const quoted = /unique constraint "([^"]+)"/.exec(message);
    if (quoted) return quoted[1].toLowerCase();
  }

  return '';
}

export function uniqueConstraintFields(
  err: Prisma.PrismaClientKnownRequestError,
): string[] {
  const fields = adapterCause(err)?.constraint?.fields;

  if (Array.isArray(fields)) {
    return fields.map((field) =>
      String(field).replace(/"/g, '').trim().toLowerCase(),
    );
  }

  // Pre-adapter shape: a plain array of column names, or a single string.
  const target = err.meta?.target;
  if (Array.isArray(target)) {
    return (target as unknown[]).map((field) => String(field).toLowerCase());
  }

  return typeof target === 'string' ? [target.toLowerCase()] : [];
}
