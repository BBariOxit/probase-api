import {
  Prisma,
  RegistrationGroupStatus,
  TopicStatus,
} from '../../generated/prisma/client';

const LIVE_GROUP = {
  status: { not: RegistrationGroupStatus.REJECTED },
} satisfies Prisma.RegistrationGroupWhereInput;

export async function markTopicsUnderway(
  tx: Prisma.TransactionClient,
  roundId: number,
): Promise<number> {
  const { count } = await tx.topic.updateMany({
    where: {
      roundId,
      status: { in: [TopicStatus.OPEN, TopicStatus.APPROVED] },
      registrationGroups: { some: LIVE_GROUP },
    },
    data: { status: TopicStatus.IN_PROGRESS },
  });

  return count;
}

export async function markTopicsBackOnOffer(
  tx: Prisma.TransactionClient,
  roundId: number,
): Promise<number> {
  const { count } = await tx.topic.updateMany({
    where: { roundId, status: TopicStatus.IN_PROGRESS },
    data: { status: TopicStatus.OPEN },
  });

  return count;
}
