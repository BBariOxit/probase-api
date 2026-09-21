import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ImportSessionService } from './import/import-session.service';

@Module({
  imports: [MailModule],
  controllers: [UsersController],
  providers: [UsersService, ImportSessionService],
})
export class UsersModule {}
