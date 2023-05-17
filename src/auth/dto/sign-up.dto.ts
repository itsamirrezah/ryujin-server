import { IsEmail, IsString, MaxLength } from "class-validator";

export class SignUpDto {
  @IsString()
  @MaxLength(50)
  @IsEmail()
  email: string;
  @IsString()
  @MaxLength(50)
  username: string;

  @IsString()
  @MaxLength(50)
  password: string; 
}
