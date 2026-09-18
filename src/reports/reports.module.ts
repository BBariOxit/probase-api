import { Module } from '@nestjs/common';
import { RoundsModule } from '../rounds/rounds.module';
import { StudentsModule } from '../students/students.module';
import { ReportsController } from './reports.controller';
import { ReportsExportService } from './reports-export.service';
import { ReportsService } from './reports.service';

@Module({
  imports: [RoundsModule, StudentsModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsExportService],
})
export class ReportsModule {}
