import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { ReportQueryDto } from '../reports/dto/report-query.dto.js';
import type { PaginatedReports, ReportDetail } from '../reports/reports.types.js';
import { ManagerReportsService } from './manager-reports.service.js';
import { RequestChangesDto } from './dto/request-changes.dto.js';

@Roles(Role.MANAGER)
@Controller('manager/reports')
export class ManagerReportsController {
  constructor(private readonly managerReportsService: ManagerReportsService) {}

  @Get()
  listReports(@Query() query: ReportQueryDto): Promise<PaginatedReports> {
    return this.managerReportsService.listReports(query);
  }

  @Get(':id')
  getReport(@Param('id', ParseUUIDPipe) id: string): Promise<ReportDetail> {
    return this.managerReportsService.getReport(id);
  }

  @Post(':id/request-changes')
  requestChanges(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestChangesDto,
  ): Promise<ReportDetail> {
    return this.managerReportsService.requestChanges(id, user.id, dto);
  }

  @Post(':id/approve')
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReportDetail> {
    return this.managerReportsService.approve(id, user.id);
  }
}
