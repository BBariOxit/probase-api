import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RegisterTopicDto } from './dto/register-topic.dto';
import { RegistrationGroupsService } from './registration-groups.service';

@Controller('topics')
export class TopicRegistrationController {
  constructor(private readonly groups: RegistrationGroupsService) {}

  @Roles('STUDENT')
  @Post(':id/register')
  register(
    @Param('id', ParseIntPipe) topicId: number,
    @Body() dto: RegisterTopicDto,
    @GetUser('id') userId: number,
  ) {
    return this.groups.register(topicId, dto, userId);
  }

  @Roles('STUDENT')
  @Post(':id/join')
  join(
    @Param('id', ParseIntPipe) topicId: number,
    @GetUser('id') userId: number,
  ) {
    return this.groups.joinTopic(topicId, userId);
  }
}
