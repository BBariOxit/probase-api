import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAuditLogsDto) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action && { action: query.action }),
      ...(query.userId && { userId: query.userId }),
      ...(query.targetTable && { targetTable: query.targetTable }),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          targetTable: true,
          targetId: true,
          // The before and after are the whole point — an entry saying only
          // "somebody updated something" is one nobody can act on. They are
          // written by each call site and are deliberately not a fixed shape.
          oldValue: true,
          newValue: true,
          createdAt: true,
          // Who, as a person rather than an id. An admin reading this already
          // has the account list, so nothing new is exposed by naming them.
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              studentProfile: { select: { fullName: true } },
              lecturerProfile: { select: { fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map(render),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async actions(): Promise<string[]> {
    const rows = await this.prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    });

    return rows.map((row) => row.action);
  }
}

type LogRow = Prisma.AuditLogGetPayload<{
  select: {
    id: true;
    action: true;
    targetTable: true;
    targetId: true;
    oldValue: true;
    newValue: true;
    createdAt: true;
    user: {
      select: {
        id: true;
        email: true;
        role: true;
        studentProfile: { select: { fullName: true } };
        lecturerProfile: { select: { fullName: true } };
      };
    };
  };
}>;

function render(log: LogRow) {
  const { user, ...rest } = log;

  return {
    ...rest,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName:
        user.studentProfile?.fullName ?? user.lecturerProfile?.fullName ?? null,
    },
  };
}
