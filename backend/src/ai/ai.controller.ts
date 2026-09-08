import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/enums.js';
import { AiService } from './ai.service.js';
import { ReportAssistantDto } from './dto/report-assistant.dto.js';
import { ReportAssistantResponse } from './ai.types.js';

@Roles(Role.TEAM_MEMBER)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('report-assistant')
  @HttpCode(200)
  createReportSuggestion(
    @Body() dto: ReportAssistantDto,
  ): Promise<ReportAssistantResponse> {
    return this.aiService.generateReportSuggestion(dto);
  }
}
