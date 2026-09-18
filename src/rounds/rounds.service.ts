import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GroupMemberStatus,
  NotificationType,
  Prisma,
  RegistrationGroupStatus,
  Role,
  RoundPhase,
} from '../../generated/prisma/client';
import { formatDate } from '../common/named-day.util';
import { NotificationsService } from '../notifications/notifications.service';
import { recordAudit } from '../audit/audit-entry';
import { PrismaService } from '../prisma/prisma.service';
import { ExtendRoundDto } from './dto/extend-round.dto';
import { QueryRoundsDto } from './dto/query-rounds.dto';
import { SetSemesterRoundsDto } from './dto/set-semester-rounds.dto';
import { UnlockRoundDto } from './dto/unlock-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';
import { RoundPhaseService } from './round-phase.service';
import { markTopicsBackOnOffer } from './topic-lifecycle';

const ROUND_SELECT = {
  id: true,
  semesterId: true,
  projectTypeId: true,
  registrationStart: true,
  registrationEnd: true,
  phase: true,
  allocationMode: true,
  finalisedAt: true,
  semester: { select: { id: true, name: true, code: true } },
  projectType: { select: { id: true, name: true, code: true } },
  eligibilities: {
    select: { cohort: true },
    orderBy: { cohort: 'asc' },
  },
} satisfies Prisma.RegistrationRoundSelect;

type RoundRow = Prisma.RegistrationRoundGetPayload<{
  select: typeof ROUND_SELECT;
}>;

const SCHEDULE_EDITABLE_PHASES: readonly RoundPhase[] = [
  RoundPhase.PREP,
  RoundPhase.OPEN,
];

@Injectable()
export class RoundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phases: RoundPhaseService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── read ──────────────────────────────────────────────────

  async findAll(query: QueryRoundsDto, userId: number, role: Role) {
    const where: Prisma.RegistrationRoundWhereInput = {};

    if (query.semesterId) where.semesterId = query.semesterId;
    if (query.projectTypeId) where.projectTypeId = query.projectTypeId;

    // `mine` is a student's question. Staff run the rounds, so narrowing their
    // view to an intake they do not have would just hide the list from the
    // people who maintain it.
    const scopedToMe = query.mine && role === Role.STUDENT;

    if (scopedToMe) {
      where.id = { in: await this.eligibleRoundIds(userId) };
    }

    const rounds = await this.prisma.registrationRound.findMany({
      where,
      select: ROUND_SELECT,
      orderBy: [{ semesterId: 'desc' }, { registrationEnd: 'asc' }],
    });

    const rendered = await this.renderMany(rounds);

    return scopedToMe ? this.ownRoundFirst(rendered, userId) : rendered;
  }

  async findOne(id: number) {
    const round = await this.prisma.registrationRound.findUnique({
      where: { id },
      select: ROUND_SELECT,
    });

    if (!round) throw new NotFoundException(`Round ${id} not found`);

    return (await this.renderMany([round]))[0];
  }

  async findForSemester(semesterId: number) {
    await this.requireSemester(semesterId);

    const rounds = await this.prisma.registrationRound.findMany({
      where: { semesterId },
      select: ROUND_SELECT,
      orderBy: { projectTypeId: 'asc' },
    });

    return this.renderMany(rounds);
  }

  async findEligibleProjectTypes(
    semesterId: number,
    userId: number,
    role: Role,
  ) {
    await this.requireSemester(semesterId);

    if (role !== Role.STUDENT) {
      return this.prisma.projectType.findMany({ orderBy: { code: 'asc' } });
    }

    const cohort = await this.cohortOf(userId);

    // No profile or no intake year means nothing can be said about eligibility,
    // and an empty list is the honest answer — not the whole catalogue.
    if (!cohort) return [];

    const rounds = await this.prisma.registrationRound.findMany({
      where: { semesterId, eligibilities: { some: { cohort } } },
      select: { projectType: { select: { id: true, name: true, code: true } } },
      orderBy: { projectType: { code: 'asc' } },
    });

    return rounds.map((round) => round.projectType);
  }

  async eligibleRoundIds(userId: number, semesterIds?: number[]) {
    const cohort = await this.cohortOf(userId);
    if (!cohort) return [];

    const rows = await this.prisma.roundEligibility.findMany({
      where: {
        cohort,
        ...(semesterIds && { round: { semesterId: { in: semesterIds } } }),
      },
      select: { roundId: true },
    });

    return rows.map((row) => row.roundId);
  }

  async requireRoundFor(semesterId: number, projectTypeId: number) {
    const round = await this.prisma.registrationRound.findUnique({
      where: { semesterId_projectTypeId: { semesterId, projectTypeId } },
      select: { id: true },
    });

    if (!round) {
      throw new ConflictException(
        'The faculty office has not opened a round for this kind of project this semester, so no topic can be written for it',
      );
    }

    return round;
  }

  // ── write ─────────────────────────────────────────────────

  async setSemesterRounds(
    semesterId: number,
    dto: SetSemesterRoundsDto,
    actorId: number,
  ) {
    await this.requireSemester(semesterId);
    await this.requireProjectTypes(dto.rounds.map((r) => r.projectTypeId));

    const existing = await this.prisma.registrationRound.findMany({
      where: { semesterId },
      select: {
        id: true,
        projectTypeId: true,
        phase: true,
        registrationStart: true,
        registrationEnd: true,
        _count: { select: { topics: true } },
      },
    });

    const phases = await this.phases.resolveMany(existing);
    const byProjectType = new Map(
      existing.map((round) => [round.projectTypeId, round]),
    );
    const kept = new Set(dto.rounds.map((round) => round.projectTypeId));

    // Dropping a round that lecturers have already written topics for would
    // delete their work through an omission in somebody else's payload, so it
    // is refused by name rather than obeyed.
    const dropped = existing.filter((r) => !kept.has(r.projectTypeId));
    const blocked = dropped.filter((round) => round._count.topics > 0);

    if (blocked.length > 0) {
      const types = await this.prisma.projectType.findMany({
        where: { id: { in: blocked.map((round) => round.projectTypeId) } },
        select: { name: true },
      });

      throw new ConflictException(
        `Cannot remove rounds that already carry topics: ${types
          .map((type) => type.name)
          .join(', ')}`,
      );
    }

    for (const plan of dto.rounds) {
      const current = byProjectType.get(plan.projectTypeId);
      if (!current) continue;

      this.assertScheduleEditable(
        phases.get(current.id) ?? current.phase,
        movesWindow(current, plan),
      );
    }

    await this.prisma.$transaction(async (tx) => {
      if (dropped.length > 0) {
        await tx.registrationRound.deleteMany({
          where: { id: { in: dropped.map((round) => round.id) } },
        });
      }

      for (const plan of dto.rounds) {
        const current = byProjectType.get(plan.projectTypeId);

        const saved = current
          ? await tx.registrationRound.update({
              where: { id: current.id },
              data: {
                registrationStart: plan.registrationStart,
                registrationEnd: plan.registrationEnd,
                ...(plan.allocationMode && {
                  allocationMode: plan.allocationMode,
                }),
              },
              select: { id: true },
            })
          : await tx.registrationRound.create({
              data: {
                semesterId,
                projectTypeId: plan.projectTypeId,
                registrationStart: plan.registrationStart,
                registrationEnd: plan.registrationEnd,
                ...(plan.allocationMode && {
                  allocationMode: plan.allocationMode,
                }),
              },
              select: { id: true },
            });

        await this.replaceCohorts(tx, saved.id, plan.cohorts);
      }

      // One entry for the plan rather than one per round, because that is the
      // unit the office actually decided: this payload replaces the whole term's
      // arrangement, and a reader asking "who opened Tốt nghiệp to khóa 2022"
      // wants the announcement, not three rows they have to reassemble.
      await recordAudit(tx, {
        userId: actorId,
        action: 'SET_SEMESTER_ROUNDS',
        targetTable: 'semesters',
        targetId: semesterId,
        oldValue: {
          rounds: existing.map((round) => ({
            projectTypeId: round.projectTypeId,
            registrationStart: round.registrationStart.toISOString(),
            registrationEnd: round.registrationEnd.toISOString(),
          })),
        },
        newValue: {
          rounds: dto.rounds.map((plan) => ({
            projectTypeId: plan.projectTypeId,
            registrationStart: plan.registrationStart.toISOString(),
            registrationEnd: plan.registrationEnd.toISOString(),
            cohorts: plan.cohorts,
          })),
          ...(dropped.length > 0 && {
            removedProjectTypeIds: dropped.map((round) => round.projectTypeId),
          }),
        },
      });
    });

    return this.findForSemester(semesterId);
  }

  async update(id: number, dto: UpdateRoundDto) {
    const round = await this.loadRow(id);
    const phase = await this.phases.resolve(id);

    const registrationStart = dto.registrationStart ?? round.registrationStart;
    const registrationEnd = dto.registrationEnd ?? round.registrationEnd;

    this.assertScheduleEditable(
      phase,
      movesWindow(round, { registrationStart, registrationEnd }),
    );

    if (registrationEnd <= registrationStart) {
      throw new BadRequestException(
        'Ngày kết thúc đăng ký phải sau ngày mở đăng ký',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.registrationRound.update({
        where: { id },
        data: {
          registrationStart,
          registrationEnd,
          ...(dto.allocationMode && { allocationMode: dto.allocationMode }),
        },
      });

      if (dto.cohorts) await this.replaceCohorts(tx, id, dto.cohorts);
    });

    return this.findOne(id);
  }

  async extend(id: number, dto: ExtendRoundDto, userId: number) {
    const round = await this.loadRow(id);
    const phase = await this.phases.resolve(id);

    if (phase !== RoundPhase.RECONCILING) {
      throw new ConflictException(
        phase === RoundPhase.EXTENDED
          ? 'This round is already running an extension'
          : 'Only a round whose gate has closed can be extended',
      );
    }

    if (dto.registrationEnd.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Hạn gia hạn phải nằm ở tương lai, nếu không cổng đóng lại ngay khi vừa mở',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Guarded on the phase rather than a plain update: two administrators
      // pressing at once would otherwise both write, and the second would move
      // the deadline of an extension it believed it was starting.
      const { count } = await tx.registrationRound.updateMany({
        where: { id, phase: RoundPhase.RECONCILING },
        data: {
          phase: RoundPhase.EXTENDED,
          registrationEnd: dto.registrationEnd,
        },
      });

      if (count === 0) {
        throw new ConflictException(
          'This round has just changed state — reload and try again',
        );
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'EXTEND_REGISTRATION_ROUND',
          targetTable: 'registration_rounds',
          targetId: String(id),
          oldValue: {
            phase: round.phase,
            registrationEnd: round.registrationEnd.toISOString(),
          },
          newValue: {
            phase: RoundPhase.EXTENDED,
            registrationEnd: dto.registrationEnd.toISOString(),
            // The announced deadline was overridden, and this is the only record
            // of why. It is the reason the reason field is mandatory.
            reason: dto.reason,
          },
        },
      });
    });

    const extended = await this.findOne(id);

    // Told after the fact, never inside the transaction: a database hiccup on a
    // notice must not undo an extension the office has already been told
    // succeeded.
    await this.announceExtension(extended);

    return extended;
  }

  async unlock(id: number, dto: UnlockRoundDto, userId: number) {
    const phase = await this.phases.resolve(id);

    if (phase !== RoundPhase.FINALIZED) {
      throw new ConflictException(
        'Chỉ mở khoá được đợt đã chốt phân bổ. Đợt này chưa chốt nên vẫn đang sửa được bình thường.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Guarded on the phase for the same reason `extend` is: two administrators
      // pressing at once would otherwise both write, and the second would record
      // itself as the author of an unlock the first had already done.
      const { count } = await tx.registrationRound.updateMany({
        where: { id, phase: RoundPhase.FINALIZED },
        data: {
          phase: RoundPhase.RECONCILING,
          // Cleared together with the phase: they say who settled this round,
          // and it is no longer settled. Leaving them would have the next
          // finalisation look like an edit to the first one.
          finalisedAt: null,
          finalisedById: null,
        },
      });

      if (count === 0) {
        throw new ConflictException(
          'Đợt này vừa thay đổi trạng thái — tải lại trang rồi thử lại.',
        );
      }

      const reopened = await markTopicsBackOnOffer(tx, id);

      await recordAudit(tx, {
        userId,
        action: 'UNLOCK_REGISTRATION_ROUND',
        targetTable: 'registration_rounds',
        targetId: id,
        oldValue: { phase: RoundPhase.FINALIZED },
        newValue: {
          phase: RoundPhase.RECONCILING,
          topicsReopened: reopened,
          // The only record of why an announced allocation was reopened, which
          // is why the field is required.
          reason: dto.reason,
        },
      });
    });

    return this.findOne(id);
  }

  // ── internals ─────────────────────────────────────────────

  private async announceExtension(round: {
    id: number;
    semesterId: number;
    registrationEnd: Date;
    cohorts: string[];
    projectType: { name: string };
  }) {
    const userIds = await this.notifications.studentsWithoutGroupIn({
      semesterId: round.semesterId,
      cohorts: round.cohorts,
    });

    await this.notifications.notify(
      userIds.map((userId) => ({
        userId,
        type: NotificationType.ROUND_EXTENDED,
        title: 'Khoa đã gia hạn đăng ký đề tài',
        content: `Bạn chưa có nhóm. ${round.projectType.name} được mở lại tới hết ngày ${formatDate(round.registrationEnd)} — chọn đề tài trước hạn đó, nếu không khoa sẽ xếp bạn vào một đề tài còn chỗ.`,
        targetId: round.id,
      })),
    );
  }

  private assertScheduleEditable(phase: RoundPhase, movesWindow: boolean) {
    if (!movesWindow) return;
    if (SCHEDULE_EDITABLE_PHASES.includes(phase)) return;

    throw new ConflictException(
      'Registration has already closed for this round, so its dates can no longer be edited — extend it instead, which records who reopened it and why',
    );
  }

  private async replaceCohorts(
    tx: Prisma.TransactionClient,
    roundId: number,
    cohorts: string[],
  ) {
    await tx.roundEligibility.deleteMany({ where: { roundId } });
    await tx.roundEligibility.createMany({
      // A spreadsheet paste with a repeated line is accepted rather than
      // rejected on a unique-key violation the caller cannot see.
      data: [...new Set(cohorts)].map((cohort) => ({ roundId, cohort })),
    });
  }

  private async renderMany(rounds: RoundRow[]) {
    const phases = await this.phases.resolveMany(rounds);

    return rounds.map(({ eligibilities, ...round }) => ({
      ...round,
      phase: phases.get(round.id) ?? round.phase,
      cohorts: eligibilities.map((rule) => rule.cohort),
    }));
  }

  private async ownRoundFirst<T extends { id: number; registrationEnd: Date }>(
    rounds: T[],
    userId: number,
  ) {
    if (rounds.length < 2) return rounds;

    const membership = await this.prisma.registrationGroupMember.findFirst({
      where: {
        student: { userId },
        status: GroupMemberStatus.ACCEPTED,
        group: { status: { not: RegistrationGroupStatus.REJECTED } },
      },
      select: { group: { select: { topic: { select: { roundId: true } } } } },
    });

    const ownRoundId = membership?.group.topic.roundId;

    return [...rounds].sort((a, b) => {
      if (a.id === ownRoundId) return -1;
      if (b.id === ownRoundId) return 1;

      return a.registrationEnd.getTime() - b.registrationEnd.getTime();
    });
  }

  private async loadRow(id: number) {
    const round = await this.prisma.registrationRound.findUnique({
      where: { id },
      select: {
        id: true,
        phase: true,
        registrationStart: true,
        registrationEnd: true,
      },
    });

    if (!round) throw new NotFoundException(`Round ${id} not found`);

    return round;
  }

  private async cohortOf(userId: number) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { cohort: true },
    });

    return profile?.cohort ?? null;
  }

  private async requireSemester(id: number) {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!semester) throw new NotFoundException(`Semester ${id} not found`);
  }

  private async requireProjectTypes(ids: number[]) {
    const wanted = [...new Set(ids)];
    const known = await this.prisma.projectType.findMany({
      where: { id: { in: wanted } },
      select: { id: true },
    });

    if (known.length === wanted.length) return;

    const found = new Set(known.map((type) => type.id));
    const missing = wanted.filter((id) => !found.has(id));

    throw new NotFoundException(`Project type ${missing.join(', ')} not found`);
  }
}

function movesWindow(
  current: { registrationStart: Date; registrationEnd: Date },
  plan: { registrationStart: Date; registrationEnd: Date },
): boolean {
  return (
    current.registrationStart.getTime() !== plan.registrationStart.getTime() ||
    current.registrationEnd.getTime() !== plan.registrationEnd.getTime()
  );
}
