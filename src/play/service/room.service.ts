import { Injectable } from '@nestjs/common';
import { Room } from '../entity/room';

//FIXME: use database 
const rooms = [] as Room[]

@Injectable()
export class RoomService {

  createRoom(clientId: string): Room {
    const room = new Room(clientId)
    rooms.push(room)
    return room
  }
  getAvailableRoom(): Room | undefined {
    return rooms.find(room => room.isAvailable())
  }

  getRoomByUser(clientId: string): Room | undefined {
    return rooms.find(room => room.hasUser(clientId))
  }
}
