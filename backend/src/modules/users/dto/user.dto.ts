import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsPhoneNumber,
} from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  password!: string;

  firstName!: string;
  lastName!: string;
}

export class UpdateEmployeeProfileDto {
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profilePictureUrl?: string;
}
