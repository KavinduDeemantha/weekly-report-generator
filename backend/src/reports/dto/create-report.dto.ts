import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AchievementDto } from './achievement.dto.js';
import { BlockerDto } from './blocker.dto.js';
import { NextWeekTaskDto } from './next-week-task.dto.js';
import { ReportTaskDto } from './report-task.dto.js';
import { TimeEntryDto } from './time-entry.dto.js';

export class CreateReportDto {
  @IsDateString()
  weekStart!: string;

  @IsDateString()
  weekEnd!: string;

  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportTaskDto)
  tasks?: ReportTaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NextWeekTaskDto)
  nextWeekTasks?: NextWeekTaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockerDto)
  blockers?: BlockerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AchievementDto)
  achievements?: AchievementDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeEntryDto)
  timeEntries?: TimeEntryDto[];
}
