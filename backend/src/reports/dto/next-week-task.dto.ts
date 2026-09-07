import { IsString, MaxLength, MinLength } from 'class-validator';

export class NextWeekTaskDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description!: string;
}
