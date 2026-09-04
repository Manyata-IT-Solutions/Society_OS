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
import { PaymentTermsService } from './payment-terms.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('ap/payment-terms')
@UseGuards(AuthGuard)
export class PaymentTermsController {
  constructor(private readonly termsService: PaymentTermsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    return this.termsService.create(body);
  }

  @Get()
  async list(@Query('organizationId') organizationId: string) {
    return this.termsService.list(organizationId);
  }
}
