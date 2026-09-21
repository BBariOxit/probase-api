import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { passwordSchema } from '../../common/password.schema';

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: passwordSchema,
  })
  .refine(
    (data) => {
      if (data.currentPassword) {
        return data.currentPassword !== data.newPassword;
      }
      return true;
    },
    {
      message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
      path: ['newPassword'],
    },
  );

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
