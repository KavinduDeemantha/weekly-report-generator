import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/enums.js';
import { AiService } from './ai.service.js';
import { ManagerChatDto } from './dto/manager-chat.dto.js';
import { ReportAssistantDto } from './dto/report-assistant.dto.js';
import { ManagerChatResponse, ReportAssistantResponse } from './ai.types.js';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('report-assistant')
  @Roles(Role.TEAM_MEMBER)
  @HttpCode(200)
  createReportSuggestion(
    @Body() dto: ReportAssistantDto,
  ): Promise<ReportAssistantResponse> {
    return this.aiService.generateReportSuggestion(dto);
  }

  @Post('manager-chat')
  @Roles(Role.MANAGER)
  @HttpCode(200)
  createManagerChatAnswer(
    @Body() dto: ManagerChatDto,
  ): Promise<ManagerChatResponse> {
    return this.aiService.answerManagerChat(dto);
  }
}
