import { Type } from 'class-transformer';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { TimeEntryType } from '../../generated/prisma/enums.js';

export class TimeEntryDto {
  @IsEnum(TimeEntryType)
  type!: TimeEntryType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hours!: number;
}
