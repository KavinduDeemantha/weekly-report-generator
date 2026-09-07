import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { ReportQueryDto } from './dto/report-query.dto.js';
import { UpdateReportDto } from './dto/update-report.dto.js';
import { PaginatedReports, ReportDetail } from './reports.types.js';
import { ReportsService } from './reports.service.js';

@Roles(Role.TEAM_MEMBER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  createReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReportDto,
  ): Promise<ReportDetail> {
    return this.reportsService.createReport(user.id, dto);
  }

  @Get('me')
  listOwnReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportQueryDto,
  ): Promise<PaginatedReports> {
    return this.reportsService.listOwnReports(user.id, query);
  }

  @Get(':id')
  getReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReportDetail> {
    return this.reportsService.getOwnedReport(id, user.id);
  }

  @Patch(':id')
  updateReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportDto,
  ): Promise<ReportDetail> {
    return this.reportsService.updateDraftReport(id, user.id, dto);
  }

  @Post(':id/submit')
  submitReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReportDetail> {
    return this.reportsService.submitDraftReport(id, user.id);
  }
}
