import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ROSTER_MEMBERSHIP_SELECT,
  ROSTER_SELECT,
  liveMembershipWhere,
  rosterWhere,
  type RosterFilters,
} from './student-roster.query';

@Injectable()
export class StudentRosterService {
  constructor(private readonly prisma: PrismaService) {}

  async find(
    filters: RosterFilters,
    paging?: { skip: number; take: number },
  ): Promise<RosterRow[]> {
    const rows = await this.prisma.studentProfile.findMany({
      where: rosterWhere(filters),
      select: {
        ...ROSTER_SELECT,
        groupMemberships: {
          ...ROSTER_MEMBERSHIP_SELECT,
          where: liveMembershipWhere(filters.semesterId),
        },
      },
      orderBy: { studentCode: 'asc' },
      ...(paging && { skip: paging.skip, take: paging.take }),
    });

    return rows.map(render);
  }

  count(filters: RosterFilters): Promise<number> {
    return this.prisma.studentProfile.count({ where: rosterWhere(filters) });
  }
}

function render(row: {
  id: number;
  studentCode: string;
  fullName: string;
  class: string | null;
  cohort: string | null;
  note: string | null;
  major: { id: number; name: string; code: string } | null;
  user: {
    id: number;
    email: string;
    isActive: boolean;
    avatarUrl: string | null;
  };
  groupMemberships: {
    group: {
      id: number;
      name: string | null;
      topic: {
        id: number;
        title: string;
        round: { projectType: { id: number; name: string; code: string } };
        lecturer: {
          id: number;
          fullName: string;
          academicTitle: string | null;
        };
      };
    };
  }[];
}) {
  const { user, groupMemberships, ...student } = row;
  const held = groupMemberships[0]?.group;

  return {
    ...student,
    userId: user.id,
    email: user.email,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
    group: held
      ? {
          id: held.id,
          name: held.name,
          topic: {
            id: held.topic.id,
            title: held.topic.title,
            projectType: held.topic.round.projectType,
            lecturer: held.topic.lecturer,
          },
        }
      : null,
  };
}

export type RosterRow = ReturnType<typeof render>;
export type { RosterFilters };
