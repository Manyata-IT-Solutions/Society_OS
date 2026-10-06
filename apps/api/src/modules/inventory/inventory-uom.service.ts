import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InventoryUomRepository } from './inventory-uom.repository.js';
import type { Actor, UnitOfMeasure } from '@community-os/types';

@Injectable()
export class InventoryUomService {
  constructor(private readonly uomRepo: InventoryUomRepository) {}

  async createUom(data: any, actor: Actor) {
    return this.create(data, actor);
  }
  async create(
    data: {
      organizationId: string;
      code: string;
      name: string;
      symbol: string;
      precision?: number;
      isBase?: boolean;
      baseUomId?: string | null;
      conversionFactor?: number;
    },
    _actor: Actor,
  ): Promise<UnitOfMeasure> {
    const existing = await this.uomRepo.findByCode(data.organizationId, data.code.toUpperCase());
    if (existing) {
      throw new ConflictException(`Unit of measure with code '${data.code}' already exists`);
    }

    const created = await this.uomRepo.create({
      organization: { connect: { id: data.organizationId } },
      code: data.code.toUpperCase(),
      name: data.name,
      symbol: data.symbol,
      precision: data.precision ?? 2,
      isBase: data.isBase ?? true,
      conversionFactor: data.conversionFactor ?? 1,
      ...(data.baseUomId ? { baseUom: { connect: { id: data.baseUomId } } } : {}),
    } as any);

    return created as any;
  }

  async findAll(organizationId: string): Promise<UnitOfMeasure[]> {
    const uoms = await this.uomRepo.findAll(organizationId);
    return uoms as any;
  }

  async findById(id: string): Promise<UnitOfMeasure> {
    const uom = await this.uomRepo.findById(id);
    if (!uom) {
      throw new NotFoundException(`Unit of measure '${id}' not found`);
    }
    return uom as any;
  }
}
