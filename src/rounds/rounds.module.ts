import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { RequirementsService } from './requirements.service';
import { RoundPhaseService } from './round-phase.service';
import { RoundsController } from './rounds.controller';
import { RoundsService } from './rounds.service';

@Module({
  imports: [NotificationsModule],
  controllers: [RoundsController],
  providers: [RoundsService, RoundPhaseService, RequirementsService],
  exports: [RoundsService, RoundPhaseService, RequirementsService],
})
export class RoundsModule {}
