import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GroupMemberStatus,
  Prisma,
  RegistrationGroupStatus,
  Role,
  RoundPhase,
  TopicStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RoundPhaseService } from '../rounds/round-phase.service';
import { RoundsService } from '../rounds/rounds.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { QueryTopicsDto } from './dto/query-topics.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

const PUBLISHED_STATUSES = [
  TopicStatus.OPEN,
  TopicStatus.IN_PROGRESS,
  TopicStatus.COMPLETED,
] as const;

const ACTIVE_GROUP_SELECT = {
  where: { status: { not: RegistrationGroupStatus.REJECTED } },
  select: {
    id: true,
    status: true,
    openForJoin: true,
    declaredSize: true,
    holdUntil: true,
    _count: {
      select: { members: { where: { status: GroupMemberStatus.ACCEPTED } } },
    },
  },
  take: 1,
} satisfies Prisma.Topic$registrationGroupsArgs;

const ROUND_SELECT = {
  select: {
    id: true,
    phase: true,
    registrationStart: true,
    registrationEnd: true,
    projectType: { select: { id: true, name: true, code: true } },
  },
} satisfies Prisma.RegistrationRoundDefaultArgs;

const LIST_SELECT = {
  id: true,
  title: true,
  maxStudents: true,
  status: true,
  createdAt: true,
  semester: { select: { id: true, name: true, code: true } },
  round: ROUND_SELECT,
  lecturer: { select: { id: true, fullName: true, academicTitle: true } },
  registrationGroups: ACTIVE_GROUP_SELECT,
  // Only the id of whoever proposed it. A topic born from a proposal is
  // reserved for that student while the gate is open, and a screen that does
  // not know it would draw a register button the API refuses.
  sourceProposal: { select: { studentId: true } },
} satisfies Prisma.TopicSelect;

type TopicRound = {
  id: number;
  phase: RoundPhase;
  registrationStart: Date;
  registrationEnd: Date;
  projectType: { id: number; name: string; code: string };
};

type TopicWithGroups = {
  maxStudents: number;
  round: TopicRound;
  sourceProposal: { studentId: number } | null;
  registrationGroups: {
    id: number;
    status: RegistrationGroupStatus;
    openForJoin: boolean;
    declaredSize: number | null;
    holdUntil: Date | null;
    _count: { members: number };
  }[];
};

function withActiveGroup<T extends TopicWithGroups>(
  topic: T,

  phase: RoundPhase,

  viewer?: {
    gateOpen: boolean;
    eligible: boolean;
    hasGroup: boolean;

    reservedForOther: boolean;

    inThisGroup: boolean;
  },
) {
  const { registrationGroups, round, sourceProposal, ...rest } = topic;
  const group = registrationGroups[0];
  const allowed =
    viewer === undefined ||
    (viewer.gateOpen &&
      viewer.eligible &&
      !viewer.hasGroup &&
      !viewer.reservedForOther);

  const fromProposal = sourceProposal !== null;
  const proposedByMe =
    viewer === undefined || !fromProposal ? null : !viewer.reservedForOther;

  const placement = {
    projectTypeId: round.projectType.id,
    projectType: round.projectType,
    round: {
      id: round.id,
      phase,
      registrationStart: round.registrationStart,
      registrationEnd: round.registrationEnd,
    },
  };

  const eligibleForMe = viewer?.eligible ?? null;

  const alreadyInAGroup = viewer?.hasGroup ?? null;

  const isMyGroup = viewer === undefined ? null : viewer.inThisGroup;

  if (!group) {
    return {
      ...rest,
      ...placement,
      activeGroup: null,
      occupiedSeats: 0,
      isFull: false,

      canRegister: allowed,
      canJoin: false,
      eligibleForMe,
      alreadyInAGroup,
      fromProposal,
      proposedByMe,
      // No group at all, so whose it is has no answer — null rather than false,
      // the same way every other viewer-dependent field here reports a question
      // that does not apply.
      isMyGroup: null,
    };
  }

  const occupied = group._count.members;
  const full = occupied >= topic.maxStudents;
  const holding = group.holdUntil !== null && group.holdUntil > new Date();

  // Seats above the declared size were never the leader's to keep, so a group of
  // two on a topic for three does not get to sit on the third place.
  const held =
    holding && group.declaredSize
      ? Math.max(0, Math.min(group.declaredSize, topic.maxStudents) - occupied)
      : 0;

  return {
    ...rest,
    ...placement,
    activeGroup: {
      id: group.id,
      status: group.status,
      occupiedSeats: occupied,
      openForJoin: group.openForJoin,

      holdActive: holding,
    },
    occupiedSeats: occupied,
    isFull: full,
    canRegister: false,
    canJoin:
      allowed &&
      !full &&
      group.openForJoin &&
      topic.maxStudents - occupied - held > 0,
    eligibleForMe,
    alreadyInAGroup,
    fromProposal,
    proposedByMe,
    isMyGroup,
  };
}

const DETAIL_INCLUDE = {
  semester: { select: { id: true, name: true, code: true } },
  round: ROUND_SELECT,
  lecturer: {
    select: {
      id: true,
      fullName: true,
      lecturerCode: true,
      academicTitle: true,
    },
  },
  registrationGroups: ACTIVE_GROUP_SELECT,
  sourceProposal: { select: { studentId: true } },
} satisfies Prisma.TopicInclude;

@Injectable()
export class TopicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phases: RoundPhaseService,
    private readonly rounds: RoundsService,
  ) {}

  async findAll(query: QueryTopicsDto, userId: number, role: Role) {
    const where: Prisma.TopicWhereInput = {
      status: visibleStatusFilter(role, query.status),
    };

    if (query.semesterId) where.semesterId = query.semesterId;
    // Still asked for by kind of project, which is what a reader picks from a
    // menu — the round it implies is this layer's problem, not theirs.
    if (query.projectTypeId) {
      where.round = { projectTypeId: query.projectTypeId };
    }

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.mine) {
      if (role !== Role.LECTURER) {
        throw new ForbiddenException('Only lecturers own topics');
      }
      where.lecturerId = await this.requireLecturerProfileId(userId);
    } else if (query.lecturerId) {
      where.lecturerId = query.lecturerId;
    }

    if (query.forMyCohort) {
      where.roundId = { in: await this.rounds.eligibleRoundIds(userId) };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.topic.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.topic.count({ where }),
    ]);

    const phases = await this.resolveRoundPhases(items);
    const viewers = await this.availabilityFor(items, userId, role, phases);

    return {
      items: items.map((topic) =>
        withActiveGroup(
          topic,
          phases.get(topic.round.id) ?? topic.round.phase,
          viewers(topic),
        ),
      ),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  private resolveRoundPhases(items: { round: TopicRound }[]) {
    const unique = new Map(items.map((topic) => [topic.round.id, topic.round]));

    return this.phases.resolveMany([...unique.values()]);
  }

  private async availabilityFor(
    items: {
      id: number;
      semester: { id: number };
      round: TopicRound;
      sourceProposal: { studentId: number } | null;
    }[],
    userId: number,
    role: Role,
    phases: Map<number, RoundPhase>,
  ) {
    if (role !== Role.STUDENT || items.length === 0) return () => undefined;

    const semesterIds = [...new Set(items.map((topic) => topic.semester.id))];

    // Read once for the page rather than per row. Null only for an account with
    // no student profile, which the role check above nearly rules out — and a
    // null can match no proposal, so every reserved topic reads as somebody
    // else's, which is the safe direction to be wrong in.
    const me = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    const eligible = new Set(
      await this.rounds.eligibleRoundIds(userId, semesterIds),
    );

    // A student who is already in a group cannot take another topic — one group
    // per semester, enforced by the database. Without this the browse screen
    // would offer a register button to everyone who already has a place, which
    // is nearly the whole cohort once an extension is running.
    const mine = await this.myPlaces(userId, semesterIds);

    return (topic: {
      id: number;
      semester: { id: number };
      round: TopicRound;
      sourceProposal: { studentId: number } | null;
    }) => {
      const phase = phases.get(topic.round.id) ?? topic.round.phase;

      return {
        // An extension reopens the gate, so it counts as open here — what stops
        // it applying to a student who already has a group is `hasGroup`, which
        // is the same rule the register endpoint enforces.
        gateOpen: phase === RoundPhase.OPEN || phase === RoundPhase.EXTENDED,
        // The register endpoint refuses a round the caller's intake is not open
        // for, so a button offering it here would be a button that lies.
        eligible: eligible.has(topic.round.id),
        hasGroup: mine.semesters.has(topic.semester.id),
        // The group holding this topic is one the reader is in. Read together
        // with `activeGroup`, it is the difference between "đã có nhóm" and
        // "nhóm của bạn" — and a screen with only the first can tell a student
        // their own topic was taken by somebody else.
        inThisGroup: mine.topics.has(topic.id),
        // A topic written out of a proposal is that student's until the gate
        // shuts; to everybody else it is not on offer, and the register
        // endpoint refuses it for the same reason.
        reservedForOther:
          topic.sourceProposal !== null &&
          topic.sourceProposal.studentId !== me?.id,
      };
    };
  }

  private async myPlaces(userId: number, semesterIds: number[]) {
    const rows = await this.prisma.registrationGroupMember.findMany({
      where: {
        student: { userId },
        semesterId: { in: semesterIds },
        status: GroupMemberStatus.ACCEPTED,
        group: { status: { not: RegistrationGroupStatus.REJECTED } },
      },
      select: { semesterId: true, group: { select: { topicId: true } } },
    });

    return {
      semesters: new Set(rows.map((row) => row.semesterId)),
      topics: new Set(rows.map((row) => row.group.topicId)),
    };
  }

  async findLecturers(role: Role, semesterId?: number) {
    const rows = await this.prisma.topic.findMany({
      where: {
        status: visibleStatusFilter(role, undefined),
        ...(semesterId && { semesterId }),
      },
      select: {
        lecturer: { select: { id: true, fullName: true, academicTitle: true } },
      },
      distinct: ['lecturerId'],
      orderBy: { lecturer: { fullName: 'asc' } },
    });

    return rows.map((row) => row.lecturer);
  }

  async findOne(id: number, userId: number, role: Role) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });

    // Knowing the id is not a bypass. An unpublished topic answers 404 rather
    // than 403 for a student, so the response cannot be used to map out which
    // drafts exist.
    if (!topic || !canSee(topic.status, role)) {
      throw new NotFoundException('Topic not found');
    }

    // The gate is the round's phase, and only the phase. Comparing the dates
    // here as well would quietly overrule an office that opened registration
    // early or held it shut, which the phase exists to let them do.
    const phases = await this.resolveRoundPhases([topic]);
    const phase = phases.get(topic.round.id) ?? topic.round.phase;
    const viewer = await this.availabilityFor([topic], userId, role, phases);

    return {
      ...withActiveGroup(topic, phase, viewer(topic)),
      roundPhase: phase,
      // Saves the client a second request to the round just to decide whether
      // the register button should be live. This one is about the topic and the
      // calendar only — whether *this* caller may take it is canRegister/canJoin.
      // An extension counts as open: it is a gate somebody may still walk
      // through, even though not everybody.
      isRegistrationOpen:
        topic.status === TopicStatus.OPEN &&
        (phase === RoundPhase.OPEN || phase === RoundPhase.EXTENDED),
    };
  }

  async create(dto: CreateTopicDto, userId: number) {
    const lecturerId = await this.requireLecturerProfileId(userId);

    // Checked up front so a bad reference reads as a 404 on the field the
    // caller got wrong, rather than a raw foreign-key violation. Choosing a kind
    // of project is choosing the round, and one the faculty has not opened is
    // refused here rather than left in the catalogue for students to bounce off.
    await this.requireSemester(dto.semesterId);
    const { semesterId, projectTypeId, ...rest } = dto;
    const round = await this.rounds.requireRoundFor(semesterId, projectTypeId);

    const topic = await this.prisma.topic.create({
      data: { ...rest, semesterId, roundId: round.id, lecturerId },
      include: DETAIL_INCLUDE,
    });

    return this.presentDetail(topic);
  }

  async update(id: number, dto: UpdateTopicDto, userId: number, role: Role) {
    const topic = await this.requireOwnTopic(id, userId, role);

    if (
      topic.status === TopicStatus.IN_PROGRESS ||
      topic.status === TopicStatus.COMPLETED
    ) {
      throw new ConflictException(
        'A topic already under way can no longer be edited',
      );
    }

    const { projectTypeId, ...rest } = dto;

    // Moving a topic to another kind of project moves it to another round, and
    // only within its own semester — the composite foreign key would refuse
    // anything else, and a clear 409 beats a driver error.
    const roundId = projectTypeId
      ? (await this.rounds.requireRoundFor(topic.semesterId, projectTypeId)).id
      : undefined;

    const updated = await this.prisma.topic.update({
      where: { id },
      data: { ...rest, ...(roundId !== undefined && { roundId }) },
      include: DETAIL_INCLUDE,
    });

    return this.presentDetail(updated);
  }

  async remove(id: number, userId: number, role: Role) {
    const topic = await this.requireOwnTopic(id, userId, role);

    // Only a group that is still standing blocks deletion. REJECTED rows are
    // kept for the record, and counting them would leave a topic that everyone
    // walked away from permanently undeletable — while the unique index says
    // it is free for the next student to take.
    if (topic.activeGroupCount > 0) {
      throw new ConflictException(
        'Cannot delete a topic that students have already registered for',
      );
    }

    await this.prisma.topic.delete({ where: { id } });

    return { message: 'Topic deleted' };
  }

  async approve(id: number) {
    const topic = await this.requireTopic(id);

    if (topic.status !== TopicStatus.PENDING) {
      throw new ConflictException('Only a pending topic can be approved');
    }

    return this.setStatus(id, TopicStatus.APPROVED);
  }

  async open(id: number, userId: number, role: Role) {
    const topic = await this.requireOwnTopic(id, userId, role);

    if (topic.status !== TopicStatus.APPROVED) {
      throw new ConflictException(
        'A topic must be approved before it can accept registrations',
      );
    }

    return this.setStatus(id, TopicStatus.OPEN);
  }

  async close(id: number, userId: number, role: Role) {
    const topic = await this.requireOwnTopic(id, userId, role);

    if (topic.status !== TopicStatus.OPEN) {
      throw new ConflictException('Only an open topic can be closed');
    }

    return this.setStatus(id, TopicStatus.APPROVED);
  }

  private async setStatus(id: number, status: TopicStatus) {
    const topic = await this.prisma.topic.update({
      where: { id },
      data: { status },
      include: DETAIL_INCLUDE,
    });

    return this.presentDetail(topic);
  }

  private async presentDetail<T extends TopicWithGroups>(topic: T) {
    const phases = await this.phases.resolveMany([topic.round]);

    return withActiveGroup(
      topic,
      phases.get(topic.round.id) ?? topic.round.phase,
    );
  }

  private async requireTopic(id: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        lecturerId: true,
        semesterId: true,
        _count: {
          select: {
            registrationGroups: {
              where: { status: { not: RegistrationGroupStatus.REJECTED } },
            },
          },
        },
      },
    });

    if (!topic) throw new NotFoundException('Topic not found');

    return { ...topic, activeGroupCount: topic._count.registrationGroups };
  }

  private async requireOwnTopic(id: number, userId: number, role: Role) {
    const topic = await this.requireTopic(id);

    if (role === Role.ADMIN) return topic;

    const lecturerId = await this.requireLecturerProfileId(userId);

    if (topic.lecturerId !== lecturerId) {
      throw new ForbiddenException('This topic belongs to another lecturer');
    }

    return topic;
  }

  private async requireLecturerProfileId(userId: number) {
    const profile = await this.prisma.lecturerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new ForbiddenException(
        'No lecturer profile is attached to this account',
      );
    }

    return profile.id;
  }

  private async requireSemester(id: number) {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!semester) throw new NotFoundException(`Semester ${id} not found`);
  }
}

function visibleStatusFilter(
  role: Role,
  requested: TopicStatus | undefined,
): Prisma.EnumTopicStatusFilter | undefined {
  if (role !== Role.STUDENT) {
    return requested ? { equals: requested } : undefined;
  }

  if (requested && !canSee(requested, role)) {
    // Asking for drafts as a student is answered with an empty page, not an
    // error: the filter is a view, and nothing here is worth confirming.
    return { in: [] };
  }

  return requested ? { equals: requested } : { in: [...PUBLISHED_STATUSES] };
}

function canSee(status: TopicStatus, role: Role): boolean {
  if (role !== Role.STUDENT) return true;

  return (PUBLISHED_STATUSES as readonly TopicStatus[]).includes(status);
}
