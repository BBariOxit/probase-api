import { Controller, Get, Header, Query, StreamableFile } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { QueryStudentsDto } from './dto/query-students.dto';
import { StudentsService } from './students.service';

@Roles('ADMIN')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll(@Query() query: QueryStudentsDto) {
    return this.studentsService.findAll(query);
  }

  @Get('export')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header(
    'Content-Disposition',
    'attachment; filename="danh-sach-sinh-vien.xlsx"',
  )
  async export(@Query() query: QueryStudentsDto) {
    return new StreamableFile(await this.studentsService.exportAll(query));
  }
}
