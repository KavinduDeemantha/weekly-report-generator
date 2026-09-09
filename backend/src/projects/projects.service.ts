import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { Role } from '../generated/prisma/enums.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import {
  createPaginationMeta,
  normalizePagination,
} from '../common/pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { ProjectQueryDto } from './dto/project-query.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import {
  PaginatedProjects,
  ProjectMemberResponse,
  ProjectResponse,
} from './projects.types.js';

const projectSelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const projectWithMemberCountSelect = {
  ...projectSelect,
  _count: {
    select: {
      members: true,
    },
  },
} as const;

const projectMemberSelect = {
  assignedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjects(
    user: AuthenticatedUser,
    query: ProjectQueryDto,
  ): Promise<PaginatedProjects> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const where =
      user.role === Role.MANAGER
        ? {
            isActive: query.isActive,
          }
        : {
            isActive: true,
            members: {
              some: {
                userId: user.id,
              },
            },
          };
    const select =
      user.role === Role.MANAGER ? projectWithMemberCountSelect : projectSelect;

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        select,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map(mapProjectResponse),
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

  async ensureAssignedActiveProject(id: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!project || !project.isActive) {
      throw new NotFoundException('Active project not found');
    }

    const assignment = await this.prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId,
        user: { role: Role.TEAM_MEMBER, isActive: true },
      },
      select: { id: true },
    });

    if (!assignment) {
      throw new ForbiddenException('Project is not assigned to this team member');
    }
  }

  async listProjectMembers(projectId: string): Promise<ProjectMemberResponse[]> {
    await this.ensureProjectExists(projectId);

    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { user: { name: 'asc' } },
      select: projectMemberSelect,
    });

    return members.map((member) => ({
      ...member.user,
      assignedAt: member.assignedAt,
    }));
  }

  async updateProjectMembers(
    projectId: string,
    userIds: string[],
  ): Promise<ProjectMemberResponse[]> {
    const uniqueUserIds = [...new Set(userIds)];

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { id: true, isActive: true },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      if (!project.isActive) {
        throw new BadRequestException('Inactive projects cannot be assigned');
      }

      if (uniqueUserIds.length > 0) {
        const users = await tx.user.findMany({
          where: {
            id: { in: uniqueUserIds },
            role: Role.TEAM_MEMBER,
            isActive: true,
          },
          select: { id: true },
        });

        if (users.length !== uniqueUserIds.length) {
          throw new BadRequestException(
            'Assignments can include active team members only',
          );
        }
      }

      await tx.projectMember.deleteMany({ where: { projectId } });

      if (uniqueUserIds.length > 0) {
        await tx.projectMember.createMany({
          data: uniqueUserIds.map((userId) => ({
            projectId,
            userId,
          })),
        });
      }

      const members = await tx.projectMember.findMany({
        where: { projectId },
        orderBy: { user: { name: 'asc' } },
        select: projectMemberSelect,
      });

      return members.map((member) => ({
        ...member.user,
        assignedAt: member.assignedAt,
      }));
    });
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

function mapProjectResponse(
  project:
    | Prisma.ProjectGetPayload<{ select: typeof projectSelect }>
    | Prisma.ProjectGetPayload<{ select: typeof projectWithMemberCountSelect }>,
): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    isActive: project.isActive,
    assignedMemberCount: '_count' in project ? project._count.members : undefined,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
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
