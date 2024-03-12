import { IsInt, IsOptional, Max, Min } from "class-validator";
import { cards } from "../consts";

export class GameInfoDto {
  @IsInt()
  @Min(180000)
  @Max(480000)
  @IsOptional()
  time: number = 480000;

  @IsInt()
  @Min(5)
  @Max(cards.length)
  @IsOptional()
  numberOfCards: number = 16;
}
