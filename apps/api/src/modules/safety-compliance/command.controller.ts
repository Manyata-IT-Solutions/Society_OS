import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { IncidentCommandService } from './incident-command.service.js';
import {
  ActivateIncidentCommandDto,
  TransferIncidentCommandDto,
  AssignIncidentResponderDto,
} from '@community-os/contracts';

@Controller('safety/command')
@UseGuards(AuthGuard)
export class IncidentCommandController {
  constructor(private readonly commandService: IncidentCommandService) {}

  @Post('activate')
  async activateCommand(@Body() dto: ActivateIncidentCommandDto, @Req() req: any) {
    return this.commandService.activateCommand(dto, req?.user?.id);
  }

  @Post('transfer')
  async transferCommand(@Body() dto: TransferIncidentCommandDto, @Req() req: any) {
    return this.commandService.transferCommand(dto, req?.user?.id);
  }

  @Post('responders')
  async assignResponder(@Body() dto: AssignIncidentResponderDto, @Req() req: any) {
    return this.commandService.assignResponder(dto, req?.user?.id);
  }
}
