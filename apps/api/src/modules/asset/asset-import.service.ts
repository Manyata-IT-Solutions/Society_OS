import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AssetService } from './asset.service.js';
import { AssetCategoryRepository } from './asset-category.repository.js';
import type { Actor, AssetImportJob } from '@community-os/types';

export interface AssetImportRow {
  name: string;
  categoryCode: string;
  assetCode?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  criticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  locationType?: string;
  buildingName?: string;
  unitNumber?: string;
  locationDescription?: string;
  purchaseDate?: string;
  installationDate?: string;
  warrantyEndDate?: string;
  warrantyProvider?: string;
  expectedLifeYears?: number;
}

@Injectable()
export class AssetImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetService: AssetService,
    private readonly categoryRepo: AssetCategoryRepository,
  ) {}

  async parseAndValidateCsv(
    csvContent: string,
    _organizationId: string,
    _communityId: string,
  ): Promise<{ rows: AssetImportRow[]; errors: Array<{ row: number; error: string }> }> {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new BadRequestException('CSV file must have a header row and at least one data row');
    }

    const firstLine = lines[0] || '';
    const headers = firstLine.split(',').map((h) =>
      h
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''),
    );
    const rows: AssetImportRow[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    const nameIdx = headers.indexOf('name');
    const catIdx =
      headers.indexOf('categorycode') !== -1
        ? headers.indexOf('categorycode')
        : headers.indexOf('category');
    if (nameIdx === -1 || catIdx === -1) {
      throw new BadRequestException("CSV must contain 'name' and 'categoryCode' headers");
    }

    const codeIdx = headers.indexOf('assetcode');
    const mfgIdx = headers.indexOf('manufacturer');
    const modelIdx =
      headers.indexOf('modelnumber') !== -1
        ? headers.indexOf('modelnumber')
        : headers.indexOf('model');
    const serialIdx =
      headers.indexOf('serialnumber') !== -1
        ? headers.indexOf('serialnumber')
        : headers.indexOf('serial');
    const critIdx = headers.indexOf('criticality');
    const locTypeIdx = headers.indexOf('locationtype');
    const bldgIdx =
      headers.indexOf('building') !== -1
        ? headers.indexOf('building')
        : headers.indexOf('buildingname');
    const unitIdx =
      headers.indexOf('unit') !== -1 ? headers.indexOf('unit') : headers.indexOf('unitnumber');
    const locDescIdx =
      headers.indexOf('locationdescription') !== -1
        ? headers.indexOf('locationdescription')
        : headers.indexOf('location');
    const purchaseIdx = headers.indexOf('purchasedate');
    const installIdx = headers.indexOf('installationdate');
    const warrantyEndIdx =
      headers.indexOf('warrantyenddate') !== -1
        ? headers.indexOf('warrantyenddate')
        : headers.indexOf('warrantyend');
    const warrantyProvIdx = headers.indexOf('warrantyprovider');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const parts = line.split(',').map((p) => p.trim());
      const name = parts[nameIdx];
      const categoryCode = parts[catIdx];

      if (!name) {
        errors.push({ row: i + 1, error: 'Missing required asset name' });
        continue;
      }
      if (!categoryCode) {
        errors.push({ row: i + 1, error: 'Missing required categoryCode' });
        continue;
      }

      rows.push({
        name,
        categoryCode,
        assetCode: codeIdx !== -1 ? parts[codeIdx] || undefined : undefined,
        manufacturer: mfgIdx !== -1 ? parts[mfgIdx] || undefined : undefined,
        modelNumber: modelIdx !== -1 ? parts[modelIdx] || undefined : undefined,
        serialNumber: serialIdx !== -1 ? parts[serialIdx] || undefined : undefined,
        criticality: (critIdx !== -1 ? parts[critIdx]?.toUpperCase() : 'MEDIUM') as any,
        locationType: locTypeIdx !== -1 ? parts[locTypeIdx]?.toUpperCase() : 'COMMUNITY',
        buildingName: bldgIdx !== -1 ? parts[bldgIdx] || undefined : undefined,
        unitNumber: unitIdx !== -1 ? parts[unitIdx] || undefined : undefined,
        locationDescription: locDescIdx !== -1 ? parts[locDescIdx] || undefined : undefined,
        purchaseDate: purchaseIdx !== -1 ? parts[purchaseIdx] || undefined : undefined,
        installationDate: installIdx !== -1 ? parts[installIdx] || undefined : undefined,
        warrantyEndDate: warrantyEndIdx !== -1 ? parts[warrantyEndIdx] || undefined : undefined,
        warrantyProvider: warrantyProvIdx !== -1 ? parts[warrantyProvIdx] || undefined : undefined,
      });
    }

    return { rows, errors };
  }

  async executeImport(
    fileName: string,
    csvContent: string,
    organizationId: string,
    communityId: string,
    actor: Actor,
  ): Promise<AssetImportJob> {
    const { rows, errors } = await this.parseAndValidateCsv(
      csvContent,
      organizationId,
      communityId,
    );

    const job = await this.prisma.assetImportJob.create({
      data: {
        fileName,
        status: 'PROCESSING',
        totalRows: rows.length + errors.length,
        processedRows: 0,
        successfulRows: 0,
        failedRows: errors.length,
        errorsJson: errors as any,
        organization: { connect: { id: organizationId } },
        community: { connect: { id: communityId } },
        ...(actor.id ? { createdByUser: { connect: { id: actor.id } } } : {}),
      },
    });

    let successCount = 0;
    let failedCount = errors.length;
    const accumulatedErrors = [...errors];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      try {
        const category = await this.categoryRepo.findByCode(
          organizationId,
          communityId,
          row.categoryCode,
        );
        if (!category) {
          throw new Error(`Category code '${row.categoryCode}' not found`);
        }

        let buildingId: string | null = null;
        if (row.buildingName) {
          const b = await this.prisma.building.findFirst({
            where: { communityId, name: { equals: row.buildingName, mode: 'insensitive' } },
          });
          if (b) buildingId = b.id;
        }

        let unitId: string | null = null;
        if (row.unitNumber) {
          const u = await this.prisma.unit.findFirst({
            where: { communityId, unitNumber: { equals: row.unitNumber, mode: 'insensitive' } },
          });
          if (u) unitId = u.id;
        }

        await this.assetService.createAsset(
          {
            organizationId,
            communityId,
            assetCode: row.assetCode,
            name: row.name,
            assetCategoryId: category.id,
            criticality: row.criticality ?? 'MEDIUM',
            locationType: (row.locationType as any) ?? 'COMMUNITY',
            buildingId,
            unitId,
            locationDescription: row.locationDescription,
            manufacturer: row.manufacturer,
            modelNumber: row.modelNumber,
            serialNumber: row.serialNumber,
            purchaseDate: row.purchaseDate ? new Date(row.purchaseDate).toISOString() : null,
            installationDate: row.installationDate
              ? new Date(row.installationDate).toISOString()
              : null,
            warrantyEndDate: row.warrantyEndDate
              ? new Date(row.warrantyEndDate).toISOString()
              : null,
            warrantyProviderName: row.warrantyProvider,
          },
          actor,
        );

        successCount++;
      } catch (err: any) {
        failedCount++;
        accumulatedErrors.push({ row: i + 2, error: err.message || 'Import error' });
      }
    }

    return this.prisma.assetImportJob.update({
      where: { id: job.id },
      data: {
        status: failedCount === 0 ? 'COMPLETED' : 'COMPLETED',
        processedRows: rows.length + errors.length,
        successfulRows: successCount,
        failedRows: failedCount,
        errorsJson: accumulatedErrors as any,
        completedAt: new Date(),
      },
    }) as any;
  }
}
