import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GroupMemberStatus,
  RegistrationGroupStatus,
  RoundPhase,
} from '../../generated/prisma/client';
import { endOfNamedDay, startOfNamedDay } from '../common/named-day.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoundPhaseService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(roundId: number): Promise<RoundPhase> {
    const round = await this.load(roundId);

    return this.advance(round);
  }

  async requireCanJoin(roundId: number, studentId: number): Promise<void> {
    const round = await this.load(roundId);
    const phase = await this.advance(round);

    if (phase === RoundPhase.OPEN) return;

    if (phase === RoundPhase.EXTENDED) {
      // Asked here rather than left to the caller's own "already in a group"
      // check, so the rule that defines this phase lives where the phase does.
      // The two refusals also read differently, and a student in an extension
      // deserves the one that explains why the reopened gate is not for them.
      if (!(await this.hasGroup(studentId, round.semesterId))) return;

      throw new ConflictException(
        'Registration reopened only for students who ended up without a group — yours is unaffected and cannot be changed',
      );
    }

    throw new ConflictException(REFUSAL_BY_PHASE[phase]);
  }

  async requireCanPropose(roundId: number, studentId: number): Promise<void> {
    const round = await this.load(roundId);
    const phase = await this.advance(round);

    if (phase === RoundPhase.PREP || phase === RoundPhase.OPEN) return;

    if (phase === RoundPhase.EXTENDED) {
      if (!(await this.hasGroup(studentId, round.semesterId))) return;

      throw new ConflictException(
        'Registration reopened only for students who ended up without a group — you already have a topic',
      );
    }

    throw new ConflictException(REFUSAL_BY_PHASE[phase]);
  }

  async requireCanAcceptProposal(roundId: number): Promise<void> {
    const phase = await this.resolve(roundId);

    if (
      phase === RoundPhase.PREP ||
      phase === RoundPhase.OPEN ||
      phase === RoundPhase.EXTENDED
    ) {
      return;
    }

    throw new ConflictException(
      'Đợt đăng ký đã đóng, nên đề tài duyệt bây giờ sẽ không ai đăng ký được nữa. Bạn vẫn có thể từ chối kèm nhận xét.',
    );
  }

  async requireCanLeave(roundId: number): Promise<void> {
    const phase = await this.resolve(roundId);

    if (phase === RoundPhase.OPEN) return;

    throw new ConflictException(
      phase === RoundPhase.EXTENDED
        ? 'Registration has closed. The extension only lets students without a group register — a group that exists can no longer be changed'
        : REFUSAL_BY_PHASE[phase],
    );
  }

  private async load(roundId: number) {
    const round = await this.prisma.registrationRound.findUnique({
      where: { id: roundId },
      select: {
        id: true,
        semesterId: true,
        phase: true,
        registrationStart: true,
        registrationEnd: true,
      },
    });

    if (!round) {
      throw new NotFoundException(`Registration round ${roundId} not found`);
    }

    return round;
  }

  async resolveMany<T extends PhaseRow>(
    rounds: T[],
  ): Promise<Map<number, RoundPhase>> {
    const current = new Map<number, RoundPhase>();
    const moved: { id: number; from: RoundPhase; to: RoundPhase }[] = [];

    for (const round of rounds) {
      const due = duePhase(round);
      current.set(round.id, due);

      if (due !== round.phase) {
        moved.push({ id: round.id, from: round.phase, to: due });
      }
    }

    // Guarded on the phase that was read rather than a plain update, so two
    // requests arriving together cannot fight: the second matches no rows and
    // does nothing, instead of writing over a phase that has since moved on.
    await Promise.all(
      moved.map((move) =>
        this.prisma.registrationRound.updateMany({
          where: { id: move.id, phase: move.from },
          data: { phase: move.to },
        }),
      ),
    );

    return current;
  }

  private async advance(round: PhaseRow): Promise<RoundPhase> {
    const phases = await this.resolveMany([round]);

    return phases.get(round.id) ?? round.phase;
  }

  private async hasGroup(studentId: number, semesterId: number) {
    const membership = await this.prisma.registrationGroupMember.findFirst({
      where: {
        studentId,
        semesterId,
        status: GroupMemberStatus.ACCEPTED,
        group: { status: { not: RegistrationGroupStatus.REJECTED } },
      },
      select: { id: true },
    });

    return membership !== null;
  }
}

interface PhaseRow {
  id: number;
  phase: RoundPhase;
  registrationStart: Date;
  registrationEnd: Date;
}

export function duePhase(round: {
  phase: RoundPhase;
  registrationStart: Date;
  registrationEnd: Date;
}): RoundPhase {
  const now = Date.now();
  const opens = startOfNamedDay(round.registrationStart);
  const closes = endOfNamedDay(round.registrationEnd);

  if (round.phase === RoundPhase.PREP) {
    if (now >= closes) return RoundPhase.RECONCILING;

    return now >= opens ? RoundPhase.OPEN : RoundPhase.PREP;
  }

  if (round.phase === RoundPhase.OPEN || round.phase === RoundPhase.EXTENDED) {
    return now >= closes ? RoundPhase.RECONCILING : round.phase;
  }

  return round.phase;
}

const REFUSAL_BY_PHASE: Record<
  Exclude<RoundPhase, 'OPEN' | 'EXTENDED'>,
  string
> = {
  [RoundPhase.PREP]:
    'Registration for this round has not opened yet — no topic can be taken while the faculty office is still preparing',
  [RoundPhase.RECONCILING]:
    'Registration has closed. The faculty office is placing the students who ended up without a group, so groups can no longer be changed',
  [RoundPhase.FINALIZED]:
    'Allocation for this round is final and can no longer be changed',
};
