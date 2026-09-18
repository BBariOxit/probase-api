import {
  Body,
  Controller,
  Delete,
  Get,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { MeService } from './me.service';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const AVATAR_UPLOAD_RATE_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('profile')
  getProfile(@GetUser('id') userId: number) {
    return this.meService.getProfile(userId);
  }

  @Patch('profile')
  updateProfile(
    @GetUser('id') userId: number,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.meService.updateProfile(userId, dto);
  }

  @Throttle(AVATAR_UPLOAD_RATE_LIMIT)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
    }),
  )
  setAvatar(
    @GetUser('id') userId: number,
    // `fileIsRequired` rather than a null check in the service: a request with
    // no part named "file" is a malformed request, and 400 is the answer.
    @UploadedFile(new ParseFilePipe({ validators: [], fileIsRequired: true }))
    file: Express.Multer.File,
  ) {
    return this.meService.setAvatar(userId, file);
  }

  @Delete('avatar')
  removeAvatar(@GetUser('id') userId: number) {
    return this.meService.removeAvatar(userId);
  }
}
