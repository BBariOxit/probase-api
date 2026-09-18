import {
  GroupMemberStatus,
  Prisma,
  RegistrationGroupStatus,
} from '../../generated/prisma/client';

export interface RosterFilters {
  semesterId?: number;

  cohorts?: string[];
  cohort?: string;
  majorId?: number;

  class?: string;

  lecturerId?: number;

  hasGroup?: boolean;

  q?: string;

  activeOnly?: boolean;
}

function liveMembership(
  semesterId: number | undefined,
): Prisma.RegistrationGroupMemberWhereInput {
  return {
    ...(semesterId !== undefined && { semesterId }),
    status: GroupMemberStatus.ACCEPTED,
    group: { status: { not: RegistrationGroupStatus.REJECTED } },
  };
}

export function rosterWhere(
  filters: RosterFilters,
): Prisma.StudentProfileWhereInput {
  const membership = liveMembership(filters.semesterId);

  return {
    // A locked or departed account is not somebody the faculty is still
    // administering, so it stays out unless somebody asks for everything.
    ...(filters.activeOnly !== false && { user: { isActive: true } }),

    ...(filters.cohorts?.length && { cohort: { in: filters.cohorts } }),
    ...(filters.cohort && { cohort: filters.cohort }),
    ...(filters.majorId && { majorId: filters.majorId }),
    ...(filters.class && {
      class: { contains: filters.class, mode: 'insensitive' },
    }),

    ...(filters.q && {
      OR: [
        { fullName: { contains: filters.q, mode: 'insensitive' } },
        { studentCode: { contains: filters.q, mode: 'insensitive' } },
      ],
    }),

    /*
      `some` and `none` rather than a boolean column, because holding a place is
      not a fact about the student — it is a row in another table that a leader,
      the office, or the student themselves can remove. Asking the relation is
      the only version that cannot go stale.
    */
    ...(filters.hasGroup === true && {
      groupMemberships: { some: membership },
    }),
    ...(filters.hasGroup === false && {
      groupMemberships: { none: membership },
    }),

    // Supervision reaches through the group to the topic, so it implies having
    // one — a student with no group has no supervisor to be filtered by.
    ...(filters.lecturerId && {
      groupMemberships: {
        some: {
          ...membership,
          group: { topic: { lecturerId: filters.lecturerId } },
        },
      },
    }),
  };
}

export const ROSTER_SELECT = {
  id: true,
  studentCode: true,
  fullName: true,
  class: true,
  cohort: true,
  note: true,
  major: { select: { id: true, name: true, code: true } },
  user: { select: { id: true, email: true, isActive: true, avatarUrl: true } },
} satisfies Prisma.StudentProfileSelect;

export const ROSTER_MEMBERSHIP_SELECT = {
  select: {
    group: {
      select: {
        id: true,
        name: true,
        topic: {
          select: {
            id: true,
            title: true,
            round: {
              select: {
                projectType: { select: { id: true, name: true, code: true } },
              },
            },
            lecturer: {
              select: { id: true, fullName: true, academicTitle: true },
            },
          },
        },
      },
    },
  },
  take: 1,
} satisfies { select: Prisma.RegistrationGroupMemberSelect; take: number };

export function liveMembershipWhere(semesterId: number | undefined) {
  return liveMembership(semesterId);
}
