import { IsOptional, IsString, MaxLength } from "class-validator";

export class JoinRoomDto {
  @IsString()
  @IsOptional()
  @MaxLength(10)
  roomId: string;

}

