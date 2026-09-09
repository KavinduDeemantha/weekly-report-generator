import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class ManagerChatFiltersDto {
  @IsOptional()
  @IsDateString()
  weekStart?: string | null;

  @IsOptional()
  @IsDateString()
  week?: string | null;

  @IsOptional()
  @IsDateString()
  from?: string | null;

  @IsOptional()
  @IsDateString()
  to?: string | null;

  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @IsOptional()
  @IsUUID()
  projectId?: string | null;
}

class ManagerChatHistoryItemDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MaxLength(2000)
  content!: string;
}

export class ManagerChatDto {
  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ManagerChatFiltersDto)
  filters?: ManagerChatFiltersDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ManagerChatHistoryItemDto)
  history?: ManagerChatHistoryItemDto[];
}
