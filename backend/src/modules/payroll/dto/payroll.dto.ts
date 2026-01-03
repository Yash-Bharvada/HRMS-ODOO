import { IsNumber, IsDateString, IsOptional } from "class-validator";

export class CreatePayrollDto {
  @IsNumber()
  baseSalary!: number;

  @IsOptional()
  @IsNumber()
  allowances?: number;

  @IsOptional()
  @IsNumber()
  deductions?: number;

  @IsDateString()
  effectiveDate!: string; // ISO date format
}

export class UpdatePayrollDto {
  @IsOptional()
  @IsNumber()
  baseSalary?: number;

  @IsOptional()
  @IsNumber()
  allowances?: number;

  @IsOptional()
  @IsNumber()
  deductions?: number;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}
