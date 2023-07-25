import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/common/redis.service';
import { Room } from '../entity/room';
import { Player } from '../consts';

@Injectable()
export class RoomService {

  constructor(private readonly redisService: RedisService) { }

  async joinRoom(player: Player): Promise<Room> {
    const availableRoom = await this.getAvailableRoom()
    if (availableRoom) {
      const updatedRoom = availableRoom.join(player)
      await this.redisService.set(`room:${updatedRoom.id}`, JSON.stringify(updatedRoom))
      return updatedRoom
    }
    return this.createRoom(player)
  }

  async createRoom(player: Player): Promise<Room> {
    const room = new Room([player])
    await this.redisService.set(`room:${room.id}`, JSON.stringify(room))
    return room
  }
  async getAvailableRoom(): Promise<Room> | undefined {
    const roomIds = await this.redisService.keys('room:*')
    if (roomIds.length <= 0) return;

    const stringifyRooms = await this.redisService.mget(...roomIds)

    for (let i = 0; i < stringifyRooms.length; i++) {
      const room = JSON.parse(stringifyRooms[i]) as { id: string, players: Player[] }
      if (room.players.length < 2) return new Room(room.players, room.id)
    }
    return;
  }
}
