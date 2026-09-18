import { rosterWhere } from './student-roster.query';

describe('rosterWhere', () => {
  const liveIn = (semesterId: number) => ({
    semesterId,
    status: 'ACCEPTED',
    group: { status: { not: 'REJECTED' } },
  });

  describe('what counts as holding a place', () => {
    it('asks for a live membership when looking for students who have one', () => {
      const where = rosterWhere({ semesterId: 7, hasGroup: true });

      expect(where.groupMemberships).toEqual({ some: liveIn(7) });
    });

    it('asks for the absence of that same membership for students who do not', () => {
      const where = rosterWhere({ semesterId: 7, hasGroup: false });

      expect(where.groupMemberships).toEqual({ none: liveIn(7) });
    });

    it('uses one definition for both directions', () => {
      const has = rosterWhere({ semesterId: 3, hasGroup: true });
      const hasNot = rosterWhere({ semesterId: 3, hasGroup: false });

      expect((has.groupMemberships as { some: unknown }).some).toEqual(
        (hasNot.groupMemberships as { none: unknown }).none,
      );
    });

    it('leaves membership alone when nobody asked about it', () => {
      expect(rosterWhere({ semesterId: 3 }).groupMemberships).toBeUndefined();
    });

    it('does not count a membership in a rejected group', () => {
      const where = rosterWhere({ semesterId: 1, hasGroup: true });
      const some = (where.groupMemberships as { some: { group: unknown } })
        .some;

      expect(some.group).toEqual({ status: { not: 'REJECTED' } });
    });

    it('omits the term rather than guessing one', () => {
      const where = rosterWhere({ hasGroup: false });
      const none = (where.groupMemberships as { none: object }).none;

      expect(none).not.toHaveProperty('semesterId');
    });
  });

  describe('filters', () => {
    it('narrows to the intakes a round declares', () => {
      expect(rosterWhere({ cohorts: ['2022', '2023'] }).cohort).toEqual({
        in: ['2022', '2023'],
      });
    });

    it('ignores an empty intake list rather than matching everybody by accident', () => {
      expect(rosterWhere({ cohorts: [] }).cohort).toBeUndefined();
    });

    it('searches a name and a student code together', () => {
      expect(rosterWhere({ q: 'nguyen' }).OR).toEqual([
        { fullName: { contains: 'nguyen', mode: 'insensitive' } },
        { studentCode: { contains: 'nguyen', mode: 'insensitive' } },
      ]);
    });

    it('matches a class code loosely, because it is typed by hand', () => {
      expect(rosterWhere({ class: 'ctk46' }).class).toEqual({
        contains: 'ctk46',
        mode: 'insensitive',
      });
    });

    it('reaches a supervisor through the group that holds their topic', () => {
      const where = rosterWhere({ semesterId: 5, lecturerId: 9 });
      const some = (
        where.groupMemberships as { some: { group: { topic: unknown } } }
      ).some;

      expect(some.group.topic).toEqual({ lecturerId: 9 });
      expect(some).toMatchObject({ semesterId: 5, status: 'ACCEPTED' });
    });
  });

  describe('who is in the list at all', () => {
    it('leaves out locked and departed accounts by default', () => {
      expect(rosterWhere({}).user).toEqual({ isActive: true });
    });

    it('includes them only when somebody asks for everything', () => {
      expect(rosterWhere({ activeOnly: false }).user).toBeUndefined();
    });
  });

  it('builds nothing at all from no filters', () => {
    expect(rosterWhere({ activeOnly: false })).toEqual({});
  });
});
