import { RegistrationGroupStatus } from '../../generated/prisma/client';

export function statusForSeats(
  occupied: number,
  capacity: number,
): RegistrationGroupStatus {
  return occupied >= capacity
    ? RegistrationGroupStatus.SUBMITTED
    : RegistrationGroupStatus.FORMING;
}
