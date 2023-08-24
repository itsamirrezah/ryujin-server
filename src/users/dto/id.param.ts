import { IsNotEmpty, IsString } from "class-validator"
export class IdParam {
  @IsString()
  @IsNotEmpty()
  id: string;
}
