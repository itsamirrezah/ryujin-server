import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/common/redis.service';
import { Room } from '../entity/room';
import { PlayerInfo } from '../types';

@Injectable()
export class RoomService {

  constructor(private readonly redisService: RedisService) { }

  async joinRoom(player: PlayerInfo): Promise<Room> {
    const availableRoom = await this.getAvailableRoom()
    if (availableRoom) {
      const updatedRoom = availableRoom.join(player)
      await this.redisService.set(`room:${updatedRoom.id}`, JSON.stringify(updatedRoom))
      return updatedRoom
    }
    return this.createRoom(player)
  }

  async createRoom(player: PlayerInfo): Promise<Room> {
    const room = Room.createNewRoom(player)
    await this.redisService.set(`room:${room.id}`, JSON.stringify(room))
    return room
  }

  async getAvailableRoom(): Promise<Room> | undefined {
    const roomIds = await this.redisService.keys('room:*')
    if (roomIds.length <= 0) return;

    const stringifyRooms = await this.redisService.mget(...roomIds)

    for (let i = 0; i < stringifyRooms.length; i++) {
      const room = new Room(JSON.parse(stringifyRooms[i]) as Room)
      if (room.players.length < 2 && !room.isObsolote() && !room.isPrivate) return room
    }
    return;
  }

  async getRoomById(roomId: string) {
    const roomIds = await this.redisService.keys(`room:${roomId}`)
    if (roomIds.length !== 1) throw new Error("something went wrong")
    const stringifyRoom = await this.redisService.get(roomIds[0])
    const parsedRoom = JSON.parse(stringifyRoom) as Room
    return new Room(parsedRoom)
  }

  async getRoomByPlayerId(playerId: string) {
    const roomIds = await this.redisService.keys(`room:*`)
    if (roomIds.length === 0) return;

    for (let i = 0; i < roomIds.length; i++) {
      const stringifyRoom = await this.redisService.get(roomIds[i])
      const parsedRoom = JSON.parse(stringifyRoom) as Room
      const room = new Room(parsedRoom)
      if (room.hasUser(playerId)) {
        return room
      }
    }
    return;
  }

  async updateRoomDb(room: Room) {
    await this.redisService.set(`room:${room.id}`, JSON.stringify(room))
  }

}
