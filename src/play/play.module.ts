import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { PlayGateway } from './play.gateway';
import { GameService } from './service/game.service';
import { PlayService } from './service/play.service';
import { RoomService } from './service/room.service';

@Module({
  imports: [UsersModule],
  providers: [PlayGateway, PlayService, RoomService, GameService]
})
export class PlayModule { }
