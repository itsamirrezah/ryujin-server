import { Module } from '@nestjs/common';
import { PlayGateway } from './play.gateway';
import { GameService } from './service/game.service';
import { PlayService } from './service/play.service';
import { RoomService } from './service/room.service';

@Module({
  providers: [PlayGateway, PlayService, RoomService, GameService]
})
export class PlayModule { }
