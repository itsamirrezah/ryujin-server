import { Module } from '@nestjs/common';
import { RedisService } from 'src/common/redis.service';
import { UsersModule } from 'src/users/users.module';
import { PlayController } from './play.controller';
import { PlayGateway } from './play.gateway';
import { GameService } from './service/game.service';
import { PlayService } from './service/play.service';
import { RoomService } from './service/room.service';

@Module({
  imports: [UsersModule],
  controllers: [PlayController],
  providers: [PlayGateway, PlayService, RoomService, GameService, RedisService]
})
export class PlayModule { }
