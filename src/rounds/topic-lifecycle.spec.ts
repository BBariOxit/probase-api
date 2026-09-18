import {
  Prisma,
  RegistrationGroupStatus,
  TopicStatus,
} from '../../generated/prisma/client';
import { markTopicsBackOnOffer, markTopicsUnderway } from './topic-lifecycle';

describe('topic lifecycle', () => {
  function transaction() {
    const updateMany = jest.fn().mockResolvedValue({ count: 3 });

    return {
      tx: { topic: { updateMany } } as unknown as Prisma.TransactionClient,
      updateMany,
    };
  }

  describe('markTopicsUnderway', () => {
    it('only touches topics a live group actually took', async () => {
      const { tx, updateMany } = transaction();

      await markTopicsUnderway(tx, 7);

      expect(updateMany).toHaveBeenCalledWith({
        where: {
          roundId: 7,
          status: { in: [TopicStatus.OPEN, TopicStatus.APPROVED] },
          registrationGroups: {
            some: { status: { not: RegistrationGroupStatus.REJECTED } },
          },
        },
        data: { status: TopicStatus.IN_PROGRESS },
      });
    });

    it('reports how many it moved, for the audit entry', async () => {
      const { tx } = transaction();

      await expect(markTopicsUnderway(tx, 7)).resolves.toBe(3);
    });
  });

  describe('markTopicsBackOnOffer', () => {
    it('reopens only what finalising set running', async () => {
      const { tx, updateMany } = transaction();

      await markTopicsBackOnOffer(tx, 7);

      expect(updateMany).toHaveBeenCalledWith({
        where: { roundId: 7, status: TopicStatus.IN_PROGRESS },
        data: { status: TopicStatus.OPEN },
      });
    });
  });
});
