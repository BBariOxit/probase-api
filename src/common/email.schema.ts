import { z } from 'zod';

export const emailSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.email('Email không đúng định dạng'));
