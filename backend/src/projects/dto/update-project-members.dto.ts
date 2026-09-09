import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class UpdateProjectMembersDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  userIds!: string[];
}
