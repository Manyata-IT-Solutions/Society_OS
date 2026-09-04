import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface AccessDecisionResult {
  decision: 'ALLOW' | 'DENY' | 'REQUIRE_HOST_APPROVAL' | 'REQUIRE_SUPERVISOR_OVERRIDE' | 'BLOCKED';
  reason?: string;
  passId?: string;
  visitId?: string;
  visitorId?: string;
  hostResidentId?: string;
  destinationUnitId?: string;
}

@Injectable()
export class SecurityAccessDecisionService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluatePassAccess(gateId: string, credentialHash: string): Promise<AccessDecisionResult> {
    const gate = await this.prisma.securityGate.findUnique({ where: { id: gateId } });
    if (!gate) return { decision: 'DENY', reason: 'Invalid security gate' };
    if (gate.status !== 'ACTIVE')
      return { decision: 'DENY', reason: `Gate is currently ${gate.status}` };

    const pass = await this.prisma.accessPass.findUnique({
      where: { credentialHash },
      include: {
        invitation: { include: { hostResident: true, destinationUnit: true } },
        visit: { include: { visitor: true } },
      },
    });

    if (!pass) return { decision: 'DENY', reason: 'Invalid or unrecognized access pass' };
    if (pass.status === 'REVOKED')
      return { decision: 'DENY', reason: 'Pass has been revoked by host/security' };
    if (pass.status === 'EXPIRED') return { decision: 'DENY', reason: 'Pass has expired' };

    const now = new Date();
    if (now < pass.validFrom || now > pass.validUntil) {
      return {
        decision: 'DENY',
        reason: `Pass valid only between ${pass.validFrom.toISOString()} and ${pass.validUntil.toISOString()}`,
      };
    }

    if (pass.entryLimit > 0 && pass.entriesUsed >= pass.entryLimit) {
      return { decision: 'DENY', reason: 'Maximum allowable entries used for this pass' };
    }

    // Watchlist check on phone or name if available
    const phone = pass.invitation?.phone || pass.visit?.visitor?.phone;
    if (phone) {
      const match = await this.prisma.watchlistEntry.findFirst({
        where: {
          communityId: pass.communityId,
          status: 'ACTIVE',
          normalizedKey: phone.replace(/[^0-9A-Z]/gi, ''),
        },
      });
      if (match) {
        if (match.action === 'DENY')
          return { decision: 'BLOCKED', reason: `Subject blacklisted: ${match.reason}` };
        if (match.action === 'REQUIRE_SUPERVISOR')
          return {
            decision: 'REQUIRE_SUPERVISOR_OVERRIDE',
            reason: `Watchlist flag: ${match.reason}`,
          };
      }
    }

    return {
      decision: 'ALLOW',
      passId: pass.id,
      visitId: pass.visitId || undefined,
      visitorId: pass.visit?.visitorId || undefined,
      hostResidentId: pass.invitation?.hostResidentId || pass.visit?.hostResidentId || undefined,
      destinationUnitId:
        pass.invitation?.destinationUnitId || pass.visit?.destinationUnitId || undefined,
    };
  }
}
