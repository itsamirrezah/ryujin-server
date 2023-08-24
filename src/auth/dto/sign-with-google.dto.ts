import { IsString } from "class-validator";
import { IsNotBlank } from "src/common/custom-validators";

export class SignWithGoogleDto {
  @IsString()
  @IsNotBlank()
  access: string
}
