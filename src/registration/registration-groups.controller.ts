import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '../../generated/prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { QueryMyGroupDto } from './dto/query-my-group.dto';
import { QuerySupervisedGroupsDto } from './dto/query-supervised-groups.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { RegistrationGroupsService } from './registration-groups.service';

@Controller('registration-groups')
export class RegistrationGroupsController {
  constructor(private readonly groups: RegistrationGroupsService) {}

  @Roles('STUDENT')
  @Get('me')
  findMine(@Query() query: QueryMyGroupDto, @GetUser('id') userId: number) {
    return this.groups.findMine(query, userId);
  }

  @Roles('STUDENT')
  @Get('join/:code')
  previewByCode(@Param('code') code: string, @GetUser('id') userId: number) {
    return this.groups.previewByCode(code, userId);
  }

  @Roles('STUDENT')
  @Post('join/:code')
  joinByCode(@Param('code') code: string, @GetUser('id') userId: number) {
    return this.groups.joinByCode(code, userId);
  }

  @Roles('LECTURER')
  @Get('my-supervised')
  findSupervisedGroups(
    @Query() query: QuerySupervisedGroupsDto,
    @GetUser('id') userId: number,
  ) {
    return this.groups.findSupervisedGroups(query, userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
    @GetUser('role') role: Role,
  ) {
    return this.groups.findOne(id, userId, role);
  }

  @Roles('STUDENT')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGroupDto,
    @GetUser('id') userId: number,
  ) {
    return this.groups.update(id, dto, userId);
  }

  @Roles('STUDENT')
  @Post(':id/leave')
  leave(@Param('id', ParseIntPipe) id: number, @GetUser('id') userId: number) {
    return this.groups.leave(id, userId);
  }

  @Roles('STUDENT')
  @Delete(':id/members/:studentId')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @GetUser('id') userId: number,
  ) {
    return this.groups.removeMember(id, studentId, userId);
  }

  @Roles('STUDENT', 'ADMIN')
  @Delete(':id')
  disband(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
    @GetUser('role') role: Role,
  ) {
    return this.groups.disband(id, userId, role);
  }
}
