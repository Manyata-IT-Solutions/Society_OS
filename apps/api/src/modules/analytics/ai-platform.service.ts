import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  AIAssistantQueryDto,
  DocumentQAQueryDto,
  SubmitAIFeedbackDto,
} from '@community-os/contracts';

@Injectable()
export class AIPlatformService {
  constructor(private readonly prisma: PrismaService) {}

  private checkPromptInjection(text: string): void {
    const lower = text.toLowerCase();
    const maliciousPatterns = [
      'ignore all rules',
      'ignore previous instructions',
      'ignore the above',
      'reveal secret',
      'reveal password',
      'drop table',
      'dump database',
      'system prompt',
      'bypass security',
      'admin override',
    ];

    for (const pattern of maliciousPatterns) {
      if (lower.includes(pattern)) {
        throw new BadRequestException(
          `Security policy violation: Prompt injection or instruction override detected ('${pattern}')`,
        );
      }
    }
  }

  async processAssistantQuery(dto: AIAssistantQueryDto, userId = 'system-user') {
    const prompt = dto.prompt.trim();

    // 1. Prompt Injection Sanitization Check
    this.checkPromptInjection(prompt);

    const startTime = Date.now();
    const lower = prompt.toLowerCase();

    // 2. Strict Tenant Scope Filtering
    const tenantFilter: any = {};
    if (dto.communityId) {
      tenantFilter.communityId = dto.communityId;
    }
    if (dto.organizationId) {
      tenantFilter.organizationId = dto.organizationId;
    }

    // 3. Structured Grounded Answering within Tenant Boundary
    let answer = '';
    const sources: any[] = [];

    if (lower.includes('collection') || lower.includes('billing')) {
      const invoices = await this.prisma.invoice.findMany({
        where: tenantFilter,
      });
      const totalBilled = invoices.reduce((acc, inv) => acc + Number(inv.grandTotal), 0);
      const totalPaid = invoices.reduce((acc, inv) => acc + Number(inv.allocatedAmount), 0);
      const eff = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 100;

      answer = `The collection efficiency for the active scope is ${eff.toFixed(2)}%, with ₹${totalPaid.toLocaleString()} collected against ₹${totalBilled.toLocaleString()} billed.`;
      sources.push({
        type: 'METRIC',
        title: 'Collection Efficiency Metric (finance.collection_efficiency)',
        reference: 'MetricDefinition:finance.collection_efficiency',
        scope: dto.communityId ? 'COMMUNITY' : 'ORGANIZATION',
        version: 1,
        freshness: new Date().toISOString(),
      });
    } else if (lower.includes('asset') || lower.includes('lift')) {
      const downCount = await this.prisma.asset.count({
        where: {
          ...tenantFilter,
          operationalStatus: { in: ['OUT_OF_SERVICE', 'UNDER_MAINTENANCE'] },
        },
      });
      answer = `Currently, ${downCount} equipment assets are in maintenance or out of service status in this community.`;
      sources.push({
        type: 'RECORD',
        title: 'Asset Master Registry (Phase 10)',
        reference: 'Asset:status_filter',
        freshness: new Date().toISOString(),
      });
    } else if (lower.includes('compliance') || lower.includes('expire') || lower.includes('noc')) {
      const creds = await this.prisma.complianceCredential.count({
        where: {
          ...tenantFilter,
          status: 'ACTIVE',
        },
      });
      answer = `There are ${creds} active statutory compliance credentials registered in this community scope.`;
      sources.push({
        type: 'RECORD',
        title: 'Statutory Compliance Register (Phase 24)',
        reference: 'ComplianceCredential',
        freshness: new Date().toISOString(),
      });
    } else {
      answer = `Operational summary: Platform systems are operating normally within specified performance targets for the authorized community scope.`;
      sources.push({
        type: 'METRIC',
        title: 'Executive Overview KPI Summary',
        reference: 'ExecutiveCommandCenter',
        freshness: new Date().toISOString(),
      });
    }

    const latencyMs = Date.now() - startTime;

    // 4. Audit Logging
    const audit = await this.prisma.aIInteractionAudit.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        userId,
        useCaseKey: dto.useCaseKey || 'enterprise_assistant',
        provider: 'MOCK',
        modelKey: 'mock-llm-deterministic',
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(answer.length / 4),
        status: 'COMPLETED',
        sourcesPayload: sources,
        latencyMs,
      },
    });

    return {
      interactionId: audit.id,
      answer,
      sources,
      latencyMs,
    };
  }

  async processDocumentQA(dto: DocumentQAQueryDto, userId = 'system-user') {
    const question = dto.question.trim();

    // Check prompt injection
    this.checkPromptInjection(question);

    const answer =
      'Based on the estate parking policy: Visitor vehicles may park in designated bays for up to 4 hours free. Overnight parking requires prior approval via the Resident App.';
    const sources = [
      {
        type: 'DOCUMENT',
        title: 'Estate Visitor Parking Guidelines & Overnight Rules',
        reference: 'POL-PARKING-2026',
        communityId: dto.communityId,
        version: 1,
      },
    ];

    const audit = await this.prisma.aIInteractionAudit.create({
      data: {
        communityId: dto.communityId,
        userId,
        useCaseKey: 'document_qa',
        provider: 'MOCK',
        modelKey: 'mock-llm-deterministic',
        promptTokens: 25,
        completionTokens: 45,
        status: 'COMPLETED',
        sourcesPayload: sources,
        latencyMs: 12,
      },
    });

    return {
      interactionId: audit.id,
      answer,
      sources,
    };
  }

  async submitFeedback(dto: SubmitAIFeedbackDto, userId = 'system-user') {
    return this.prisma.aIResponseFeedback.create({
      data: {
        interactionId: dto.interactionId,
        userId,
        rating: dto.rating,
        feedbackType: dto.feedbackType,
        comments: dto.comments,
      },
    });
  }
}
