import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { ReportStatus, TaskStatus } from '../generated/prisma/enums.js';
import {
  createPaginationMeta,
  normalizePagination,
} from '../common/pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { ReportQueryDto } from './dto/report-query.dto.js';
import { UpdateReportDto } from './dto/update-report.dto.js';
import { PaginatedReports, ReportDetail } from './reports.types.js';

const reportSummarySelect = {
  id: true,
  weekStart: true,
  weekEnd: true,
  status: true,
  currentVersion: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

const reportDetailSelect = {
  ...reportSummarySelect,
  userId: true,
  versions: {
    orderBy: { versionNumber: 'desc' },
    take: 1,
    select: {
      id: true,
      versionNumber: true,
      notes: true,
      submittedAt: true,
      tasks: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          priority: true,
          plannedPercentage: true,
          actualPercentage: true,
          status: true,
          plannedHours: true,
          actualHours: true,
          deliverable: true,
        },
      },
      nextWeekTasks: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          description: true,
        },
      },
      blockers: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          description: true,
          isKeyIssue: true,
          isResolved: true,
        },
      },
      achievements: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          description: true,
          isKeyAchievement: true,
        },
      },
      timeEntries: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          type: true,
          hours: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async createReport(
    userId: string,
    dto: CreateReportDto,
  ): Promise<ReportDetail> {
    const weekStart = parseBusinessDate(dto.weekStart, 'weekStart');
    const weekEnd = parseBusinessDate(dto.weekEnd, 'weekEnd');
    validateDateRange(weekStart, weekEnd);
    validateStructuredContent(dto);
    await this.projectsService.ensureActiveProject(dto.projectId);

    try {
      const report = await this.prisma.$transaction(async (tx) => {
        return tx.report.create({
          data: {
            userId,
            projectId: dto.projectId,
            weekStart,
            weekEnd,
            status: ReportStatus.DRAFT,
            currentVersion: 1,
            versions: {
              create: {
                versionNumber: 1,
                notes: normalizeOptionalString(dto.notes),
                tasks: { create: mapTasks(dto.tasks) },
                nextWeekTasks: { create: mapNextWeekTasks(dto.nextWeekTasks) },
                blockers: { create: mapBlockers(dto.blockers) },
                achievements: { create: mapAchievements(dto.achievements) },
                timeEntries: { create: mapTimeEntries(dto.timeEntries) },
              },
            },
          },
          select: reportDetailSelect,
        });
      });

      return mapReportDetail(report);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Report already exists for this week');
      }

      throw error;
    }
  }

  async listOwnReports(
    userId: string,
    query: ReportQueryDto,
  ): Promise<PaginatedReports> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const where: Prisma.ReportWhereInput = {
      userId,
      status: query.status,
      projectId: query.projectId,
    };

    if (query.from || query.to) {
      where.weekStart = {
        gte: query.from ? parseBusinessDate(query.from, 'from') : undefined,
        lte: query.to ? parseBusinessDate(query.to, 'to') : undefined,
      };
    }

    const [reports, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        orderBy: [{ weekStart: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: reportSummarySelect,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async getOwnedReport(id: string, userId: string): Promise<ReportDetail> {
    const report = await this.findReportDetailOrThrow(id);
    ensureOwned(report.userId, userId);

    return mapReportDetail(report);
  }

  async updateDraftReport(
    id: string,
    userId: string,
    dto: UpdateReportDto,
  ): Promise<ReportDetail> {
    validateStructuredContent(dto);

    try {
      const report = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.report.findUnique({
          where: { id },
          select: {
            id: true,
            userId: true,
            status: true,
            weekStart: true,
            weekEnd: true,
            currentVersion: true,
          },
        });

        if (!existing) {
          throw new NotFoundException('Report not found');
        }

        ensureOwned(existing.userId, userId);
        ensureDraftEditable(existing.status);

        const weekStart =
          dto.weekStart !== undefined
            ? parseBusinessDate(dto.weekStart, 'weekStart')
            : existing.weekStart;
        const weekEnd =
          dto.weekEnd !== undefined
            ? parseBusinessDate(dto.weekEnd, 'weekEnd')
            : existing.weekEnd;

        validateDateRange(weekStart, weekEnd);

        if (dto.projectId !== undefined) {
          const project = await tx.project.findUnique({
            where: { id: dto.projectId },
            select: { id: true, isActive: true },
          });

          if (!project || !project.isActive) {
            throw new NotFoundException('Active project not found');
          }
        }

        const currentVersion = await tx.reportVersion.findUnique({
          where: {
            reportId_versionNumber: {
              reportId: existing.id,
              versionNumber: existing.currentVersion,
            },
          },
          select: { id: true },
        });

        if (!currentVersion) {
          throw new NotFoundException('Current report version not found');
        }

        await tx.report.update({
          where: { id },
          data: {
            weekStart,
            weekEnd,
            projectId: dto.projectId,
          },
        });

        await tx.reportVersion.update({
          where: { id: currentVersion.id },
          data:
            dto.notes !== undefined
              ? { notes: normalizeOptionalString(dto.notes) }
              : {},
        });

        await replaceDraftContent(tx, currentVersion.id, dto);

        return tx.report.findUniqueOrThrow({
          where: { id },
          select: reportDetailSelect,
        });
      });

      return mapReportDetail(report);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Report already exists for this week');
      }

      throw error;
    }
  }

  async submitDraftReport(id: string, userId: string): Promise<ReportDetail> {
    const report = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.report.findUnique({
        where: { id },
        select: reportDetailSelect,
      });

      if (!existing) {
        throw new NotFoundException('Report not found');
      }

      ensureOwned(existing.userId, userId);

      if (existing.status !== ReportStatus.DRAFT) {
        throw new BadRequestException('Only draft reports can be submitted');
      }

      validateReportReadyForSubmission(existing);

      const version = existing.versions[0];

      await tx.report.update({
        where: { id },
        data: { status: ReportStatus.SUBMITTED },
      });

      await tx.reportVersion.update({
        where: { id: version.id },
        data: { submittedAt: new Date() },
      });

      return tx.report.findUniqueOrThrow({
        where: { id },
        select: reportDetailSelect,
      });
    });

    return mapReportDetail(report);
  }

  private async findReportDetailOrThrow(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: reportDetailSelect,
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }
}

function parseBusinessDate(value: string, field: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${field} must use YYYY-MM-DD format`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} must be a valid date`);
  }

  return date;
}

function validateDateRange(weekStart: Date, weekEnd: Date): void {
  if (weekEnd.getTime() < weekStart.getTime()) {
    throw new BadRequestException('weekEnd must not be before weekStart');
  }
}

function validateStructuredContent(dto: CreateReportDto | UpdateReportDto): void {
  if ((dto.blockers ?? []).filter((blocker) => blocker.isKeyIssue).length > 1) {
    throw new BadRequestException('Only one blocker can be marked as key issue');
  }

  if (
    (dto.achievements ?? []).filter((achievement) => achievement.isKeyAchievement)
      .length > 1
  ) {
    throw new BadRequestException(
      'Only one achievement can be marked as key achievement',
    );
  }
}

function ensureOwned(ownerId: string, userId: string): void {
  if (ownerId !== userId) {
    throw new ForbiddenException('You cannot access this report');
  }
}

function ensureDraftEditable(status: ReportStatus): void {
  if (status !== ReportStatus.DRAFT) {
    throw new BadRequestException('Only draft reports can be edited');
  }
}

function validateReportReadyForSubmission(
  report: Awaited<ReturnType<ReportsService['findReportDetailOrThrow']>>,
): void {
  const version = report.versions[0];

  if (!version) {
    throw new BadRequestException('Report has no current version');
  }

  validateDateRange(report.weekStart, report.weekEnd);

  if (version.tasks.length === 0) {
    throw new BadRequestException('Report must include at least one task');
  }

  if (!version.tasks.some((task) => task.status === TaskStatus.COMPLETED)) {
    throw new BadRequestException('Report must include at least one completed task');
  }

  if (version.blockers.filter((blocker) => blocker.isKeyIssue).length > 1) {
    throw new BadRequestException('Only one blocker can be marked as key issue');
  }

  if (
    version.achievements.filter((achievement) => achievement.isKeyAchievement)
      .length > 1
  ) {
    throw new BadRequestException(
      'Only one achievement can be marked as key achievement',
    );
  }
}

function normalizeOptionalString(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapTasks(tasks = [] as NonNullable<CreateReportDto['tasks']>) {
  return tasks.map((task) => ({
    name: task.name.trim(),
    priority: task.priority,
    plannedPercentage: task.plannedPercentage,
    actualPercentage: task.actualPercentage,
    status: task.status,
    plannedHours: task.plannedHours,
    actualHours: task.actualHours,
    deliverable: normalizeOptionalString(task.deliverable),
  }));
}

function mapNextWeekTasks(tasks = [] as NonNullable<CreateReportDto['nextWeekTasks']>) {
  return tasks.map((task) => ({
    description: task.description.trim(),
  }));
}

function mapBlockers(blockers = [] as NonNullable<CreateReportDto['blockers']>) {
  return blockers.map((blocker) => ({
    description: blocker.description.trim(),
    isKeyIssue: blocker.isKeyIssue,
    isResolved: blocker.isResolved,
  }));
}

function mapAchievements(
  achievements = [] as NonNullable<CreateReportDto['achievements']>,
) {
  return achievements.map((achievement) => ({
    description: achievement.description.trim(),
    isKeyAchievement: achievement.isKeyAchievement,
  }));
}

function mapTimeEntries(
  timeEntries = [] as NonNullable<CreateReportDto['timeEntries']>,
) {
  return timeEntries.map((entry) => ({
    type: entry.type,
    hours: entry.hours,
  }));
}

async function replaceDraftContent(
  tx: Prisma.TransactionClient,
  reportVersionId: string,
  dto: UpdateReportDto,
): Promise<void> {
  if (dto.tasks !== undefined) {
    await tx.reportTask.deleteMany({ where: { reportVersionId } });
    await tx.reportTask.createMany({
      data: mapTasks(dto.tasks).map((task) => ({ ...task, reportVersionId })),
    });
  }

  if (dto.nextWeekTasks !== undefined) {
    await tx.nextWeekTask.deleteMany({ where: { reportVersionId } });
    await tx.nextWeekTask.createMany({
      data: mapNextWeekTasks(dto.nextWeekTasks).map((task) => ({
        ...task,
        reportVersionId,
      })),
    });
  }

  if (dto.blockers !== undefined) {
    await tx.blocker.deleteMany({ where: { reportVersionId } });
    await tx.blocker.createMany({
      data: mapBlockers(dto.blockers).map((blocker) => ({
        ...blocker,
        reportVersionId,
      })),
    });
  }

  if (dto.achievements !== undefined) {
    await tx.achievement.deleteMany({ where: { reportVersionId } });
    await tx.achievement.createMany({
      data: mapAchievements(dto.achievements).map((achievement) => ({
        ...achievement,
        reportVersionId,
      })),
    });
  }

  if (dto.timeEntries !== undefined) {
    await tx.timeEntry.deleteMany({ where: { reportVersionId } });
    await tx.timeEntry.createMany({
      data: mapTimeEntries(dto.timeEntries).map((entry) => ({
        ...entry,
        reportVersionId,
      })),
    });
  }
}

function mapReportDetail(
  report: Awaited<ReturnType<ReportsService['findReportDetailOrThrow']>>,
): ReportDetail {
  const version = report.versions[0];

  if (!version) {
    throw new NotFoundException('Current report version not found');
  }

  return {
    id: report.id,
    weekStart: report.weekStart,
    weekEnd: report.weekEnd,
    project: report.project,
    status: report.status,
    currentVersion: report.currentVersion,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    version,
  };
}

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
