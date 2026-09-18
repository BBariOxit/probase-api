import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  GroupMemberStatus,
  NotificationType,
  RegistrationGroupStatus,
  RoundPhase,
} from '../../generated/prisma/client';
import { formatDate } from '../common/named-day.util';
import {
  NotificationsService,
  type NewNotification,
} from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RoundPhaseService } from '../rounds/round-phase.service';

const LEAD_DAYS = 3;

const GATE_OPEN: readonly RoundPhase[] = [RoundPhase.OPEN, RoundPhase.EXTENDED];

export interface ReminderRun {
  registrationClosingSoon: number;
  submissionsDueSoon: number;
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly phases: RoundPhaseService,
  ) {}

  @Cron('0 7 * * *', {
    name: 'deadline-reminders',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async runDaily(): Promise<void> {
    const sent = await this.run();

    this.logger.log(
      `Deadline reminders: ${sent.registrationClosingSoon} về hạn đăng ký, ${sent.submissionsDueSoon} về hạn nộp bài`,
    );
  }

  async run(): Promise<ReminderRun> {
    const [registrationClosingSoon, submissionsDueSoon] = await Promise.all([
      this.remindRegistrationClosing(),
      this.remindSubmissionsDue(),
    ]);

    return { registrationClosingSoon, submissionsDueSoon };
  }

  private async remindRegistrationClosing(): Promise<number> {
    const rounds = await this.prisma.registrationRound.findMany({
      where: { registrationEnd: this.closingWindow() },
      select: {
        id: true,
        semesterId: true,
        phase: true,
        registrationStart: true,
        registrationEnd: true,
        projectType: { select: { name: true } },
        eligibilities: { select: { cohort: true } },
      },
    });

    if (rounds.length === 0) return 0;

    const phases = await this.phases.resolveMany(rounds);
    const notices: NewNotification[] = [];

    for (const round of rounds) {
      const phase = phases.get(round.id) ?? round.phase;
      if (!GATE_OPEN.includes(phase)) continue;

      const userIds = await this.notifications.studentsWithoutGroupIn({
        semesterId: round.semesterId,
        cohorts: round.eligibilities.map((rule) => rule.cohort),
      });

      notices.push(
        ...userIds.map((userId) => ({
          userId,
          type: NotificationType.REGISTRATION_CLOSING_SOON,
          title: 'Sắp hết hạn đăng ký đề tài',
          content: `${round.projectType.name} đóng đăng ký ngày ${formatDate(round.registrationEnd)}. Bạn chưa có nhóm — sau hạn này khoa sẽ xếp đề tài cho bạn.`,
          targetId: round.id,
          // The deadline is part of the key, so an extension is a new thing to
          // be told about rather than a repeat of the notice already sent.
          dedupeKey: `REGISTRATION_CLOSING_SOON:round=${round.id}:end=${round.registrationEnd.toISOString()}:user=${userId}`,
        })),
      );
    }

    return this.notifications.notify(notices);
  }

  private async remindSubmissionsDue(): Promise<number> {
    const due = await this.prisma.submissionRequirement.findMany({
      where: { dueAt: this.closingWindow() },
      select: { id: true, roundId: true, name: true, dueAt: true },
    });

    const notices: NewNotification[] = [];

    for (const requirement of due) {
      const groups = await this.groupsOwing(
        requirement.roundId,
        requirement.id,
      );

      for (const group of groups) {
        notices.push(
          ...group.members.map((member) => ({
            userId: member.student.userId,
            type: NotificationType.SUBMISSION_DUE_SOON,
            title: `Sắp tới hạn nộp ${requirement.name.toLowerCase()}`,
            content: `Nhóm của bạn chưa nộp ${requirement.name.toLowerCase()} cho đề tài "${group.topic.title}". Hạn nộp: ${formatDate(requirement.dueAt)}. Nộp muộn vẫn được nhận nhưng sẽ bị đánh dấu.`,
            targetId: group.id,
            // The deadline is part of the key, so an office that moves it is a
            // new thing to be told about rather than a repeat.
            dedupeKey: `SUBMISSION_DUE_SOON:req=${requirement.id}:due=${requirement.dueAt.toISOString()}:user=${member.student.userId}`,
          })),
        );
      }
    }

    return this.notifications.notify(notices);
  }

  private async groupsOwing(roundId: number, requirementId: number) {
    return this.prisma.registrationGroup.findMany({
      where: {
        status: { not: RegistrationGroupStatus.REJECTED },
        topic: { roundId },
        submissions: { none: { requirementId } },
      },
      select: {
        id: true,
        topic: { select: { title: true } },
        members: {
          where: {
            status: GroupMemberStatus.ACCEPTED,
            student: { user: { isActive: true } },
          },
          select: { student: { select: { userId: true } } },
        },
      },
    });
  }

  private closingWindow() {
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + LEAD_DAYS);

    return { gt: now, lte: until };
  }
}
