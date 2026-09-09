import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { ProjectQueryDto } from './dto/project-query.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { UpdateProjectMembersDto } from './dto/update-project-members.dto.js';
import { PaginatedProjects, ProjectResponse } from './projects.types.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  listProjects(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProjectQueryDto,
  ): Promise<PaginatedProjects> {
    return this.projectsService.listProjects(user, query);
  }

  @Roles(Role.MANAGER)
  @Get(':id/members')
  listProjectMembers(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projectsService.listProjectMembers(id);
  }

  @Roles(Role.MANAGER)
  @Put(':id/members')
  updateProjectMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectMembersDto,
  ) {
    return this.projectsService.updateProjectMembers(id, dto.userIds);
  }

  @Roles(Role.MANAGER)
  @Post()
  createProject(@Body() dto: CreateProjectDto): Promise<ProjectResponse> {
    return this.projectsService.createProject(dto);
  }

  @Roles(Role.MANAGER)
  @Patch(':id')
  updateProject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.updateProject(id, dto);
  }

  @Roles(Role.MANAGER)
  @Delete(':id')
  deactivateProject(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProjectResponse> {
    return this.projectsService.deactivateProject(id);
  }
}
