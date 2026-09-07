import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskPriority, TaskStatus } from '../../generated/prisma/enums.js';

export class ReportTaskDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  plannedPercentage!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  actualPercentage!: number;

  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  plannedHours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualHours?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliverable?: string;
}
