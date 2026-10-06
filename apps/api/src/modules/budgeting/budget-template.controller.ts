import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BudgetTemplateService } from './budget-template.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('budget-templates')
@UseGuards(AuthGuard, PermissionGuard)
export class BudgetTemplateController {
  constructor(private readonly templateService: BudgetTemplateService) {}

  @Post()
  @RequirePermission(PERMISSIONS.BUDGET_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    return this.templateService.createTemplate(body);
  }

  @Get()
  @RequirePermission(PERMISSIONS.BUDGET_VIEW)
  async list(@Query('organizationId') organizationId: string) {
    return this.templateService.listTemplates(organizationId);
  }
}
