import { Injectable, NotFoundException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { QueryStudentsDto } from './dto/query-students.dto';
import {
  StudentRosterService,
  type RosterFilters,
  type RosterRow,
} from './student-roster.service';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roster: StudentRosterService,
  ) {}

  async findAll(query: QueryStudentsDto) {
    const filters = await this.toFilters(query);

    const [items, total] = await Promise.all([
      this.roster.find(filters, {
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.roster.count(filters),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async exportAll(query: QueryStudentsDto): Promise<Buffer> {
    const filters = await this.toFilters(query);
    const rows = await this.roster.find(filters);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ProBase';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Sinh viên');
    sheet.columns = [
      { header: 'Mã SV', key: 'studentCode', width: 12 },
      { header: 'Họ và tên', key: 'fullName', width: 26 },
      { header: 'Lớp', key: 'class', width: 12 },
      { header: 'Khóa', key: 'cohort', width: 8 },
      { header: 'Chuyên ngành', key: 'major', width: 22 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Loại đồ án', key: 'projectType', width: 18 },
      { header: 'Đề tài', key: 'topic', width: 42 },
      { header: 'GV hướng dẫn', key: 'lecturer', width: 24 },
      { header: 'Ghi chú', key: 'note', width: 30 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    for (const row of rows) sheet.addRow(toSheetRow(row));

    // Written to a buffer rather than streamed: the roster is a few hundred rows
    // of text, and a stream would mean holding the response open across the
    // whole query for no gain a person could notice.
    const file = await workbook.xlsx.writeBuffer();

    return Buffer.from(file);
  }

  private async toFilters(query: QueryStudentsDto): Promise<RosterFilters> {
    const semesterId = query.semesterId ?? (await this.activeSemesterId());

    const cohorts = query.roundId
      ? await this.cohortsOf(query.roundId)
      : undefined;

    return {
      semesterId,
      cohorts,
      cohort: query.cohort,
      majorId: query.majorId,
      class: query.class,
      lecturerId: query.lecturerId,
      hasGroup: query.hasGroup,
      q: query.q,
    };
  }

  private async cohortsOf(roundId: number): Promise<string[]> {
    const round = await this.prisma.registrationRound.findUnique({
      where: { id: roundId },
      select: { eligibilities: { select: { cohort: true } } },
    });

    if (!round) throw new NotFoundException('Không tìm thấy đợt đăng ký');

    // An empty list would filter to nothing and read as "no students in this
    // đợt", when what it means is that nobody has declared who it is for.
    return round.eligibilities.map((rule) => rule.cohort);
  }

  private async activeSemesterId(): Promise<number | undefined> {
    const semester = await this.prisma.semester.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    return semester?.id;
  }
}

function toSheetRow(row: RosterRow) {
  return {
    studentCode: row.studentCode,
    fullName: row.fullName,
    class: row.class ?? '',
    cohort: row.cohort ?? '',
    major: row.major?.name ?? '',
    email: row.email,
    projectType: row.group?.topic.projectType.name ?? '',
    topic: row.group?.topic.title ?? '',
    lecturer: row.group
      ? [
          row.group.topic.lecturer.academicTitle,
          row.group.topic.lecturer.fullName,
        ]
          .filter(Boolean)
          .join(' ')
      : '',
    note: row.note ?? '',
  };
}
