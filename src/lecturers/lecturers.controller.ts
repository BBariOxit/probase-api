import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import type { Role } from '../../generated/prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { QueryLecturersDto } from './dto/query-lecturers.dto';
import { LecturersService } from './lecturers.service';

@Controller('lecturers')
export class LecturersController {
  constructor(private readonly lecturersService: LecturersService) {}

  @Get()
  findAll(@Query() query: QueryLecturersDto) {
    return this.lecturersService.findAll(query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
    @GetUser('role') role: Role,
  ) {
    return this.lecturersService.findOne(id, { userId, role });
  }
}
