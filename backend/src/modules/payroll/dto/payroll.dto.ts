import { IsNumber, IsDateString, IsOptional, Min } from "class-validator";

export class CreatePayrollDto {
  @IsNumber()
  @Min(0)
  baseSalary!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  allowances?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deductions?: number;

  @IsDateString()
  effectiveDate!: string; // ISO date format
}

export class UpdatePayrollDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  allowances?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deductions?: number;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}
