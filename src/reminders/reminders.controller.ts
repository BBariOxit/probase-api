import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RemindersService } from './reminders.service';

@Roles('ADMIN')
@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  run() {
    return this.reminders.run();
  }
}
