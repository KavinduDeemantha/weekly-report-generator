import { Module } from '@nestjs/common';
import { ManagerReportsController } from './manager-reports.controller.js';
import { ManagerReportsService } from './manager-reports.service.js';

@Module({
  controllers: [ManagerReportsController],
  providers: [ManagerReportsService],
})
export class ManagerReportsModule {}
