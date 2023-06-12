import { Injectable } from '@nestjs/common';
import { Room } from '../entity/room';
import { RoomService } from './room.service';

@Injectable()
export class PlayService {
  constructor(private readonly roomService: RoomService) { }

  joinRoom(clientId: string): Room {
    const userRoom = this.roomService.getRoomByUser(clientId)
    if (userRoom) return userRoom
    const availableRoom = this.roomService.getAvailableRoom()
    if (availableRoom) {
      availableRoom.join(clientId)
      return availableRoom
    }
    return this.roomService.createRoom(clientId)
  }

}

