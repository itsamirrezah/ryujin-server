import { ConflictException, Controller, Get, Param } from "@nestjs/common";
import { PlayService } from "./service/play.service";

@Controller('play')
export class PlayController {
  constructor(private readonly playService: PlayService) { }

  @Get('/validate-room/:roomId')
  async validatePrivateRoom(@Param() param: { roomId: string }) {
    try {
      const room = await this.playService.isRoomAvailable(param.roomId)
      return room
    } catch {
      throw new ConflictException("room is not available")
    }
  }
}
