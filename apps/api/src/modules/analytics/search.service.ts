import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { UnifiedSearchDto } from '@community-os/contracts';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(dto: UnifiedSearchDto) {
    const rawQ = dto.query.trim().toLowerCase();
    if (!rawQ) return [];

    const tokens = rawQ.split(/\s+/).filter(Boolean);

    const where: any = {};
    if (dto.communityId) where.communityId = dto.communityId;
    if (dto.resourceTypes && dto.resourceTypes.length > 0) {
      where.resourceType = { in: dto.resourceTypes };
    }

    const docs = await this.prisma.searchDocument.findMany({
      where,
      take: dto.limit || 20,
    });

    const scored = docs
      .map((d) => {
        let score = 0;
        const resId = d.resourceId.toLowerCase();
        const title = d.title.toLowerCase();
        const text = d.searchText.toLowerCase();
        const keywords = d.keywords.map((k) => k.toLowerCase());

        if (resId === rawQ) score += 100;
        else if (resId.includes(rawQ)) score += 50;

        if (title === rawQ) score += 80;
        else if (title.includes(rawQ)) score += 40;

        for (const t of tokens) {
          if (keywords.includes(t)) score += 30;
          if (title.includes(t)) score += 20;
          if (text.includes(t)) score += 10;
        }

        return { ...d, score };
      })
      .filter((d) => d.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored;
  }
}
