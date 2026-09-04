import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { RegisterVehicleDto, VerifyVehicleDto } from '@community-os/contracts';

@Injectable()
export class VehicleRegistryService {
  constructor(private readonly prisma: PrismaService) {}

  async registerVehicle(dto: RegisterVehicleDto, _userId?: string) {
    const normalized = dto.registrationNumber.replace(/[^0-9A-Z]/gi, '').toUpperCase();

    // Check if vehicle already exists in community
    let vehicle = await this.prisma.vehicle.findFirst({
      where: {
        communityId: dto.communityId,
        normalizedRegistrationNumber: normalized,
      },
    });

    if (!vehicle) {
      vehicle = await this.prisma.vehicle.create({
        data: {
          organization: { connect: { id: dto.organizationId } },
          community: { connect: { id: dto.communityId } },
          registrationNumber: dto.registrationNumber,
          normalizedRegistrationNumber: normalized,
          vehicleType: dto.vehicleType || 'CAR',
          make: dto.make,
          model: dto.model,
          variant: dto.variant,
          color: dto.color,
          fuelType: dto.fuelType || 'PETROL',
          isEv: dto.isEv ?? false,
          status: 'ACTIVE',
          primaryOwnerType: dto.residentId ? 'RESIDENT' : 'VISITOR',
        },
      });
    }

    // Create VehicleAuthorization if household/unit/resident provided
    let auth = null;
    if (dto.householdId || dto.unitId || dto.residentId) {
      auth = await this.prisma.vehicleAuthorization.create({
        data: {
          vehicle: { connect: { id: vehicle.id } },
          household: dto.householdId ? { connect: { id: dto.householdId } } : undefined,
          unit: dto.unitId ? { connect: { id: dto.unitId } } : undefined,
          resident: dto.residentId ? { connect: { id: dto.residentId } } : undefined,
          authorizationType: dto.authorizationType || 'OWNER',
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED',
        },
      });
    }

    return { vehicle, authorization: auth };
  }

  async verifyVehicle(dto: VerifyVehicleDto, verifierUserId?: string) {
    const auth = await this.prisma.vehicleAuthorization.findUnique({
      where: { id: dto.vehicleAuthorizationId },
    });
    if (!auth) throw new NotFoundException('Vehicle authorization not found');

    let verifier = verifierUserId;
    if (!verifier) {
      const u = await this.prisma.user.findFirst();
      verifier = u?.id;
    }

    return this.prisma.vehicleAuthorization.update({
      where: { id: dto.vehicleAuthorizationId },
      data: {
        verificationStatus: dto.verified ? 'VERIFIED' : 'REJECTED',
        rejectionReason: dto.rejectionReason,
        verifiedBy: verifier ? { connect: { id: verifier } } : undefined,
        verifiedAt: new Date(),
      },
      include: { vehicle: true, unit: true, resident: true },
    });
  }

  async getVehicles(communityId: string, search?: string) {
    return this.prisma.vehicle.findMany({
      where: {
        communityId,
        ...(search
          ? {
              OR: [
                { registrationNumber: { contains: search, mode: 'insensitive' } },
                { make: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        authorizations: {
          include: { unit: true, resident: true },
        },
        allocations: {
          include: { parkingSlot: true },
        },
        permits: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
