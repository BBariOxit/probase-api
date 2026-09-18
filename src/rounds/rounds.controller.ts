import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Role } from '../../generated/prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExtendRoundDto } from './dto/extend-round.dto';
import { QueryRoundsDto } from './dto/query-rounds.dto';
import { SetRequirementsDto } from './dto/set-requirements.dto';
import { UnlockRoundDto } from './dto/unlock-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';
import { RequirementsService } from './requirements.service';
import { RoundsService } from './rounds.service';

@Controller('rounds')
export class RoundsController {
  constructor(
    private readonly roundsService: RoundsService,
    private readonly requirements: RequirementsService,
  ) {}

  @Get()
  findAll(
    @Query() query: QueryRoundsDto,
    @GetUser('id') userId: number,
    @GetUser('role') role: Role,
  ) {
    return this.roundsService.findAll(query, userId, role);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roundsService.findOne(id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoundDto) {
    return this.roundsService.update(id, dto);
  }

  @Roles('ADMIN')
  @Post(':id/extend')
  extend(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ExtendRoundDto,
    @GetUser('id') userId: number,
  ) {
    return this.roundsService.extend(id, dto, userId);
  }

  @Get(':id/requirements')
  findRequirements(@Param('id', ParseIntPipe) id: number) {
    return this.requirements.findForRound(id);
  }

  @Roles('ADMIN')
  @Put(':id/requirements')
  setRequirements(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetRequirementsDto,
    @GetUser('id') userId: number,
  ) {
    return this.requirements.setForRound(id, dto, userId);
  }

  @Roles('ADMIN')
  @Post(':id/unlock')
  unlock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UnlockRoundDto,
    @GetUser('id') userId: number,
  ) {
    return this.roundsService.unlock(id, dto, userId);
  }
}
