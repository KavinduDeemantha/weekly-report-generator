import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { Role } from '../generated/prisma/enums.js';
import {
  createPaginationMeta,
  normalizePagination,
} from '../common/pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { ProjectQueryDto } from './dto/project-query.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { PaginatedProjects, ProjectResponse } from './projects.types.js';

const projectSelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjects(
    role: Role,
    query: ProjectQueryDto,
  ): Promise<PaginatedProjects> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const where =
      role === Role.MANAGER
        ? {
            isActive: query.isActive,
          }
        : {
            isActive: true,
          };

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        select: projectSelect,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async createProject(dto: CreateProjectDto): Promise<ProjectResponse> {
    try {
      return await this.prisma.project.create({
        data: {
          name: dto.name.trim(),
          description: normalizeOptionalString(dto.description),
        },
        select: projectSelect,
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Project name is already in use');
      }

      throw error;
    }
  }

  async updateProject(
    id: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    await this.ensureProjectExists(id);

    const data: Prisma.ProjectUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      data.description = normalizeOptionalString(dto.description);
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    try {
      return await this.prisma.project.update({
        where: { id },
        data,
        select: projectSelect,
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Project name is already in use');
      }

      throw error;
    }
  }

  async deactivateProject(id: string): Promise<ProjectResponse> {
    await this.ensureProjectExists(id);

    return this.prisma.project.update({
      where: { id },
      data: { isActive: false },
      select: projectSelect,
    });
  }

  async ensureActiveProject(id: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!project || !project.isActive) {
      throw new NotFoundException('Active project not found');
    }
  }

  private async ensureProjectExists(id: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }
}

function normalizeOptionalString(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
