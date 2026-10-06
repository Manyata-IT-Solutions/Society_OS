import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  ActivateIncidentCommandDto,
  TransferIncidentCommandDto,
  AssignIncidentResponderDto,
} from '@community-os/contracts';

@Injectable()
export class IncidentCommandService {
  constructor(private readonly prisma: PrismaService) {}

  async activateCommand(dto: ActivateIncidentCommandDto, actorId?: string) {
    const incident = await this.prisma.safetyIncident.findUnique({
      where: { id: dto.incidentId },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    const cmd = await this.prisma.incidentCommand.upsert({
      where: { incidentId: dto.incidentId },
      update: {
        commandLevel: dto.commandLevel || 'COMMUNITY',
        incidentCommanderId: dto.incidentCommanderId,
        deputyId: dto.deputyId,
        commandPostLocation: dto.commandPostLocation,
        status: 'ACTIVE',
      },
      create: {
        incidentId: dto.incidentId,
        commandLevel: dto.commandLevel || 'COMMUNITY',
        incidentCommanderId: dto.incidentCommanderId,
        deputyId: dto.deputyId,
        commandPostLocation: dto.commandPostLocation,
        status: 'ACTIVE',
      },
      include: { commander: true },
    });

    await this.prisma.safetyIncident.update({
      where: { id: dto.incidentId },
      data: { status: 'ACTIVE' },
    });

    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId: dto.incidentId,
        entryType: 'COMMAND_ACTIVATED',
        title: `Incident Command activated (Commander: ${cmd.commander.firstName} ${cmd.commander.lastName})`,
        description: `Command Post: ${dto.commandPostLocation || 'Mobile Command'}`,
        actorId,
      },
    });

    return cmd;
  }

  async transferCommand(dto: TransferIncidentCommandDto, actorId?: string) {
    const cmd = await this.prisma.incidentCommand.findUnique({
      where: { incidentId: dto.incidentId },
    });
    if (!cmd) throw new NotFoundException('Active incident command not found');

    const oldCommanderId = cmd.incidentCommanderId;

    // Record transfer log
    await this.prisma.incidentCommandTransfer.create({
      data: {
        incidentId: dto.incidentId,
        fromCommanderId: oldCommanderId,
        toCommanderId: dto.newCommanderId,
        reason: dto.reason,
      },
    });

    const updated = await this.prisma.incidentCommand.update({
      where: { incidentId: dto.incidentId },
      data: {
        incidentCommanderId: dto.newCommanderId,
        version: cmd.version + 1,
      },
      include: { commander: true },
    });

    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId: dto.incidentId,
        entryType: 'NOTE',
        title: `Command handed over to ${updated.commander.firstName} ${updated.commander.lastName}`,
        description: dto.reason,
        actorId,
      },
    });

    return updated;
  }

  async assignResponder(dto: AssignIncidentResponderDto, actorId?: string) {
    const responder = await this.prisma.incidentResponderAssignment.create({
      data: {
        incidentId: dto.incidentId,
        workerId: dto.workerId,
        teamName: dto.teamName,
        role: dto.role,
        status: 'ASSIGNED',
      },
      include: { worker: true },
    });

    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId: dto.incidentId,
        entryType: 'RESPONDER_ASSIGNED',
        title: `Responder assigned: ${responder.worker.firstName} ${responder.worker.lastName} (${dto.role})`,
        description: `Team: ${dto.teamName}`,
        actorId,
      },
    });

    return responder;
  }
}
