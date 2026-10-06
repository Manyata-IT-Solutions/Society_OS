import { Injectable } from '@nestjs/common';
import { ConfigurationResolverService } from '../configuration/configuration-resolver.service.js';
import type { TerminologySettings } from '@community-os/types';

@Injectable()
export class TerminologyService {
  constructor(private readonly configResolver: ConfigurationResolverService) {}

  async getTerminology(context: {
    organizationId?: string | null;
    communityId?: string | null;
  }): Promise<TerminologySettings> {
    const [sectionRes, buildingRes, unitRes] = await Promise.all([
      this.configResolver.resolve<string>('community.display.sectionLabel', {
        organizationId: context.organizationId || undefined,
        communityId: context.communityId || undefined,
      }),
      this.configResolver.resolve<string>('community.display.buildingLabel', {
        organizationId: context.organizationId || undefined,
        communityId: context.communityId || undefined,
      }),
      this.configResolver.resolve<string>('community.display.unitLabel', {
        organizationId: context.organizationId || undefined,
        communityId: context.communityId || undefined,
      }),
    ]);

    return {
      sectionLabel: sectionRes.value || 'Section',
      buildingLabel: buildingRes.value || 'Building',
      unitLabel: unitRes.value || 'Unit',
    };
  }
}
