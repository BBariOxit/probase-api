import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GroupJoinSource,
  GroupMemberStatus,
  NotificationType,
  Prisma,
  RegistrationGroupStatus,
  Role,
  TopicStatus,
} from '../../generated/prisma/client';
import {
  isUniqueViolation,
  uniqueConstraintName,
} from '../common/prisma-error.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIREMENT_SELECT } from '../rounds/requirements.service';
import { RoundPhaseService } from '../rounds/round-phase.service';
import { statusForSeats } from './group-seats';
import { QueryMyGroupDto } from './dto/query-my-group.dto';
import { QuerySupervisedGroupsDto } from './dto/query-supervised-groups.dto';
import { RegisterTopicDto } from './dto/register-topic.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import {
  generateJoinCode,
  holdExpiryFromNow,
  isHoldActive,
} from './join-code.util';

const GROUP_SELECT = {
  id: true,
  topicId: true,
  semesterId: true,
  leaderId: true,
  name: true,
  status: true,
  openForJoin: true,
  declaredSize: true,
  holdUntil: true,
  joinCode: true,
  createdAt: true,
  topic: {
    select: {
      id: true,
      title: true,
      maxStudents: true,
      lecturerId: true,
      // The round is what every phase check is asked of — the group's own
      // semester is too coarse, since a semester runs one round per kind of
      // project and they open and close on their own schedules.
      roundId: true,
      lecturer: { select: { id: true, fullName: true, academicTitle: true } },
      round: {
        select: {
          projectType: { select: { id: true, name: true, code: true } },
          // What this group owes and by when, as the office declared it for
          // the round. Empty while they have declared nothing.
          requirements: {
            select: REQUIREMENT_SELECT,
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  },
  members: {
    // Only people actually in the group. Disbanding steps its members down to
    // DECLINED rather than deleting them, so without this filter a dissolved
    // group would still read as full and its seat arithmetic would count people
    // who are no longer in it.
    where: { status: GroupMemberStatus.ACCEPTED },
    select: {
      id: true,
      studentId: true,
      joinSource: true,
      joinedAt: true,
      student: {
        select: {
          id: true,
          studentCode: true,
          fullName: true,
          class: true,
          cohort: true,
          major: { select: { id: true, name: true, code: true } },
          // The account id is here to address notices to; `render` drops the
          // whole `user` object and re-exposes only the address, so it never
          // reaches a response.
          user: { select: { id: true, email: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.RegistrationGroupSelect;

type GroupRow = Prisma.RegistrationGroupGetPayload<{
  select: typeof GROUP_SELECT;
}>;

interface Viewer {
  studentId: number | null;
  lecturerId: number | null;
  role: Role | null;
}

function seatBreakdown(group: GroupRow) {
  const occupied = group.members.length;
  const capacity = group.topic.maxStudents;
  const holdActive = isHoldActive(group.holdUntil);

  const held =
    holdActive && group.declaredSize
      ? Math.max(0, Math.min(group.declaredSize, capacity) - occupied)
      : 0;

  return {
    occupied,
    capacity,
    holdActive,
    held,

    freeToAnyone: Math.max(0, capacity - occupied - held),
  };
}

function requireProposerOrFree(
  topic: { sourceProposal: { studentId: number } | null },
  studentId: number,
): void {
  if (!topic.sourceProposal) return;
  if (topic.sourceProposal.studentId === studentId) return;

  throw new ConflictException(
    'Đề tài này do một sinh viên khác đề xuất, nên chỉ bạn ấy đăng ký được.',
  );
}

@Injectable()
export class RegistrationGroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phases: RoundPhaseService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── register ──────────────────────────────────────────────

  async register(topicId: number, dto: RegisterTopicDto, userId: number) {
    const student = await this.requireStudent(userId);
    const topic = await this.requireRegistrableTopic(topicId);

    await this.phases.requireCanJoin(topic.roundId, student.id);
    await this.requireEligible(topic, student.cohort);
    requireProposerOrFree(topic, student.id);
    await this.requireNoExistingGroup(student.id, topic.semesterId);

    if (dto.declaredSize && dto.declaredSize > topic.maxStudents) {
      throw new BadRequestException(
        `This topic holds ${topic.maxStudents} student(s), so ${dto.declaredSize} cannot be declared`,
      );
    }

    // A group of one is still a group, so nothing here is conditional on having
    // friends. The join code is always issued: it is how a leader shares the
    // group at all, and outside the hold window it grants no more than the topic
    // page already does.
    const holdUntil = dto.declaredSize ? holdExpiryFromNow() : null;

    let created: { id: number };
    try {
      created = await this.prisma.$transaction(async (tx) => {
        const group = await tx.registrationGroup.create({
          data: {
            topicId: topic.id,
            semesterId: topic.semesterId,
            leaderId: student.id,
            name: dto.name,
            declaredSize: dto.declaredSize,
            holdUntil,
            joinCode: generateJoinCode(),
            status: statusForSeats(1, topic.maxStudents),
          },
          select: { id: true },
        });

        await tx.registrationGroupMember.create({
          data: {
            groupId: group.id,
            semesterId: topic.semesterId,
            studentId: student.id,
            status: GroupMemberStatus.ACCEPTED,
            joinSource: GroupJoinSource.SELF,
            joinedAt: new Date(),
          },
        });

        return group;
      });
    } catch (err) {
      throw this.translateRegistrationConflict(err);
    }

    return this.present(created.id, { studentId: student.id });
  }

  // ── join ──────────────────────────────────────────────────

  async joinTopic(topicId: number, userId: number) {
    const student = await this.requireStudent(userId);

    const group = await this.prisma.registrationGroup.findFirst({
      where: {
        topicId,
        status: { not: RegistrationGroupStatus.REJECTED },
      },
      select: GROUP_SELECT,
    });

    // Nothing is auto-created here on purpose: taking an unclaimed topic and
    // joining a group that exists are different decisions, and a client that
    // asked for one should not silently get the other.
    if (!group) {
      throw new ConflictException(
        'Nobody has registered this topic yet — register it instead of joining',
      );
    }

    await this.assertJoinable(group, student, { allowHeldSeats: false });

    return this.addMember(group.id, student, GroupJoinSource.SELF, {
      allowHeldSeats: false,
    });
  }

  async joinByCode(joinCode: string, userId: number) {
    const student = await this.requireStudent(userId);
    const group = await this.requireGroupByCode(joinCode);

    await this.assertJoinable(group, student, { allowHeldSeats: true });

    return this.addMember(group.id, student, GroupJoinSource.LINK, {
      allowHeldSeats: true,
    });
  }

  async previewByCode(joinCode: string, userId: number) {
    const student = await this.requireStudent(userId);
    const group = await this.requireGroupByCode(joinCode);
    const seats = seatBreakdown(group);

    const alreadyMember = group.members.some(
      (member) => member.studentId === student.id,
    );

    let blockedReason: string | null = null;
    if (!alreadyMember) {
      try {
        await this.assertJoinable(group, student, { allowHeldSeats: true });
      } catch (err) {
        if (!(err instanceof HttpException)) throw err;
        blockedReason = err.message;
      }
    }

    return {
      group: {
        id: group.id,
        name: group.name,
        occupiedSeats: seats.occupied,
        capacity: seats.capacity,
        isFull: seats.occupied >= seats.capacity,
        // Names only. Whoever holds the link is a legitimate invitee, not a
        // reason to hand over classmates' codes and addresses.
        members: group.members.map((member) => ({
          fullName: member.student.fullName,
          isLeader: member.studentId === group.leaderId,
        })),
      },
      topic: {
        id: group.topic.id,
        title: group.topic.title,
        projectType: group.topic.round.projectType,
        lecturer: group.topic.lecturer,
      },
      alreadyMember,
      canJoin: !alreadyMember && blockedReason === null,
      blockedReason,
    };
  }

  // ── read ──────────────────────────────────────────────────

  async findMine(query: QueryMyGroupDto, userId: number) {
    const student = await this.requireStudent(userId);
    const semesterId =
      query.semesterId ?? (await this.requireActiveSemesterId());

    const membership = await this.prisma.registrationGroupMember.findFirst({
      where: {
        studentId: student.id,
        semesterId,
        status: GroupMemberStatus.ACCEPTED,
        group: { status: { not: RegistrationGroupStatus.REJECTED } },
      },
      select: { groupId: true },
    });

    if (!membership) return null;

    return this.present(membership.groupId, { studentId: student.id });
  }

  async findSupervisedGroups(query: QuerySupervisedGroupsDto, userId: number) {
    const lecturer = await this.prisma.lecturerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!lecturer) {
      throw new NotFoundException('Lecturer profile not found');
    }

    const semesterId =
      query.semesterId ?? (await this.requireActiveSemesterId());

    const groups = await this.prisma.registrationGroup.findMany({
      where: {
        semesterId,
        status: { not: RegistrationGroupStatus.REJECTED },
        topic: { lecturerId: lecturer.id },
      },
      select: GROUP_SELECT,
      orderBy: { createdAt: 'asc' },
    });

    const viewer: Viewer = {
      studentId: null,
      lecturerId: lecturer.id,
      role: Role.LECTURER,
    };

    return groups.map((group) => this.render(group, viewer));
  }

  async findOne(id: number, userId: number, role: Role) {
    const viewer = await this.resolveViewer(userId, role);
    const group = await this.loadGroup(id);

    if (!this.canView(group, viewer)) {
      throw new NotFoundException('Registration group not found');
    }

    return this.render(group, viewer);
  }

  // ── leader actions ────────────────────────────────────────

  async update(id: number, dto: UpdateGroupDto, userId: number) {
    const student = await this.requireStudent(userId);
    const group = await this.requireLeadership(id, student.id);

    await this.phases.requireCanLeave(group.topic.roundId);

    if (dto.leaderId !== undefined) {
      const successor = group.members.find(
        (member) => member.studentId === dto.leaderId,
      );

      if (!successor) {
        throw new BadRequestException(
          'A group can only be handed to one of its own members',
        );
      }
    }

    // Bounded by the people already here and by what the topic holds. Below the
    // membership it would describe a group smaller than it is; above the capacity
    // it would claim seats the topic does not have.
    if (dto.declaredSize != null) {
      if (dto.declaredSize < group.members.length) {
        throw new BadRequestException(
          `The group already has ${group.members.length} member(s), so it cannot declare ${dto.declaredSize}`,
        );
      }

      if (dto.declaredSize > group.topic.maxStudents) {
        throw new BadRequestException(
          `This topic holds ${group.topic.maxStudents} student(s), so ${dto.declaredSize} cannot be declared`,
        );
      }
    }

    await this.prisma.registrationGroup.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.openForJoin !== undefined && { openForJoin: dto.openForJoin }),
        ...(dto.declaredSize !== undefined && {
          declaredSize: dto.declaredSize,
        }),
        ...(dto.releaseHold && { holdUntil: null }),
        ...(dto.leaderId !== undefined && { leaderId: dto.leaderId }),
      },
    });

    return this.present(id, { studentId: student.id });
  }

  async removeMember(id: number, studentId: number, userId: number) {
    const student = await this.requireStudent(userId);
    const group = await this.requireLeadership(id, student.id);

    await this.phases.requireCanLeave(group.topic.roundId);

    if (studentId === group.leaderId) {
      throw new BadRequestException(
        'A leader cannot remove themselves — hand the group over or disband it',
      );
    }

    const member = group.members.find(
      (candidate) => candidate.studentId === studentId,
    );

    if (!member) {
      throw new NotFoundException('That student is not in this group');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.registrationGroupMember.delete({ where: { id: member.id } });

      await this.syncStatus(tx, id, group.topic.maxStudents);

      await tx.auditLog.create({
        data: {
          userId,
          action: 'REMOVE_GROUP_MEMBER',
          targetTable: 'registration_group_members',
          targetId: String(member.id),
          oldValue: {
            groupId: id,
            studentId,
            studentCode: member.student.studentCode,
            joinSource: member.joinSource,
          },
        },
      });
    });

    // The one thing here a student did not do to themselves, and the only way
    // they would otherwise learn of it is by finding themselves back on the
    // topic list with no explanation.
    await this.notifications.notify([
      {
        userId: member.student.user.id,
        type: NotificationType.GROUP_MEMBER_REMOVED,
        title: 'Bạn đã bị đưa ra khỏi nhóm',
        content: `Trưởng nhóm đã đưa bạn ra khỏi nhóm đề tài "${group.topic.title}". Nếu cổng đăng ký còn mở, bạn có thể chọn một đề tài khác.`,
        targetId: group.topicId,
      },
    ]);

    return this.present(id, { studentId: student.id });
  }

  async disband(id: number, userId: number, role: Role) {
    let group: GroupRow;

    if (role === Role.ADMIN) {
      group = await this.loadGroup(id);

      if (group.status === RegistrationGroupStatus.REJECTED) {
        throw new ConflictException('This group has already been disbanded');
      }
    } else {
      const student = await this.requireStudent(userId);
      group = await this.requireLeadership(id, student.id);
    }

    await this.phases.requireCanLeave(group.topic.roundId);

    await this.prisma.$transaction([
      this.prisma.registrationGroupMember.updateMany({
        where: { groupId: id, status: GroupMemberStatus.ACCEPTED },
        data: { status: GroupMemberStatus.DECLINED },
      }),
      this.prisma.registrationGroup.update({
        where: { id },
        data: { status: RegistrationGroupStatus.REJECTED },
      }),
    ]);

    // Everybody except whoever pressed it — they were there, and a notice about
    // one's own action is noise that teaches people to stop reading them.
    await this.notifications.notify(
      group.members
        .filter((member) => member.student.user.id !== userId)
        .map((member) => ({
          userId: member.student.user.id,
          type: NotificationType.GROUP_DISBANDED,
          title: 'Nhóm của bạn đã giải tán',
          content: `Nhóm đề tài "${group.topic.title}" đã giải tán và đề tài trở lại danh sách. Nếu cổng đăng ký còn mở, bạn có thể chọn một đề tài khác.`,
          targetId: group.topicId,
        })),
    );

    return { message: 'Group disbanded and the topic is available again' };
  }

  // ── member actions ────────────────────────────────────────

  async leave(id: number, userId: number) {
    const student = await this.requireStudent(userId);
    const group = await this.loadGroup(id);

    await this.phases.requireCanLeave(group.topic.roundId);

    const member = group.members.find(
      (candidate) => candidate.studentId === student.id,
    );

    if (!member) throw new NotFoundException('You are not in this group');

    // Somebody has to answer for the group, and a group whose leader walked out
    // has nobody to hand it to, close it, or be asked about it.
    if (group.leaderId === student.id) {
      throw new ConflictException(
        'Hand the group to another member first, or disband it',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.registrationGroupMember.delete({ where: { id: member.id } });
      await this.syncStatus(tx, id, group.topic.maxStudents);
    });

    return { message: 'You have left the group' };
  }

  // ── internals ─────────────────────────────────────────────

  private async syncStatus(
    tx: Prisma.TransactionClient,
    groupId: number,
    capacity: number,
  ) {
    const occupied = await tx.registrationGroupMember.count({
      where: { groupId, status: GroupMemberStatus.ACCEPTED },
    });

    await tx.registrationGroup.update({
      where: { id: groupId },
      data: { status: statusForSeats(occupied, capacity) },
    });
  }

  private async addMember(
    groupId: number,
    student: { id: number; fullName: string },
    joinSource: GroupJoinSource,
    options: { allowHeldSeats: boolean },
  ) {
    const studentId = student.id;

    const audience = await this.prisma
      .$transaction(async (tx) => {
        await tx.$queryRaw`SELECT 1 FROM "registration_groups" WHERE "id" = ${groupId} FOR UPDATE`;

        // Re-read inside the lock: the counts checked before it was taken are
        // exactly the ones another request may have moved.
        const group = await tx.registrationGroup.findUnique({
          where: { id: groupId },
          select: GROUP_SELECT,
        });

        if (!group || group.status === RegistrationGroupStatus.REJECTED) {
          throw new NotFoundException('Registration group not found');
        }

        if (group.members.some((member) => member.studentId === studentId)) {
          throw new ConflictException('You are already in this group');
        }

        if (!group.openForJoin) {
          throw new ConflictException(
            'This group has closed itself to new members',
          );
        }

        const seats = seatBreakdown(group);

        if (seats.occupied >= seats.capacity) {
          throw new ConflictException('This group is already full');
        }

        if (!options.allowHeldSeats && seats.freeToAnyone === 0) {
          throw new ConflictException(
            'The remaining seats are being held for members the leader has invited — ask them for the join link',
          );
        }

        await tx.registrationGroupMember.create({
          data: {
            groupId,
            semesterId: group.semesterId,
            studentId,
            status: GroupMemberStatus.ACCEPTED,
            joinSource,
            joinedAt: new Date(),
          },
        });

        await this.syncStatus(tx, groupId, seats.capacity);

        // Gathered while the row is still locked, so the list is exactly who was
        // in the group at the moment this student joined it.
        return {
          userIds: group.members.map((member) => member.student.user.id),
          topicTitle: group.topic.title,
        };
      })
      .catch((err: unknown) => {
        throw this.translateRegistrationConflict(err);
      });

    await this.notifications.notify(
      audience.userIds.map((userId) => ({
        userId,
        type: NotificationType.GROUP_MEMBER_JOINED,
        title: 'Có người tham gia nhóm của bạn',
        content: `${student.fullName} vừa vào nhóm đề tài "${audience.topicTitle}".`,
        targetId: groupId,
      })),
    );

    return this.present(groupId, { studentId });
  }

  private async present(id: number, viewer: { studentId: number }) {
    const group = await this.loadGroup(id);

    return this.render(group, {
      studentId: viewer.studentId,
      lecturerId: null,
      role: Role.STUDENT,
    });
  }

  private async loadGroup(id: number): Promise<GroupRow> {
    const group = await this.prisma.registrationGroup.findUnique({
      where: { id },
      select: GROUP_SELECT,
    });

    if (!group) throw new NotFoundException('Registration group not found');

    return group;
  }

  private render(group: GroupRow, viewer: Viewer) {
    const seats = seatBreakdown(group);
    const { joinCode, members, topic, ...rest } = group;
    const { round, ...topicRest } = topic;
    const isMember = members.some(
      (member) => member.studentId === viewer.studentId,
    );

    return {
      ...rest,
      // Flattened back to the shape callers already read: the kind of project
      // reaches the topic through its round now, and which table it came from is
      // not the client's problem.
      topic: { ...topicRest, projectType: round.projectType },
      /*
        What the group has to hand in, lifted out of the round because this is
        the screen they read before handing anything in — and until then there
        is no submission to hang a due date off.
      */
      requirements: round.requirements,
      members: members.map((member) => {
        const { user, ...student } = member.student;

        return {
          id: member.id,
          joinSource: member.joinSource,
          joinedAt: member.joinedAt,
          isLeader: member.studentId === group.leaderId,
          // The avatar is lifted onto the student the same way the address is:
          // it is stored against the account, but to this screen it is simply
          // what this person looks like.
          student: { ...student, email: user.email, avatarUrl: user.avatarUrl },
        };
      }),
      occupiedSeats: seats.occupied,
      heldSeats: seats.held,
      seatsOpenToAnyone: seats.freeToAnyone,
      isFull: seats.occupied >= seats.capacity,
      holdActive: seats.holdActive,
      isLeader: group.leaderId === viewer.studentId,
      joinCode: isMember ? joinCode : null,
    };
  }

  private canView(group: GroupRow, viewer: Viewer): boolean {
    if (viewer.role === Role.ADMIN) return true;
    if (viewer.lecturerId && group.topic.lecturerId === viewer.lecturerId) {
      return true;
    }

    return group.members.some(
      (member) => member.studentId === viewer.studentId,
    );
  }

  private async resolveViewer(userId: number, role: Role): Promise<Viewer> {
    if (role === Role.STUDENT) {
      const profile = await this.prisma.studentProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      return { studentId: profile?.id ?? null, lecturerId: null, role };
    }

    if (role === Role.LECTURER) {
      const profile = await this.prisma.lecturerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      return { studentId: null, lecturerId: profile?.id ?? null, role };
    }

    return { studentId: null, lecturerId: null, role };
  }

  private async requireLeadership(id: number, studentId: number) {
    const group = await this.loadGroup(id);

    if (group.status === RegistrationGroupStatus.REJECTED) {
      throw new ConflictException('This group has already been disbanded');
    }

    if (group.leaderId !== studentId) {
      throw new ForbiddenException('Only the group leader can do that');
    }

    return group;
  }

  private async requireNoExistingGroup(studentId: number, semesterId: number) {
    const existing = await this.prisma.registrationGroupMember.findFirst({
      where: {
        studentId,
        semesterId,
        status: GroupMemberStatus.ACCEPTED,
        group: { status: { not: RegistrationGroupStatus.REJECTED } },
      },
      select: {
        group: { select: { id: true, topic: { select: { title: true } } } },
      },
    });

    if (existing) {
      throw new ConflictException(
        `You are already in a group this semester, on "${existing.group.topic.title}" — leave it before taking another topic`,
      );
    }
  }

  private async requireGroupByCode(joinCode: string) {
    const group = await this.prisma.registrationGroup.findUnique({
      where: { joinCode },
      select: GROUP_SELECT,
    });

    // A disbanded group answers the same as an unknown code. The link is dead
    // either way, and distinguishing them would tell a stranger holding a stale
    // link that it was once real.
    if (!group || group.status === RegistrationGroupStatus.REJECTED) {
      throw new NotFoundException('This invite link is no longer valid');
    }

    return group;
  }

  private async assertJoinable(
    group: GroupRow,
    student: { id: number; cohort: string | null },
    options: { allowHeldSeats: boolean },
  ) {
    await this.phases.requireCanJoin(group.topic.roundId, student.id);

    const topic = await this.requireRegistrableTopic(group.topicId);
    await this.requireEligible(topic, student.cohort);
    await this.requireNoExistingGroup(student.id, group.semesterId);

    if (!group.openForJoin) {
      throw new ConflictException(
        'This group has closed itself to new members',
      );
    }

    const seats = seatBreakdown(group);

    if (seats.occupied >= seats.capacity) {
      throw new ConflictException('This group is already full');
    }

    if (!options.allowHeldSeats && seats.freeToAnyone === 0) {
      throw new ConflictException(
        'The remaining seats are being held for members the leader has invited — ask them for the join link',
      );
    }
  }

  private async requireStudent(userId: number) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true, cohort: true, fullName: true },
    });

    if (!profile) {
      throw new ForbiddenException(
        'No student profile is attached to this account',
      );
    }

    return profile;
  }

  private async requireRegistrableTopic(id: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      select: {
        id: true,
        semesterId: true,
        roundId: true,
        maxStudents: true,
        status: true,
        round: { select: { projectType: { select: { name: true } } } },
        // Who, if anyone, this topic was written for. See requireProposerOrFree.
        sourceProposal: { select: { studentId: true } },
      },
    });

    if (!topic) throw new NotFoundException('Topic not found');

    if (topic.status !== TopicStatus.OPEN) {
      throw new ConflictException(
        'This topic is not open for registration at the moment',
      );
    }

    return topic;
  }

  private async requireEligible(
    topic: { roundId: number; round: { projectType: { name: string } } },
    cohort: string | null,
  ) {
    if (!cohort) {
      throw new ForbiddenException(
        'This account has no intake year on file, so eligibility cannot be established',
      );
    }

    const match = await this.prisma.roundEligibility.findFirst({
      where: { roundId: topic.roundId, cohort },
      select: { id: true },
    });

    if (match) return;

    // Told apart because they call for different action: one is a student
    // looking at the wrong kind of project, the other is the faculty office not
    // having declared anything yet, and answering both with "you are not
    // eligible" sends the wrong person looking for the fault.
    const anyRule = await this.prisma.roundEligibility.findFirst({
      where: { roundId: topic.roundId },
      select: { id: true },
    });

    if (!anyRule) {
      throw new ConflictException(
        'The faculty office has not yet declared which intakes may take part in this round',
      );
    }

    throw new ForbiddenException(
      `${topic.round.projectType.name} is not open to intake ${cohort} this semester`,
    );
  }

  private async requireActiveSemesterId() {
    const semester = await this.prisma.semester.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!semester) {
      throw new NotFoundException('No semester is currently active');
    }

    return semester.id;
  }

  private translateRegistrationConflict(err: unknown): unknown {
    if (!isUniqueViolation(err)) return err;

    const target = uniqueConstraintName(err);

    if (target.includes('one_live_per_topic')) {
      return new ConflictException(
        'Another group has just taken this topic — pick another one',
      );
    }

    if (target.includes('one_accepted_per_semester')) {
      return new ConflictException(
        'You are already in a group this semester — leave it before taking another topic',
      );
    }

    return new ConflictException(
      'That registration collided with another one — reload and try again',
    );
  }
}
