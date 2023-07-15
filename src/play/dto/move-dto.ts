import { IsString, MaxLength } from "class-validator";
import { SquareType } from "../types";

export class MoveDto {
  @IsString()
  @MaxLength(50)
  playerId: string;

  @IsString()
  @MaxLength(50)
  roomId: string;

  @IsString()
  @MaxLength(2)
  from: SquareType

  @IsString()
  @MaxLength(2)
  to: SquareType
}

