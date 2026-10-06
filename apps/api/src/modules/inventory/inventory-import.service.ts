import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { InventoryItemService } from './inventory-item.service.js';
import { StockLedgerService } from './stock-ledger.service.js';
import type { Actor } from '@community-os/types';

@Injectable()
export class InventoryImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly itemService: InventoryItemService,
    private readonly stockLedgerService: StockLedgerService,
  ) {}

  async previewCsv(
    organizationId: string,
    csvData: string,
  ): Promise<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    preview: any[];
    errors: any[];
  }> {
    const lines = csvData.trim().split('\n').filter(Boolean);
    if (lines.length < 2 || !lines[0]) {
      throw new BadRequestException('CSV file is empty or missing header');
    }

    const firstLine = lines[0];
    const headers = firstLine.split(',').map((h) => h.trim());
    const preview: any[] = [];
    const errors: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const cols = line.split(',').map((c) => c.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] || '';
      });

      if (!row['name'] || !row['categoryCode'] || !row['uomCode']) {
        errors.push({ row: i, error: 'Missing required columns (name, categoryCode, uomCode)' });
      } else {
        preview.push(row);
      }
    }

    return {
      totalRows: lines.length - 1,
      validRows: preview.length,
      invalidRows: errors.length,
      preview: preview.slice(0, 10),
      errors,
    };
  }

  async executeImport(
    organizationId: string,
    communityId: string | null,
    rows: any[],
    actor: Actor,
  ): Promise<{ successfulRows: number; failedRows: number; errors: any[] }> {
    let successfulRows = 0;
    let failedRows = 0;
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const category = await this.prisma.inventoryCategory.findFirst({
          where: { organizationId, code: row.categoryCode.toUpperCase() },
        });
        if (!category) {
          throw new Error(`Category '${row.categoryCode}' not found`);
        }

        const uom = await this.prisma.unitOfMeasure.findFirst({
          where: { organizationId, code: row.uomCode.toUpperCase() },
        });
        if (!uom) {
          throw new Error(`UOM '${row.uomCode}' not found`);
        }

        await this.itemService.create(
          {
            organizationId,
            communityId,
            name: row.name,
            description: row.description || null,
            categoryId: category.id,
            baseUomId: uom.id,
            itemType: (row.itemType as any) || 'SPARE_PART',
            minStockLevel: row.minStockLevel ? parseFloat(row.minStockLevel) : null,
            reorderLevel: row.reorderLevel ? parseFloat(row.reorderLevel) : null,
          },
          actor,
        );
        successfulRows++;
      } catch (err: any) {
        failedRows++;
        errors.push({ row: i + 1, error: err.message });
      }
    }

    return {
      successfulRows,
      failedRows,
      errors,
    };
  }
}
