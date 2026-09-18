import { Module } from '@nestjs/common';
import { StudentRosterService } from './student-roster.service';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, StudentRosterService],
  exports: [StudentRosterService],
})
export class StudentsModule {}
