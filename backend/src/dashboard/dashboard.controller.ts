import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/enums.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardQueryDto } from './dto/dashboard-query.dto.js';

@Roles(Role.MANAGER)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getSummary(query);
  }

  @Get('submission-status')
  getSubmissionStatus(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getSubmissionStatus(query);
  }

  @Get('task-trends')
  getTaskTrends(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getTaskTrends(query);
  }

  @Get('project-distribution')
  getProjectDistribution(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getProjectDistribution(query);
  }

  @Get('time-distribution')
  getTimeDistribution(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getTimeDistribution(query);
  }

  @Get('activity')
  getActivity(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getActivity(query);
  }
}
