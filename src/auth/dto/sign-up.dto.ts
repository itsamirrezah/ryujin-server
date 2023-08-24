import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class SignUpDto {

  @IsString()
  @IsEmail({}, { message: "email is not valid" })
  email: string;

  @IsString({ message: "username must be a string" })
  @MinLength(3, { message: "username must contain at least 3 characters" })
  @MaxLength(30, { message: "username must contain less than 30 characters" })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: "username can only contain letters, numbers and underscores" })
  username: string;

  @IsString()
  @MinLength(8, { message: "password must contain at least 8 characters" })
  @MaxLength(30, { message: "password must contain less than 30 characters" })
  password: string;
}
