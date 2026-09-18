import { Controller, Get, Header, Query, StreamableFile } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { QueryReportDto } from './dto/query-report.dto';
import { ReportsExportService } from './reports-export.service';
import { ReportsService } from './reports.service';

@Roles('ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly exports: ReportsExportService,
  ) {}

  @Get()
  summary(@Query() query: QueryReportDto) {
    return this.reports.summary(query.semesterId);
  }

  @Get('export')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header('Content-Disposition', 'attachment; filename="bao-cao-thong-ke.xlsx"')
  async export(@Query() query: QueryReportDto) {
    return new StreamableFile(await this.exports.workbook(query.semesterId));
  }
}
