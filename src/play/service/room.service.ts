import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/common/redis.service';
import { Room } from '../entity/room';
import { GameInfo, PlayerInfo } from '../types';

@Injectable()
export class RoomService {
  constructor(private readonly redisService: RedisService) { }

  async joinRoom(player: PlayerInfo, gameInfo: GameInfo): Promise<Room> {
    const availableRoom = await this.getAvailableRoom(gameInfo, player.userId)
    if (availableRoom) {
      const updatedRoom = availableRoom.join(player)
      await this.redisService.client.set(`room:${updatedRoom.id}`, JSON.stringify(updatedRoom), "EX", 3600)
      return updatedRoom
    }
    return this.createRoom(player, gameInfo)
  }

  async createRoom(player: PlayerInfo, gameInfo: GameInfo): Promise<Room> {
    const room = Room.create(player, gameInfo)
    await this.redisService.client.set(`room:${room.id}`, JSON.stringify(room), "EX", 3600)
    return room
  }

  async getAvailableRoom(gameInfo: GameInfo, userId: string): Promise<Room> | undefined {
    const roomIds = await this.redisService.client.keys('room:*')
    if (roomIds.length <= 0) return;

    const stringifyRooms = await this.redisService.client.mget(...roomIds)

    for (let i = 0; i < stringifyRooms.length; i++) {
      const room = new Room(JSON.parse(stringifyRooms[i]) as Room)
      if (
        room.hasUserId(userId) ||
        room.players.length >= 2 ||
        room.isObsolete() ||
        room.isPrivate ||
        room.gameInfo.time !== gameInfo.time ||
        room.gameInfo.numberOfCards !== gameInfo.numberOfCards
      ) {
        continue
      }
      return room
    }
    return;
  }

  async getRoomById(roomId: string) {
    const roomIds = await this.redisService.client.keys(`room:${roomId}`)
    if (roomIds.length !== 1) throw new Error("something went wrong")
    const stringifyRoom = await this.redisService.client.get(roomIds[0])
    const parsedRoom = JSON.parse(stringifyRoom) as Room
    return new Room(parsedRoom)
  }

  async getRoomByPlayerId(playerId: string) {
    const roomIds = await this.redisService.client.keys(`room:*`)
    if (roomIds.length === 0) return;

    for (let i = 0; i < roomIds.length; i++) {
      const stringifyRoom = await this.redisService.client.get(roomIds[i])
      const parsedRoom = JSON.parse(stringifyRoom) as Room
      const room = new Room(parsedRoom)
      if (room.hasUser(playerId)) {
        return room
      }
    }
    return;
  }

  async updateRoomDb(room: Room) {
    await this.redisService.client.set(`room:${room.id}`, JSON.stringify(room), "EX", 3600)
  }

  async flushAllRooms() {
    const allRooms = await this.redisService.client.keys(`room:*`)
    if (allRooms.length <= 0) return;
    const res = await this.redisService.client.del(...allRooms)
    return res;
  }

}
