import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DeliveryCabService } from './delivery-cab.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('security/deliveries')
@UseGuards(AuthGuard)
export class DeliveryController {
  constructor(private readonly service: DeliveryCabService) {}

  @Get()
  async getDeliveries(@Query('communityId') communityId: string) {
    return this.service.getDeliveries(communityId);
  }
}
