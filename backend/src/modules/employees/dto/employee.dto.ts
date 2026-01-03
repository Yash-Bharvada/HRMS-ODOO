import { IsOptional, IsString, IsPhoneNumber } from "class-validator";

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  designation?: string;
}

export class UpdateEmployeeByAdminDto extends UpdateEmployeeDto {
  // Admin can update all fields, employees can only update specific ones
}
