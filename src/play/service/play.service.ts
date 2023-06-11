import { Injectable } from '@nestjs/common';
import { RoomService } from './room.service';

@Injectable()
export class PlayService {
  constructor(private readonly roomService: RoomService) { }

  joinRoom(clientId: string) {
    const availableRoom = this.roomService.getAvailableRoom()
    if (availableRoom) {
      availableRoom.join(clientId)
      return availableRoom
    }
    return this.roomService.createRoom(clientId)
  }

}

