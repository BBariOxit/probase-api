import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { formatDate } from '../common/named-day.util';
import { ReportsService, type FacultyReport } from './reports.service';

const PHASE_LABEL: Record<string, string> = {
  PREP: 'Chưa mở',
  OPEN: 'Đang mở',
  RECONCILING: 'Đang phân bổ',
  EXTENDED: 'Đang gia hạn',
  FINALIZED: 'Đã chốt',
};

@Injectable()
export class ReportsExportService {
  constructor(private readonly reports: ReportsService) {}

  async workbook(semesterId?: number): Promise<Buffer> {
    const report = await this.reports.summary(semesterId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ProBase';
    workbook.created = new Date();

    this.registrationSheet(workbook, report);
    this.supervisionSheet(workbook, report);
    this.progressSheet(workbook, report);

    // Written to a buffer rather than streamed: this is a few dozen rows of
    // text, and a stream would hold the response open across the whole read for
    // no gain anybody could notice.
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private registrationSheet(workbook: ExcelJS.Workbook, report: FacultyReport) {
    const sheet = workbook.addWorksheet('Đợt đăng ký');

    sheet.columns = [
      { header: 'Đợt', key: 'projectType', width: 24 },
      { header: 'Trạng thái', key: 'phase', width: 14 },
      { header: 'Khóa', key: 'cohorts', width: 14 },
      { header: 'SV thuộc diện', key: 'eligible', width: 14 },
      { header: 'Đã có nhóm', key: 'withGroup', width: 12 },
      { header: 'Chưa có nhóm', key: 'withoutGroup', width: 14 },
      { header: 'Tự đăng ký', key: 'selfRegistered', width: 12 },
      { header: 'Khoa xếp', key: 'assigned', width: 10 },
      { header: 'Đề tài', key: 'topics', width: 10 },
      { header: 'Đang thực hiện', key: 'topicsUnderway', width: 14 },
    ];

    for (const row of report.rounds) {
      sheet.addRow({
        projectType: row.projectType.name,
        phase: PHASE_LABEL[row.phase] ?? row.phase,
        cohorts: row.cohorts.join(', '),
        eligible: row.eligible,
        withGroup: row.withGroup,
        withoutGroup: row.withoutGroup,
        selfRegistered: row.selfRegistered,
        assigned: row.assigned,
        topics: row.topics,
        topicsUnderway: row.topicsUnderway,
      });
    }

    head(sheet);
  }

  private supervisionSheet(workbook: ExcelJS.Workbook, report: FacultyReport) {
    const sheet = workbook.addWorksheet('Phân bổ');

    sheet.columns = [
      { header: 'Giảng viên', key: 'name', width: 30 },
      { header: 'Số nhóm', key: 'groups', width: 10 },
      { header: 'Số SV', key: 'students', width: 10 },
    ];

    for (const row of report.supervision) {
      sheet.addRow({
        name: row.academicTitle
          ? `${row.academicTitle} ${row.fullName}`
          : row.fullName,
        groups: row.groups,
        students: row.students,
      });
    }

    head(sheet);

    sheet.addRow([]);
    head(sheet.addRow(['Chuyên ngành', 'Tổng SV', 'Có nhóm']));

    for (const row of report.majors) {
      sheet.addRow([row.name, row.students, row.withGroup]);
    }
  }

  private progressSheet(workbook: ExcelJS.Workbook, report: FacultyReport) {
    const sheet = workbook.addWorksheet('Tiến độ nộp bài');

    sheet.columns = [
      { header: 'Đợt', key: 'projectType', width: 24 },
      { header: 'Mục phải nộp', key: 'item', width: 24 },
      { header: 'Hạn nộp', key: 'dueAt', width: 14 },
      { header: 'Bắt buộc', key: 'required', width: 10 },
      { header: 'Số nhóm', key: 'groups', width: 10 },
      { header: 'Đã nộp', key: 'submitted', width: 10 },
    ];

    /*
      A row per document rather than per round, because the list is the
      faculty's to declare and its length differs between rounds — one row per
      round would either lose the detail or need a column per document, and the
      second is a sheet that changes shape every term.

      The round's own totals come first, then its documents underneath.
    */
    for (const round of report.progress) {
      sheet.addRow({
        projectType: round.projectType.name,
        item: `Nộp đủ ${round.required} mục bắt buộc`,
        groups: round.groups,
        submitted: round.complete,
      });

      for (const item of round.items) {
        sheet.addRow({
          item: `   ${item.name}`,
          dueAt: formatDate(item.dueAt),
          required: item.isRequired ? 'x' : '',
          groups: round.groups,
          submitted: item.submitted,
        });
      }
    }

    head(sheet);
  }
}

function head(target: ExcelJS.Worksheet | ExcelJS.Row) {
  if ('getRow' in target) {
    target.getRow(1).font = { bold: true };
    target.views = [{ state: 'frozen', ySplit: 1 }];

    return;
  }

  target.font = { bold: true };
}
