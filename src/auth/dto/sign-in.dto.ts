import { IsString, MaxLength } from "class-validator";

export class SignInDto{
  @IsString()
  @MaxLength(50)
  usernameOrEmail: string;

  @IsString()
  @MaxLength(50)
  password: string; 
}
