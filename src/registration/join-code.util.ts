import { randomBytes } from 'crypto';

export const SEAT_HOLD_HOURS = 24;

export function generateJoinCode(): string {
  return randomBytes(16).toString('base64url');
}

export function holdExpiryFromNow(): Date {
  return new Date(Date.now() + SEAT_HOLD_HOURS * 60 * 60 * 1000);
}

export function isHoldActive(holdUntil: Date | null): boolean {
  return holdUntil !== null && holdUntil.getTime() > Date.now();
}
