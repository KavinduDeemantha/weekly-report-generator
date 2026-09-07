import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AchievementDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description!: string;

  @IsOptional()
  @IsBoolean()
  isKeyAchievement = false;
}
