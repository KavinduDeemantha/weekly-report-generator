import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class BlockerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description!: string;

  @IsOptional()
  @IsBoolean()
  isKeyIssue = false;

  @IsOptional()
  @IsBoolean()
  isResolved = false;
}
