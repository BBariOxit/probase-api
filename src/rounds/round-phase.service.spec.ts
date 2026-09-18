import { RoundPhase } from '../../generated/prisma/client';
import { duePhase } from './round-phase.service';

describe('duePhase', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const daysFromNow = (days: number) => new Date(Date.now() + days * DAY);

  describe('PREP', () => {
    it('waits while the start date is still ahead', () => {
      expect(
        duePhase({
          phase: RoundPhase.PREP,
          registrationStart: daysFromNow(3),
          registrationEnd: daysFromNow(20),
        }),
      ).toBe(RoundPhase.PREP);
    });

    it('opens once the start date has passed', () => {
      expect(
        duePhase({
          phase: RoundPhase.PREP,
          registrationStart: daysFromNow(-1),
          registrationEnd: daysFromNow(20),
        }),
      ).toBe(RoundPhase.OPEN);
    });

    it('goes straight to RECONCILING when both dates are already past', () => {
      expect(
        duePhase({
          phase: RoundPhase.PREP,
          registrationStart: daysFromNow(-30),
          registrationEnd: daysFromNow(-2),
        }),
      ).toBe(RoundPhase.RECONCILING);
    });
  });

  describe('the day a date names', () => {
    const named = (day: string) => new Date(`${day}T00:00:00.000Z`);

    afterEach(() => jest.useRealTimers());

    function at(instant: string) {
      jest.useFakeTimers().setSystemTime(new Date(instant));
    }

    it('keeps the gate open through the whole of its closing day', () => {
      // Midday in Vietnam on the 2nd. Read literally the gate shut at 07:00.
      at('2026-09-02T05:00:00.000Z');

      expect(
        duePhase({
          phase: RoundPhase.OPEN,
          registrationStart: named('2026-08-20'),
          registrationEnd: named('2026-09-02'),
        }),
      ).toBe(RoundPhase.OPEN);
    });

    it('closes it once that day is over', () => {
      // One minute past midnight in Vietnam on the 3rd.
      at('2026-09-02T17:01:00.000Z');

      expect(
        duePhase({
          phase: RoundPhase.OPEN,
          registrationStart: named('2026-08-20'),
          registrationEnd: named('2026-09-02'),
        }),
      ).toBe(RoundPhase.RECONCILING);
    });

    it('opens from the first minute of the opening day, not from breakfast', () => {
      // One in the morning in Vietnam on the 2nd: the day has begun, and the
      // literal reading would still have the round shut for six more hours.
      at('2026-09-01T18:00:00.000Z');

      expect(
        duePhase({
          phase: RoundPhase.PREP,
          registrationStart: named('2026-09-02'),
          registrationEnd: named('2026-09-20'),
        }),
      ).toBe(RoundPhase.OPEN);
    });
  });

  describe('OPEN', () => {
    it('stays open until the deadline is genuinely past', () => {
      expect(
        duePhase({
          phase: RoundPhase.OPEN,
          registrationStart: daysFromNow(-10),
          registrationEnd: daysFromNow(1),
        }),
      ).toBe(RoundPhase.OPEN);
    });

    it('closes once the deadline has passed', () => {
      expect(
        duePhase({
          phase: RoundPhase.OPEN,
          registrationStart: daysFromNow(-10),
          registrationEnd: daysFromNow(-1),
        }),
      ).toBe(RoundPhase.RECONCILING);
    });
  });

  describe('EXTENDED', () => {
    it('runs until the extended deadline', () => {
      expect(
        duePhase({
          phase: RoundPhase.EXTENDED,
          registrationStart: daysFromNow(-30),
          registrationEnd: daysFromNow(2),
        }),
      ).toBe(RoundPhase.EXTENDED);
    });

    it('falls back to RECONCILING when the extension runs out', () => {
      expect(
        duePhase({
          phase: RoundPhase.EXTENDED,
          registrationStart: daysFromNow(-30),
          registrationEnd: daysFromNow(-1),
        }),
      ).toBe(RoundPhase.RECONCILING);
    });
  });

  describe('phases no date may leave', () => {
    it('keeps RECONCILING even if the deadline is moved into the future', () => {
      expect(
        duePhase({
          phase: RoundPhase.RECONCILING,
          registrationStart: daysFromNow(-30),
          registrationEnd: daysFromNow(7),
        }),
      ).toBe(RoundPhase.RECONCILING);
    });

    it('keeps FINALIZED even if the whole window is still ahead', () => {
      expect(
        duePhase({
          phase: RoundPhase.FINALIZED,
          registrationStart: daysFromNow(5),
          registrationEnd: daysFromNow(30),
        }),
      ).toBe(RoundPhase.FINALIZED);
    });
  });
});
