import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Role } from '../../generated/prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { MAX_DOCUMENT_BYTES } from '../cloudinary/cloudinary.service';
import {
  CreateSubmissionDto,
  QuerySubmissionsDto,
  SubmissionFeedbackDto,
} from './dto/submission.dto';
import { SubmissionsService } from './submissions.service';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Roles('STUDENT')
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1 },
    }),
  )
  create(
    @Body() dto: CreateSubmissionDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @GetUser('id') userId: number,
  ) {
    return this.submissionsService.create(dto, file, userId);
  }

  @Get()
  findAll(
    @Query() query: QuerySubmissionsDto,
    @GetUser('id') userId: number,
    @GetUser('role') role: Role,
  ) {
    return this.submissionsService.findAll(query, userId, role);
  }

  @Roles('LECTURER')
  @Post(':id/feedback')
  giveFeedback(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmissionFeedbackDto,
    @GetUser('id') userId: number,
  ) {
    return this.submissionsService.giveFeedback(id, dto, userId);
  }
}
