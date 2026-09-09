import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import {
  ReportStatus,
  ReviewAction,
  Role,
  TaskStatus,
  TimeEntryType,
} from '../generated/prisma/enums.js';
import { parseBusinessDate } from '../reports/reports.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DashboardQueryDto } from './dto/dashboard-query.dto.js';
import {
  DashboardActivityItem,
  DashboardSummary,
  ProjectDistributionItem,
  SubmissionStatusItem,
  TaskTrendItem,
  TimeDistributionItem,
} from './dashboard.types.js';

const compliantStatuses: ReportStatus[] = [
  ReportStatus.SUBMITTED,
  ReportStatus.NEEDS_CORRECTION,
  ReportStatus.APPROVED,
];

const dashboardReportSelect = {
  id: true,
  weekStart: true,
  status: true,
  currentVersion: true,
  user: {
    select: {
      id: true,
      name: true,
    },
  },
  project: {
    select: {
      id: true,
      name: true,
    },
  },
  versions: {
    orderBy: { versionNumber: 'desc' },
    take: 1,
    select: {
      id: true,
      versionNumber: true,
      submittedAt: true,
      tasks: {
        select: {
          status: true,
        },
      },
      blockers: {
        select: {
          isResolved: true,
        },
      },
      timeEntries: {
        select: {
          type: true,
          hours: true,
        },
      },
    },
  },
} as const;

type DashboardReport = Prisma.ReportGetPayload<{
  select: typeof dashboardReportSelect;
}>;

type DateScope = {
  weekStart?: Date;
  from?: Date;
  to?: Date;
};

type DateScopeOptions = {
  defaultToCurrentWeek?: boolean;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(query: DashboardQueryDto): Promise<DashboardSummary> {
    const scope = createDateScope(query, { defaultToCurrentWeek: true });
    const memberWhere = createMemberWhere(query);
    const reportWhere = createReportWhere(query, scope);

    const [members, reports, scopedReports] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: memberWhere,
        select: { id: true },
      }),
      this.prisma.report.findMany({
        where: {
          ...reportWhere,
          user: memberWhere,
        },
        select: {
          userId: true,
          status: true,
        },
      }),
      this.prisma.report.findMany({
        where: {
          ...reportWhere,
          user: memberWhere,
        },
        select: dashboardReportSelect,
      }),
    ]);

    const submittedReports = reports.filter((report) =>
      compliantStatuses.includes(report.status),
    );
    const compliantUserIds = new Set(
      submittedReports.map((report) => report.userId),
    );
    const pendingCount = members.length - compliantUserIds.size;
    const needsCorrectionCount = reports.filter(
      (report) => report.status === ReportStatus.NEEDS_CORRECTION,
    ).length;
    const openBlockersCount = scopedReports.reduce(
      (total, report) =>
        total +
        getCurrentDashboardVersion(report).blockers.filter(
          (blocker) => !blocker.isResolved,
        ).length,
      0,
    );

    return {
      totalReportsSubmitted: submittedReports.length,
      submissionComplianceRate:
        members.length === 0
          ? 0
          : roundPercentage((compliantUserIds.size / members.length) * 100),
      pendingCount,
      needsCorrectionCount,
      openBlockersCount,
    };
  }

  async getSubmissionStatus(
    query: DashboardQueryDto,
  ): Promise<SubmissionStatusItem[]> {
    const scope = createDateScope(query, { defaultToCurrentWeek: true });
    const memberWhere = createMemberWhere(query);
    const reportWhere = createReportWhere(query, scope);

    const [members, reports] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: memberWhere,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
      this.prisma.report.findMany({
        where: {
          ...reportWhere,
          user: memberWhere,
        },
        orderBy: [{ weekStart: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          userId: true,
          status: true,
          weekStart: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const reportsByUserId = new Map<
      string,
      (typeof reports)[number]
    >();

    for (const report of reports) {
      if (!reportsByUserId.has(report.userId)) {
        reportsByUserId.set(report.userId, report);
      }
    }

    return members.map((member) => {
      const report = reportsByUserId.get(member.id);

      return {
        user: member,
        status: report?.status ?? 'NOT_STARTED',
        report: report
          ? {
              id: report.id,
              weekStart: report.weekStart,
              project: report.project,
            }
          : null,
      };
    });
  }

  async getTaskTrends(query: DashboardQueryDto): Promise<TaskTrendItem[]> {
    const reports = await this.getScopedDashboardReports(query);
    const buckets = new Map<string, number>();

    for (const report of reports) {
      const weekStart = toDateInput(report.weekStart);
      const completedTasks = getCurrentDashboardVersion(report).tasks.filter(
        (task) => task.status === TaskStatus.COMPLETED,
      ).length;

      buckets.set(weekStart, (buckets.get(weekStart) ?? 0) + completedTasks);
    }

    return Array.from(buckets.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([weekStart, completedTasks]) => ({
        weekStart,
        completedTasks,
      }));
  }

  async getProjectDistribution(
    query: DashboardQueryDto,
  ): Promise<ProjectDistributionItem[]> {
    const reports = await this.getScopedDashboardReports(query);
    const distribution = new Map<string, ProjectDistributionItem>();

    for (const report of reports) {
      const existing = distribution.get(report.project.id) ?? {
        projectId: report.project.id,
        projectName: report.project.name,
        taskCount: 0,
      };

      existing.taskCount += getCurrentDashboardVersion(report).tasks.length;
      distribution.set(report.project.id, existing);
    }

    return Array.from(distribution.values()).sort((left, right) =>
      left.projectName.localeCompare(right.projectName),
    );
  }

  async getTimeDistribution(
    query: DashboardQueryDto,
  ): Promise<TimeDistributionItem[]> {
    const reports = await this.getScopedDashboardReports(query);
    const distribution = new Map<TimeEntryType, number>();

    for (const report of reports) {
      for (const entry of getCurrentDashboardVersion(report).timeEntries) {
        distribution.set(entry.type, (distribution.get(entry.type) ?? 0) + entry.hours);
      }
    }

    return Array.from(distribution.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([type, hours]) => ({
        type,
        hours,
      }));
  }

  async getActivity(query: DashboardQueryDto): Promise<DashboardActivityItem[]> {
    const limit = Math.min(Math.max(1, query.limit), 100);
    const reportWhere = createReportWhere(query);
    const versionWhere: Prisma.ReportVersionWhereInput = {
      submittedAt: { not: null },
      report: reportWhere,
    };
    const reviewWhere: Prisma.ReviewWhereInput = {
      report: reportWhere,
    };

    const [versions, reviews] = await this.prisma.$transaction([
      this.prisma.reportVersion.findMany({
        where: versionWhere,
        orderBy: { submittedAt: 'desc' },
        take: limit,
        select: {
          versionNumber: true,
          submittedAt: true,
          report: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.review.findMany({
        where: reviewWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          action: true,
          createdAt: true,
          reportVersion: {
            select: {
              versionNumber: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
          report: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const submissionEvents: DashboardActivityItem[] = versions.map((version) => {
      const type =
        version.versionNumber > 1 ? 'REPORT_RESUBMITTED' : 'REPORT_SUBMITTED';

      return {
        type,
        reportId: version.report.id,
        versionNumber: version.versionNumber,
        user: version.report.user,
        project: version.report.project,
        createdAt: version.submittedAt ?? new Date(0),
        message:
          type === 'REPORT_RESUBMITTED'
            ? `${version.report.user.name} resubmitted a report for ${version.report.project.name}`
            : `${version.report.user.name} submitted a report for ${version.report.project.name}`,
      };
    });

    const reviewEvents: DashboardActivityItem[] = reviews.map((review) => {
      const type =
        review.action === ReviewAction.APPROVED
          ? 'REPORT_APPROVED'
          : 'CHANGES_REQUESTED';

      return {
        type,
        reportId: review.report.id,
        versionNumber: review.reportVersion.versionNumber,
        user: review.report.user,
        reviewer: review.reviewer,
        project: review.report.project,
        createdAt: review.createdAt,
        message:
          type === 'REPORT_APPROVED'
            ? `${review.report.user.name}'s report was approved`
            : `Changes were requested for ${review.report.user.name}'s report`,
      };
    });

    return [...submissionEvents, ...reviewEvents]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit);
  }

  private async getScopedDashboardReports(
    query: DashboardQueryDto,
  ): Promise<DashboardReport[]> {
    return this.prisma.report.findMany({
      where: createReportWhere(query),
      orderBy: [{ weekStart: 'asc' }, { createdAt: 'asc' }],
      select: dashboardReportSelect,
    });
  }
}

function createMemberWhere(query: DashboardQueryDto): Prisma.UserWhereInput {
  return {
    id: query.userId,
    role: Role.TEAM_MEMBER,
    isActive: true,
  };
}

function createReportWhere(
  query: DashboardQueryDto,
  scope = createDateScope(query),
): Prisma.ReportWhereInput {
  const where: Prisma.ReportWhereInput = {
    userId: query.userId,
    projectId: query.projectId,
  };

  if (scope.weekStart) {
    where.weekStart = scope.weekStart;
  } else if (scope.from || scope.to) {
    where.weekStart = {
      gte: scope.from,
      lte: scope.to,
    };
  }

  return where;
}

function createDateScope(
  query: DashboardQueryDto,
  options: DateScopeOptions = {},
): DateScope {
  const weekInput = query.weekStart ?? query.week;

  if (weekInput && (query.from || query.to)) {
    throw new BadRequestException('Use either weekStart/week or from/to filters');
  }

  if (weekInput) {
    return {
      weekStart: parseBusinessDate(weekInput, 'weekStart'),
    };
  }

  if (!query.from && !query.to && options.defaultToCurrentWeek) {
    return {
      weekStart: getCurrentUtcWeekStart(),
    };
  }

  return {
    from: query.from ? parseBusinessDate(query.from, 'from') : undefined,
    to: query.to ? parseBusinessDate(query.to, 'to') : undefined,
  };
}

function getCurrentUtcWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysSinceMonday,
    ),
  );
}

function getCurrentDashboardVersion(report: DashboardReport) {
  const version = report.versions[0];

  if (!version || version.versionNumber !== report.currentVersion) {
    throw new BadRequestException('Current report version not found');
  }

  return version;
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function roundPercentage(value: number): number {
  return Math.round(value * 100) / 100;
}
