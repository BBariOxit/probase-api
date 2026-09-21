import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ZodValidationPipe } from 'nestjs-zod';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserSchema } from './dto/create-user.dto';
import type { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpsertLecturerProfileDto } from './dto/upsert-lecturer-profile.dto';
import { UpsertStudentProfileDto } from './dto/upsert-student-profile.dto';
import { UsersService } from './users.service';
import type { SystemField } from './import/fuzzy-match.util';
import {
  generateImportTemplate,
  type ImportTemplateRole,
} from './import/generate-template.util';

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── User CRUD ─────────────────────────────────────────────

  @Get()
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // Body shape depends on `role`, so validation goes through the union schema
  // directly rather than the global pipe's DTO-class lookup.
  @Post()
  create(
    @Body(new ZodValidationPipe(CreateUserSchema)) dto: CreateUserDto,
    @GetUser('id') actorId: number,
  ) {
    return this.usersService.create(dto, actorId);
  }

  // ── Import Wizard ─────────────────────────────────────────
  //
  // 4-step flow:
  //   1. POST /users/import/parse          — upload file, get headers + fuzzy suggestions
  //   2. POST /users/import/preview        — dry-run validate with confirmed mapping
  //   3. POST /users/import/commit         — create accounts (no emails)
  //   4. POST /users/import/:id/send-emails — send welcome emails

  // The size cap belongs on multer, not on a validator: multer aborts the
  // stream mid-upload, whereas a ParseFilePipe validator only inspects
  // file.size once the whole body is already buffered in memory — which is
  // exactly the memory we are trying not to spend.

  /** Step 1: Upload file → get headers + fuzzy-matched column suggestions. */
  @Post('import/parse')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMPORT_FILE_BYTES, files: 1 },
    }),
  )
  parseImport(
    @UploadedFile(new ParseFilePipe({ validators: [], fileIsRequired: true }))
    file: Express.Multer.File,
    @GetUser('id') adminId: number,
  ) {
    return this.usersService.parseImport(file, adminId);
  }

  /** Step 2: Dry-run validate with confirmed column mapping. */
  @Post('import/preview')
  @HttpCode(HttpStatus.OK)
  previewImport(
    @Body()
    body: { sessionId: string; mapping: Record<SystemField, string | null> },
    @GetUser('id') adminId: number,
  ) {
    return this.usersService.previewImport(
      body.sessionId,
      body.mapping,
      adminId,
    );
  }

  /** Step 3: Commit — create accounts in DB. No emails sent. */
  @Post('import/commit')
  @HttpCode(HttpStatus.OK)
  commitImport(
    @Body()
    body: { sessionId: string; mapping: Record<SystemField, string | null> },
    @GetUser('id') adminId: number,
  ) {
    return this.usersService.commitImport(
      body.sessionId,
      body.mapping,
      adminId,
    );
  }

  /** Step 4: Send welcome emails for all committed accounts. */
  @Post('import/:sessionId/send-emails')
  @HttpCode(HttpStatus.OK)
  sendImportEmails(
    @Param('sessionId') sessionId: string,
    @GetUser('id') adminId: number,
  ) {
    return this.usersService.sendImportEmails(sessionId, adminId);
  }

  /** Download a pre-filled Excel template. */
  @Get('import/template')
  async downloadTemplate(@Query('role') role: string, @Res() res: Response) {
    const templateRole: ImportTemplateRole =
      role?.toUpperCase() === 'LECTURER' ? 'LECTURER' : 'STUDENT';

    const buffer = await generateImportTemplate(templateRole);
    const filename = `import-template-${templateRole.toLowerCase()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // ── Bulk import (legacy single-step) ──────────────────────

  @Post('bulk-import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMPORT_FILE_BYTES, files: 1 },
    }),
  )
  bulkImport(
    @UploadedFile(new ParseFilePipe({ validators: [], fileIsRequired: true }))
    file: Express.Multer.File,
  ) {
    return this.usersService.bulkImport(file);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @GetUser('id') actorId: number,
  ) {
    return this.usersService.update(id, dto, actorId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') actorId: number,
  ) {
    return this.usersService.remove(id, actorId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') actorId: number,
  ) {
    return this.usersService.hardDelete(id, actorId);
  }

  // ── Admin reset password ──────────────────────────────────

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') actorId: number,
  ) {
    return this.usersService.resetPassword(id, actorId);
  }

  // ── Profiles ──────────────────────────────────────────────

  @Put(':id/student-profile')
  upsertStudentProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertStudentProfileDto,
    @GetUser('id') actorId: number,
  ) {
    return this.usersService.upsertStudentProfile(id, dto, actorId);
  }

  @Put(':id/lecturer-profile')
  upsertLecturerProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertLecturerProfileDto,
    @GetUser('id') actorId: number,
  ) {
    return this.usersService.upsertLecturerProfile(id, dto, actorId);
  }
}
