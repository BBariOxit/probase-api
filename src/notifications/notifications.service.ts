import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  GroupMemberStatus,
  NotificationType,
  Prisma,
  RegistrationGroupStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

export interface NewNotification {
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  targetId?: number | null;

  dedupeKey?: string;
}

const LIST_SELECT = {
  id: true,
  type: true,
  title: true,
  content: true,
  targetId: true,
  isRead: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── the inbox ─────────────────────────────────────────────

  async findMine(query: QueryNotificationsDto, userId: number) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.unreadOnly && { isRead: false }),
    };

    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items,
      total,
      unreadCount,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async markRead(id: number, userId: number) {
    const { count } = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    if (count === 0) throw new NotFoundException('Notification not found');

    return { message: 'Notification marked as read' };
  }

  async markAllRead(userId: number) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: `${count} notification(s) marked as read` };
  }

  // ── raising notices ───────────────────────────────────────

  async notify(notices: NewNotification[]): Promise<number> {
    if (notices.length === 0) return 0;

    try {
      const { count } = await this.prisma.notification.createMany({
        data: notices.map((notice) => ({
          userId: notice.userId,
          type: notice.type,
          title: notice.title,
          content: notice.content,
          targetId: notice.targetId ?? null,
          dedupeKey: notice.dedupeKey ?? null,
        })),
        skipDuplicates: true,
      });

      return count;
    } catch (err) {
      this.logger.error(
        `Failed to write ${notices.length} notification(s) of type ${notices[0].type}`,
        err instanceof Error ? err.stack : String(err),
      );

      return 0;
    }
  }

  async studentsWithoutGroupIn(round: {
    semesterId: number;
    cohorts: string[];
  }): Promise<number[]> {
    if (round.cohorts.length === 0) return [];

    const students = await this.prisma.studentProfile.findMany({
      where: {
        cohort: { in: round.cohorts },
        user: { isActive: true },
        NOT: {
          groupMemberships: {
            some: {
              semesterId: round.semesterId,
              status: GroupMemberStatus.ACCEPTED,
              group: { status: { not: RegistrationGroupStatus.REJECTED } },
            },
          },
        },
      },
      select: { userId: true },
    });

    return students.map((student) => student.userId);
  }
}
