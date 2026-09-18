import { z } from 'zod';

const MIN_LENGTH = 8;

const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password1',
  'password123',
  'qwertyuiop',
  'qwerty123',
  'iloveyou',
  'admin123',
  'letmein123',
  'welcome1',
  'abc12345',
  '11111111',
  '00000000',
  'sinhvien',
  'matkhau123',
  'probase123',
]);

export const passwordSchema = z
  .string()
  .min(MIN_LENGTH, `Mật khẩu phải có ít nhất ${MIN_LENGTH} ký tự`)
  .max(128, 'Mật khẩu không được dài hơn 128 ký tự')
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), {
    // Says what is wrong with it, because "mật khẩu không hợp lệ" would send
    // someone hunting for a missing capital letter that was never the problem.
    message: 'Mật khẩu này quá phổ biến, hãy chọn mật khẩu khác',
  })
  .refine((value) => !/^(.)\1+$/.test(value), {
    message: 'Mật khẩu không thể chỉ gồm một ký tự lặp lại',
  });
