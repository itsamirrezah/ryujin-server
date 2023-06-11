import { Module } from '@nestjs/common';
import { PlayGateway } from './play.gateway';
import { PlayService } from './service/play.service'; 
import { RoomService } from './service/room.service';

@Module({
  providers: [PlayGateway, PlayService, RoomService]
})
export class PlayModule { }
