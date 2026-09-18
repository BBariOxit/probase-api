import { SetMetadata } from '@nestjs/common';

export const ALLOW_TEMP_PASSWORD_KEY = 'allowTempPassword';

export const AllowTempPassword = () =>
  SetMetadata(ALLOW_TEMP_PASSWORD_KEY, true);
