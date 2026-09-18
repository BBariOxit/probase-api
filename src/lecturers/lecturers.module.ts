import { Module } from '@nestjs/common';
import { LecturersController } from './lecturers.controller';
import { LecturersService } from './lecturers.service';
import { MentoringLoadService } from './mentoring-load.service';

@Module({
  controllers: [LecturersController],
  providers: [LecturersService, MentoringLoadService],
  exports: [MentoringLoadService],
})
export class LecturersModule {}
