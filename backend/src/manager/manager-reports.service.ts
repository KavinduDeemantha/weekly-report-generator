import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { ReportStatus, ReviewAction } from '../generated/prisma/enums.js';
import {
  createPaginationMeta,
  normalizePagination,
} from '../common/pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReportQueryDto } from '../reports/dto/report-query.dto.js';
import {
  mapReportDetail,
  reportDetailSelect,
  reportSummarySelect,
} from '../reports/reports.service.js';
import type {
  PaginatedReports,
  ReportDetail,
  ReportVersionSummary,
} from '../reports/reports.types.js';
import { parseBusinessDate } from '../reports/reports.service.js';

@Injectable()
export class ManagerReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async listReports(query: ReportQueryDto): Promise<PaginatedReports> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const where = createManagerReportWhere(query);

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

  async getReport(id: string): Promise<ReportDetail> {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: reportDetailSelect,
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return {
      ...mapReportDetail(report),
      versionSummaries: await this.listVersionSummaries(id, report.currentVersion),
    };
  }

  async requestChanges(
    id: string,
    reviewerId: string,
    dto: { comment: string },
  ): Promise<ReportDetail> {
    const report = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.report.findUnique({
        where: { id },
        select: reportDetailSelect,
      });

      if (!existing) {
        throw new NotFoundException('Report not found');
      }

      if (existing.status !== ReportStatus.SUBMITTED) {
        throw new BadRequestException(
          'Only submitted reports can receive change requests',
        );
      }

      const currentVersion = existing.versions[0];

      if (!currentVersion || currentVersion.versionNumber !== existing.currentVersion) {
        throw new NotFoundException('Current report version not found');
      }

      await tx.review.create({
        data: {
          reportId: existing.id,
          reportVersionId: currentVersion.id,
          reviewerId,
          action: ReviewAction.REQUEST_CHANGES,
          comment: dto.comment,
        },
      });

      const updateResult = await tx.report.updateMany({
        where: { id, status: ReportStatus.SUBMITTED },
        data: { status: ReportStatus.NEEDS_CORRECTION },
      });

      if (updateResult.count !== 1) {
        throw new BadRequestException(
          'Only submitted reports can receive change requests',
        );
      }

      return tx.report.findUniqueOrThrow({
        where: { id },
        select: reportDetailSelect,
      });
    });

    return mapReportDetail(report);
  }

  async approve(id: string, reviewerId: string): Promise<ReportDetail> {
    const report = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.report.findUnique({
        where: { id },
        select: reportDetailSelect,
      });

      if (!existing) {
        throw new NotFoundException('Report not found');
      }

      if (existing.status !== ReportStatus.SUBMITTED) {
        throw new BadRequestException('Only submitted reports can be approved');
      }

      const currentVersion = existing.versions[0];

      if (!currentVersion || currentVersion.versionNumber !== existing.currentVersion) {
        throw new NotFoundException('Current report version not found');
      }

      await tx.review.create({
        data: {
          reportId: existing.id,
          reportVersionId: currentVersion.id,
          reviewerId,
          action: ReviewAction.APPROVED,
        },
      });

      const updateResult = await tx.report.updateMany({
        where: { id, status: ReportStatus.SUBMITTED },
        data: { status: ReportStatus.APPROVED },
      });

      if (updateResult.count !== 1) {
        throw new BadRequestException('Only submitted reports can be approved');
      }

      return tx.report.findUniqueOrThrow({
        where: { id },
        select: reportDetailSelect,
      });
    });

    return mapReportDetail(report);
  }

  private async listVersionSummaries(
    reportId: string,
    currentVersion: number,
  ): Promise<ReportVersionSummary[]> {
    const versions = await this.prisma.reportVersion.findMany({
      where: { reportId },
      orderBy: { versionNumber: 'asc' },
      select: {
        versionNumber: true,
        createdAt: true,
        submittedAt: true,
      },
    });

    return versions.map((version) => ({
      ...version,
      isCurrent: version.versionNumber === currentVersion,
    }));
  }
}

function createManagerReportWhere(query: ReportQueryDto): Prisma.ReportWhereInput {
  const weekInput = query.weekStart ?? query.week;
  const statuses = parseStatusIn(query.statusIn);
  const where: Prisma.ReportWhereInput = {
    status: statuses ? { in: statuses } : query.status,
    userId: query.userId,
    projectId: query.projectId,
  };

  if (weekInput) {
    where.weekStart = parseBusinessDate(weekInput, 'weekStart');
  } else if (query.from || query.to) {
    where.weekStart = {
      gte: query.from ? parseBusinessDate(query.from, 'from') : undefined,
      lte: query.to ? parseBusinessDate(query.to, 'to') : undefined,
    };
  }

  return where;
}

function parseStatusIn(value: string | undefined): ReportStatus[] | undefined {
  if (!value) {
    return undefined;
  }

  const statuses = value.split(',').map((status) => status.trim()).filter(Boolean);
  const validStatuses = new Set(Object.values(ReportStatus));

  if (statuses.length === 0) {
    return undefined;
  }

  for (const status of statuses) {
    if (!validStatuses.has(status as ReportStatus)) {
      throw new BadRequestException('Invalid statusIn filter');
    }
  }

  return statuses as ReportStatus[];
}
