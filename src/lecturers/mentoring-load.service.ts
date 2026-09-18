import { ConflictException, Injectable } from '@nestjs/common';
import {
  RegistrationGroupStatus,
  RoundPhase,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface MentoringLoad {
  groups: number;

  reserved: number;

  quota: number | null;

  atQuota: boolean;
}

interface Quota {
  id: number;
  maxMentoringQuota: number | null;
}

const OPEN_ENOUGH_TO_HOLD = [
  RoundPhase.PREP,
  RoundPhase.OPEN,
  RoundPhase.EXTENDED,
] as const;

@Injectable()
export class MentoringLoadService {
  constructor(private readonly prisma: PrismaService) {}

  async loadFor(
    lecturers: Quota[],
    semesterId: number | undefined,
  ): Promise<(lecturer: Quota) => MentoringLoad> {
    const ids = lecturers.map((lecturer) => lecturer.id);

    const [groups, reserved] =
      semesterId === undefined || ids.length === 0
        ? [new Map<number, number>(), new Map<number, number>()]
        : await Promise.all([
            this.countGroups(ids, semesterId),
            this.countReserved(ids, semesterId),
          ]);

    return (lecturer) =>
      describe(
        groups.get(lecturer.id) ?? 0,
        reserved.get(lecturer.id) ?? 0,
        lecturer.maxMentoringQuota,
      );
  }

  async loadForOne(
    lecturer: Quota,
    semesterId: number | undefined,
  ): Promise<MentoringLoad> {
    const lookup = await this.loadFor([lecturer], semesterId);

    return lookup(lecturer);
  }

  async requireRoomForOneMore(
    lecturer: Quota,
    semesterId: number,
  ): Promise<void> {
    const load = await this.loadForOne(lecturer, semesterId);

    if (!load.atQuota) return;

    throw new ConflictException(
      `Bạn đã nhận đủ ${load.quota} nhóm cho học kỳ này (${load.groups} nhóm đang hướng dẫn, ${load.reserved} đề tài đã nhận đang chờ sinh viên đăng ký), nên chưa nhận thêm được. Bạn vẫn có thể từ chối kèm nhận xét, hoặc đề nghị khoa nâng hạn mức.`,
    );
  }

  async activeSemesterId(): Promise<number | undefined> {
    const semester = await this.prisma.semester.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    return semester?.id;
  }

  private async countGroups(ids: number[], semesterId: number) {
    const rows = await this.prisma.registrationGroup.findMany({
      where: {
        semesterId,
        // A group that was turned down handed the topic back, so it is not
        // work anybody is doing.
        status: { not: RegistrationGroupStatus.REJECTED },
        topic: { lecturerId: { in: ids } },
      },
      select: { topic: { select: { lecturerId: true } } },
    });

    return tally(rows.map((row) => row.topic.lecturerId));
  }

  private async countReserved(ids: number[], semesterId: number) {
    const rows = await this.prisma.topic.findMany({
      where: {
        semesterId,
        lecturerId: { in: ids },
        sourceProposalId: { not: null },
        round: { phase: { in: [...OPEN_ENOUGH_TO_HOLD] } },
        registrationGroups: {
          none: { status: { not: RegistrationGroupStatus.REJECTED } },
        },
      },
      select: { lecturerId: true },
    });

    return tally(rows.map((row) => row.lecturerId));
  }
}

function tally(ids: number[]): Map<number, number> {
  const counts = new Map<number, number>();

  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);

  return counts;
}

function describe(
  groups: number,
  reserved: number,
  quota: number | null,
): MentoringLoad {
  return {
    groups,
    reserved,
    quota,
    // `>=` rather than `===`: the office can lower a quota below a load already
    // taken on, and a lecturer sitting above their new ceiling is full, not
    // free.
    atQuota: quota !== null && groups + reserved >= quota,
  };
}
