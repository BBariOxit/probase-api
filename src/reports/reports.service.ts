import { Injectable, NotFoundException } from '@nestjs/common';
import {
  GroupJoinSource,
  GroupMemberStatus,
  RegistrationGroupStatus,
  RoundPhase,
  TopicStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RoundPhaseService } from '../rounds/round-phase.service';
import { StudentRosterService } from '../students/student-roster.service';

export interface RoundReport {
  roundId: number;
  projectType: { id: number; name: string; code: string };
  phase: RoundPhase;
  cohorts: string[];

  eligible: number;
  withGroup: number;
  withoutGroup: number;

  selfRegistered: number;

  assigned: number;
  topics: number;
  topicsUnderway: number;
}

export interface SupervisionReport {
  lecturerId: number;
  fullName: string;
  academicTitle: string | null;
  groups: number;
  students: number;
}

export interface MajorReport {
  majorId: number;
  name: string;
  code: string;
  students: number;
  withGroup: number;
}

export interface ProgressReport {
  roundId: number;
  projectType: { id: number; name: string; code: string };
  groups: number;

  required: number;

  complete: number;

  awaitingFeedback: number;

  items: {
    requirementId: number;
    name: string;
    dueAt: Date;
    isRequired: boolean;
    submitted: number;
  }[];
}

export interface FacultyReport {
  semester: { id: number; name: string; code: string };
  rounds: RoundReport[];
  supervision: SupervisionReport[];
  majors: MajorReport[];
  progress: ProgressReport[];
}

const LIVE_MEMBERSHIP = {
  status: GroupMemberStatus.ACCEPTED,
  group: { status: { not: RegistrationGroupStatus.REJECTED } },
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phases: RoundPhaseService,
    private readonly roster: StudentRosterService,
  ) {}

  async summary(semesterId?: number): Promise<FacultyReport> {
    const semester = await this.requireSemester(semesterId);

    const rounds = await this.prisma.registrationRound.findMany({
      where: { semesterId: semester.id },
      select: {
        id: true,
        semesterId: true,
        phase: true,
        registrationStart: true,
        registrationEnd: true,
        projectType: { select: { id: true, name: true, code: true } },
        eligibilities: { select: { cohort: true }, orderBy: { cohort: 'asc' } },
      },
      orderBy: { projectTypeId: 'asc' },
    });

    const [
      phases,
      memberships,
      groups,
      topics,
      majors,
      submissions,
      requirements,
    ] = await Promise.all([
      this.phases.resolveMany(rounds),
      this.memberships(semester.id),
      this.groups(semester.id),
      this.topicCounts(semester.id),
      this.majorTotals(),
      this.submissions(semester.id),
      this.requirements(semester.id),
    ]);

    return {
      semester,
      rounds: await this.registrationRows(rounds, phases, memberships, topics),
      supervision: await this.supervisionRows(groups, memberships),
      majors: this.majorRows(majors, memberships),
      progress: this.progressRows(rounds, groups, submissions, requirements),
    };
  }

  // ── the three sections ────────────────────────────────────

  private async registrationRows(
    rounds: RoundRow[],
    phases: Map<number, RoundPhase>,
    memberships: Membership[],
    topics: Map<number, { total: number; underway: number }>,
  ): Promise<RoundReport[]> {
    return Promise.all(
      rounds.map(async (round) => {
        const cohorts = round.eligibilities.map((rule) => rule.cohort);

        // Asked of the shared roster rather than counted here, so "has a topic"
        // means the same thing on this screen as it does on the faculty list and
        // the allocation desk.
        const [eligible, withGroup] = await Promise.all([
          this.roster.count({ cohorts }),
          this.roster.count({
            semesterId: round.semesterId,
            cohorts,
            hasGroup: true,
          }),
        ]);

        const inRound = memberships.filter(
          (member) => member.roundId === round.id,
        );
        const seats = topics.get(round.id) ?? { total: 0, underway: 0 };

        return {
          roundId: round.id,
          projectType: round.projectType,
          phase: phases.get(round.id) ?? round.phase,
          cohorts,
          eligible,
          withGroup,
          withoutGroup: Math.max(0, eligible - withGroup),
          selfRegistered: inRound.filter(
            (member) => member.joinSource !== GroupJoinSource.ASSIGNED,
          ).length,
          assigned: inRound.filter(
            (member) => member.joinSource === GroupJoinSource.ASSIGNED,
          ).length,
          topics: seats.total,
          topicsUnderway: seats.underway,
        };
      }),
    );
  }

  private async supervisionRows(
    groups: GroupRow[],
    memberships: Membership[],
  ): Promise<SupervisionReport[]> {
    const groupsBy = tally(groups.map((group) => group.lecturerId));
    const studentsBy = tally(memberships.map((member) => member.lecturerId));

    const ids = [...groupsBy.keys()];
    if (ids.length === 0) return [];

    const lecturers = await this.prisma.lecturerProfile.findMany({
      where: { id: { in: ids } },
      select: { id: true, fullName: true, academicTitle: true },
    });

    return lecturers
      .map((lecturer) => ({
        lecturerId: lecturer.id,
        fullName: lecturer.fullName,
        academicTitle: lecturer.academicTitle,
        groups: groupsBy.get(lecturer.id) ?? 0,
        students: studentsBy.get(lecturer.id) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.students - a.students || a.fullName.localeCompare(b.fullName),
      );
  }

  private majorRows(
    majors: MajorTotal[],
    memberships: Membership[],
  ): MajorReport[] {
    const placed = tally(
      memberships.flatMap((member) =>
        member.majorId === null ? [] : [member.majorId],
      ),
    );

    return majors
      .map((major) => ({
        majorId: major.id,
        name: major.name,
        code: major.code,
        students: major.students,
        withGroup: placed.get(major.id) ?? 0,
      }))
      .sort((a, b) => b.students - a.students);
  }

  private progressRows(
    rounds: RoundRow[],
    groups: GroupRow[],
    submissions: SubmissionRow[],
    requirements: RequirementRow[],
  ): ProgressReport[] {
    const newest = newestPerGroupAndRequirement(submissions);

    return rounds.map((round) => {
      const ids = new Set(
        groups
          .filter((group) => group.roundId === round.id)
          .map((group) => group.id),
      );
      const mine = newest.filter((row) => ids.has(row.groupId));
      const items = requirements.filter((one) => one.roundId === round.id);
      const required = items.filter((one) => one.isRequired);

      return {
        roundId: round.id,
        projectType: round.projectType,
        groups: ids.size,
        required: required.length,
        complete: [...ids].filter((groupId) =>
          required.every((one) =>
            mine.some(
              (row) => row.groupId === groupId && row.requirementId === one.id,
            ),
          ),
        ).length,
        awaitingFeedback: new Set(
          mine
            .filter((row) => row.feedbackAt === null)
            .map((row) => row.groupId),
        ).size,
        items: items.map((one) => ({
          requirementId: one.id,
          name: one.name,
          dueAt: one.dueAt,
          isRequired: one.isRequired,
          submitted: mine.filter((row) => row.requirementId === one.id).length,
        })),
      };
    });
  }

  // ── the reads ─────────────────────────────────────────────

  private async memberships(semesterId: number): Promise<Membership[]> {
    const rows = await this.prisma.registrationGroupMember.findMany({
      where: { semesterId, ...LIVE_MEMBERSHIP },
      select: {
        joinSource: true,
        student: { select: { majorId: true } },
        group: {
          select: { topic: { select: { roundId: true, lecturerId: true } } },
        },
      },
    });

    return rows.map((row) => ({
      joinSource: row.joinSource,
      majorId: row.student.majorId,
      roundId: row.group.topic.roundId,
      lecturerId: row.group.topic.lecturerId,
    }));
  }

  private async groups(semesterId: number): Promise<GroupRow[]> {
    const rows = await this.prisma.registrationGroup.findMany({
      where: { semesterId, status: { not: RegistrationGroupStatus.REJECTED } },
      select: {
        id: true,
        topic: { select: { roundId: true, lecturerId: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      roundId: row.topic.roundId,
      lecturerId: row.topic.lecturerId,
    }));
  }

  private async topicCounts(semesterId: number) {
    const rows = await this.prisma.topic.groupBy({
      by: ['roundId', 'status'],
      where: { semesterId },
      _count: { _all: true },
    });

    const counts = new Map<number, { total: number; underway: number }>();

    for (const row of rows) {
      const entry = counts.get(row.roundId) ?? { total: 0, underway: 0 };

      entry.total += row._count._all;
      if (row.status === TopicStatus.IN_PROGRESS) {
        entry.underway += row._count._all;
      }

      counts.set(row.roundId, entry);
    }

    return counts;
  }

  private async majorTotals(): Promise<MajorTotal[]> {
    const [majors, counts] = await Promise.all([
      this.prisma.major.findMany({
        select: { id: true, name: true, code: true },
      }),
      this.prisma.studentProfile.groupBy({
        by: ['majorId'],
        where: { user: { isActive: true } },
        _count: { _all: true },
      }),
    ]);

    const byMajor = new Map(
      counts.map((row) => [row.majorId, row._count._all]),
    );

    return majors.map((major) => ({
      ...major,
      students: byMajor.get(major.id) ?? 0,
    }));
  }

  private async submissions(semesterId: number): Promise<SubmissionRow[]> {
    return this.prisma.submission.findMany({
      where: {
        group: {
          semesterId,
          status: { not: RegistrationGroupStatus.REJECTED },
        },
      },
      select: {
        groupId: true,
        requirementId: true,
        version: true,
        feedbackAt: true,
      },
    });
  }

  private async requirements(semesterId: number): Promise<RequirementRow[]> {
    return this.prisma.submissionRequirement.findMany({
      where: { round: { semesterId } },
      select: {
        id: true,
        roundId: true,
        name: true,
        dueAt: true,
        isRequired: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  private async requireSemester(semesterId?: number) {
    const semester = semesterId
      ? await this.prisma.semester.findUnique({
          where: { id: semesterId },
          select: { id: true, name: true, code: true },
        })
      : await this.prisma.semester.findFirst({
          where: { isActive: true },
          select: { id: true, name: true, code: true },
        });

    if (!semester) {
      throw new NotFoundException(
        semesterId
          ? `Không tìm thấy học kỳ ${semesterId}`
          : 'Khoa chưa mở học kỳ nào, nên chưa có gì để thống kê.',
      );
    }

    return semester;
  }
}

// ── shapes the sections above are counted from ──────────────

type RoundRow = {
  id: number;
  semesterId: number;
  phase: RoundPhase;
  registrationStart: Date;
  registrationEnd: Date;
  projectType: { id: number; name: string; code: string };
  eligibilities: { cohort: string }[];
};

interface Membership {
  joinSource: GroupJoinSource;
  majorId: number | null;
  roundId: number;
  lecturerId: number;
}

interface GroupRow {
  id: number;
  roundId: number;
  lecturerId: number;
}

interface MajorTotal {
  id: number;
  name: string;
  code: string;
  students: number;
}

interface SubmissionRow {
  groupId: number;
  requirementId: number;
  version: number;
  feedbackAt: Date | null;
}

interface RequirementRow {
  id: number;
  roundId: number;
  name: string;
  dueAt: Date;
  isRequired: boolean;
}

function tally(values: number[]): Map<number, number> {
  const counts = new Map<number, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
}

function newestPerGroupAndRequirement(rows: SubmissionRow[]): SubmissionRow[] {
  const newest = new Map<string, SubmissionRow>();

  for (const row of rows) {
    const key = `${row.groupId}:${row.requirementId}`;
    const held = newest.get(key);

    if (!held || row.version > held.version) newest.set(key, row);
  }

  return [...newest.values()];
}
