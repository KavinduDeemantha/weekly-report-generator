import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  TaskPriority,
  TaskStatus,
  TimeEntryType,
} from '../../generated/prisma/enums.js';
import { ReportAssistantAction } from '../ai.types.js';

class AssistantTaskDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @IsInt()
  @Min(0)
  @Max(100)
  plannedPercentage!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  actualPercentage!: number;

  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  plannedHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  actualHours?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliverable?: string;
}

class AssistantNextWeekTaskDto {
  @IsString()
  @MaxLength(500)
  description!: string;
}

class AssistantBlockerDto {
  @IsString()
  @MaxLength(500)
  description!: string;

  @IsBoolean()
  isKeyIssue!: boolean;

  @IsBoolean()
  isResolved!: boolean;
}

class AssistantAchievementDto {
  @IsString()
  @MaxLength(500)
  description!: string;

  @IsBoolean()
  isKeyAchievement!: boolean;
}

class AssistantTimeEntryDto {
  @IsEnum(TimeEntryType)
  type!: TimeEntryType;

  @IsNumber()
  @Min(0)
  @Max(168)
  hours!: number;
}

export class ReportAssistantContextDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AssistantTaskDto)
  tasks?: AssistantTaskDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AssistantNextWeekTaskDto)
  nextWeekTasks?: AssistantNextWeekTaskDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AssistantBlockerDto)
  blockers?: AssistantBlockerDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AssistantAchievementDto)
  achievements?: AssistantAchievementDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AssistantTimeEntryDto)
  timeEntries?: AssistantTimeEntryDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ReportAssistantDto {
  @IsEnum(ReportAssistantAction)
  action!: ReportAssistantAction;

  @IsDefined()
  @ValidateNested()
  @Type(() => ReportAssistantContextDto)
  context!: ReportAssistantContextDto;
}
