import {
  isEmail,
  IsString,
  matches,
  maxLength,
  MaxLength,
  MinLength,
  minLength,
} from "class-validator";
import { IsUnion } from "src/common/custom-validators";

export class SignInDto {
  @IsString()
  @IsUnion([
    (value) => maxLength(value, 30) && minLength(value, 3) && matches(value, /^[a-zA-Z0-9_]+$/),
    (value) => isEmail(value),
  ], { message: "The provided email or username is not valid. Please verify and try again" })
  usernameOrEmail: string;

  @IsString()
  @MinLength(8, { message: "password must contain at least 8 characters" })
  @MaxLength(30, { message: "password must contain less than 30 characters" })
  password: string;
}

