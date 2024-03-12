import { Type } from "class-transformer";
import { IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { GameInfoDto } from "./game-info-dto";

export class JoinRoomDto {
  @IsString()
  @IsOptional()
  @MaxLength(10)
  roomId: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GameInfoDto)
  gameInfo?: GameInfoDto;
}

