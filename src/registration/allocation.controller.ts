import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AllocationService } from './allocation.service';
import { FinalizeRoundDto, PlaceStudentDto } from './dto/allocation.dto';

@Roles('ADMIN')
@Controller('rounds/:roundId/allocation')
export class AllocationController {
  constructor(private readonly allocation: AllocationService) {}

  @Get()
  desk(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.allocation.desk(roundId);
  }

  @Post('placements')
  place(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Body() dto: PlaceStudentDto,
    @GetUser('id') userId: number,
  ) {
    return this.allocation.place(roundId, dto, userId);
  }

  @Delete('placements/:studentId')
  unplace(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @GetUser('id') userId: number,
  ) {
    return this.allocation.unplace(roundId, studentId, userId);
  }

  @Post('finalize')
  finalize(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Body() dto: FinalizeRoundDto,
    @GetUser('id') userId: number,
  ) {
    return this.allocation.finalize(roundId, dto, userId);
  }
}
