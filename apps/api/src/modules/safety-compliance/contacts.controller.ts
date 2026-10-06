import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { EmergencyContactService } from './emergency-contact.service.js';

@Controller('safety/contacts')
@UseGuards(AuthGuard)
export class EmergencyContactsController {
  constructor(private readonly contactService: EmergencyContactService) {}

  @Get()
  async listContacts(@Query('communityId') communityId: string) {
    return this.contactService.listContacts(communityId);
  }
}
