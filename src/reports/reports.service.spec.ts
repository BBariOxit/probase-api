import { Test, TestingModule } from '@nestjs/testing';
import { GroupJoinSource, RoundPhase } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RoundPhaseService } from '../rounds/round-phase.service';
import { StudentRosterService } from '../students/student-roster.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const round = {
    id: 3,
    semesterId: 1,
    phase: RoundPhase.FINALIZED,
    registrationStart: new Date('2026-08-01T00:00:00.000Z'),
    registrationEnd: new Date('2026-08-20T00:00:00.000Z'),
    projectType: { id: 3, name: 'Đồ án Tốt nghiệp', code: 'DATN' },
    eligibilities: [{ cohort: '2022' }],
  };

  const member = (joinSource: GroupJoinSource) => ({
    joinSource,
    student: { majorId: 1 },
    group: { topic: { roundId: round.id, lecturerId: 4 } },
  });

  beforeEach(async () => {
    prisma = {
      semester: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Học kỳ 1',
          code: 'HK1',
        }),
        findUnique: jest.fn(),
      },
      registrationRound: { findMany: jest.fn().mockResolvedValue([round]) },
      registrationGroupMember: { findMany: jest.fn().mockResolvedValue([]) },
      registrationGroup: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 70, topic: { roundId: round.id, lecturerId: 4 } },
          ]),
      },
      topic: { groupBy: jest.fn().mockResolvedValue([]) },
      major: { findMany: jest.fn().mockResolvedValue([]) },
      studentProfile: { groupBy: jest.fn().mockResolvedValue([]) },
      submission: { findMany: jest.fn().mockResolvedValue([]) },
      submissionRequirement: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 8,
            roundId: round.id,
            name: 'Đề cương',
            dueAt: new Date('2026-08-22T00:00:00.000Z'),
            isRequired: true,
          },
        ]),
      },
      lecturerProfile: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 4, fullName: 'Trần Thị B', academicTitle: 'TS' },
          ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: RoundPhaseService,
          useValue: {
            resolveMany: jest
              .fn()
              .mockResolvedValue(new Map([[round.id, RoundPhase.FINALIZED]])),
          },
        },
        {
          provide: StudentRosterService,
          useValue: { count: jest.fn().mockResolvedValue(0) },
        },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  describe('how students reached their topic', () => {
    it('counts a join link as the student choosing, not as a placement', async () => {
      prisma.registrationGroupMember.findMany.mockResolvedValue([
        member(GroupJoinSource.SELF),
        member(GroupJoinSource.LINK),
        member(GroupJoinSource.ASSIGNED),
      ]);

      const report = await service.summary();

      expect(report.rounds[0].selfRegistered).toBe(2);
      expect(report.rounds[0].assigned).toBe(1);
    });
  });

  describe('groups waiting on their supervisor', () => {
    const revised = [
      {
        groupId: 70,
        requirementId: 8,
        version: 1,
        feedbackAt: new Date(),
      },
      {
        groupId: 70,
        requirementId: 8,
        version: 2,
        feedbackAt: new Date(),
      },
      {
        groupId: 70,
        requirementId: 8,
        version: 3,
        feedbackAt: null,
      },
    ];

    it('counts a group once however many versions it handed in', async () => {
      prisma.submission.findMany.mockResolvedValue(revised);

      const report = await service.summary();

      expect(report.progress[0].items[0].submitted).toBe(1);
      expect(report.progress[0].complete).toBe(1);
      expect(report.progress[0].awaitingFeedback).toBe(1);
    });

    it('leaves out a group whose newest version has been answered', async () => {
      prisma.submission.findMany.mockResolvedValue([
        revised[2],
        {
          groupId: 70,
          requirementId: 8,
          version: 4,
          feedbackAt: new Date(),
        },
      ]);

      const report = await service.summary();

      expect(report.progress[0].awaitingFeedback).toBe(0);
    });

    it('does not let an optional document hold a group back', async () => {
      prisma.submissionRequirement.findMany.mockResolvedValue([
        {
          id: 8,
          roundId: round.id,
          name: 'Đề cương',
          dueAt: new Date('2026-08-22T00:00:00.000Z'),
          isRequired: true,
        },
        {
          id: 9,
          roundId: round.id,
          name: 'Slide bảo vệ',
          dueAt: new Date('2026-12-01T00:00:00.000Z'),
          isRequired: false,
        },
      ]);
      prisma.submission.findMany.mockResolvedValue([revised[2]]);

      const report = await service.summary();

      expect(report.progress[0].required).toBe(1);
      expect(report.progress[0].complete).toBe(1);
    });
  });
});
