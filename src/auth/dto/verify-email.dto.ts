import { IsString } from "class-validator";
import { IsNotBlank } from "src/common/custom-validators";

export class VerifyEmailDto {
  @IsString()
  @IsNotBlank()
  token: string
}

