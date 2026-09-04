import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Phase 22 — Enterprise Governance & Meetings Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let organizationId: string;
  let communityId: string;
  let resident1Id: string;
  let resident2Id: string;
  let committeeId: string;
  let committeeTermId: string;
  let positionId: string;
  let meetingId: string;
  let _agendaId: string;
  let motionId: string;
  let voteId: string;
  let entitlement1Id: string;
  let entitlement2Id: string;
  let _resolutionId: string;
  let minutesId: string;
  let noticeId: string;
  let policyId: string;
  let policyVersion1Id: string;

  beforeAll(async () => {
    jest.setTimeout(45000);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    prisma = app.get(PrismaService);

    // 1. Login Admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@communityos.io', password: 'Admin@CommunityOS2026!' });

    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.data.tokens.accessToken;

    const org =
      (await prisma.organization.findFirst({
        where: { slug: 'community-os-demo' },
      })) || (await prisma.organization.findFirst());
    organizationId = org!.id;

    const comm = await prisma.community.findFirst({
      where: { organizationId },
    });
    communityId = comm!.id;

    const residents = await prisma.resident.findMany({
      where: { organizationId },
      take: 2,
    });
    resident1Id = residents[0].id;
    resident2Id = residents[1].id;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  // 1. Committee & Terms
  it('1. should create a governance committee and effective-dated term', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/governance/committees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        code: `MC-E2E-${Date.now()}`,
        name: 'E2E Managing Committee',
        committeeType: 'MANAGING',
        effectiveFrom: '2026-01-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    committeeId = res.body.data.id;

    const termRes = await request(app.getHttpServer())
      .post('/api/v1/governance/committees/terms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        committeeId,
        termNumber: 'TERM-2026-2029',
        startDate: '2026-01-01',
        endDate: '2028-12-31',
        electionReference: 'ELEC-E2E-001',
      });

    expect(termRes.status).toBe(201);
    committeeTermId = termRes.body.data.id;
  });

  // 2. Positions & Member Assignment
  it('2. should create position and assign resident member (IAM decoupled)', async () => {
    const posRes = await request(app.getHttpServer())
      .post('/api/v1/governance/committees/positions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        code: `POS-TREAS-${Date.now()}`,
        name: 'Treasurer',
        isExecutive: true,
      });

    expect(posRes.status).toBe(201);
    positionId = posRes.body.data.id;

    const memRes = await request(app.getHttpServer())
      .post('/api/v1/governance/committees/memberships')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        committeeTermId,
        positionId,
        personReferenceType: 'RESIDENT',
        residentId: resident1Id,
        startDate: '2026-01-01',
        appointmentMethod: 'ELECTED',
      });

    expect(memRes.status).toBe(201);
    expect(memRes.body.data.status).toBe('ACTIVE');
  });

  // 3. Meeting Scheduling & Notice
  it('3. should schedule an AGM meeting and publish official notice', async () => {
    const meetRes = await request(app.getHttpServer())
      .post('/api/v1/governance/meetings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        meetingType: 'AGM',
        committeeId,
        committeeTermId,
        title: '2026 Annual General Meeting',
        scheduledStartAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
        scheduledEndAt: new Date(
          Date.now() + 14 * 24 * 3600 * 1000 + 3 * 3600 * 1000,
        ).toISOString(),
        timezone: 'Asia/Kolkata',
        venueType: 'HYBRID',
        venueReference: 'Clubhouse Main Hall',
      });

    expect(meetRes.status).toBe(201);
    meetingId = meetRes.body.data.id;

    const noticeRes = await request(app.getHttpServer())
      .post('/api/v1/governance/meetings/notices/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meetingId,
        minimumNoticeDays: 14,
        instructions: 'Carry your digital unit pass for voting eligibility.',
      });

    expect(noticeRes.status).toBe(201);
    expect(noticeRes.body.data.status).toBe('PUBLISHED');
  });

  // 4. Agenda Versioning
  it('4. should create and publish version 1 meeting agenda with discussion items', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/governance/agendas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meetingId,
        title: 'AGM 2026 Official Agenda',
        items: [
          {
            itemNumber: '1.0',
            title: 'Confirmation of Quorum & Chairman Welcome',
            itemType: 'INFORMATION',
            estimatedDurationMinutes: 15,
          },
          {
            itemNumber: '2.0',
            title: 'Adoption of FY 2025-26 Audited Financial Accounts',
            itemType: 'DECISION',
            decisionRequired: true,
            votingExpected: true,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.versionNumber).toBe(1);
    expect(res.body.data.items.length).toBe(2);
    _agendaId = res.body.data.id;
  });

  // 5. Attendance & Quorum Evaluation
  it('5. should record attendance check-in and evaluate quorum snapshot', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/governance/attendance/eligibility-snapshot/${meetingId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const attRes = await request(app.getHttpServer())
      .post('/api/v1/governance/attendance/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meetingId,
        participantType: 'RESIDENT',
        residentId: resident1Id,
        attendanceStatus: 'PRESENT',
      });

    expect(attRes.status).toBe(201);

    const qRes = await request(app.getHttpServer())
      .post('/api/v1/governance/attendance/quorum/evaluate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meetingId,
        requiredHeadcount: 1,
      });

    expect(qRes.status).toBe(201);
    expect(qRes.body.data.status).toBe('MET');
    expect(qRes.body.data.presentCount).toBeGreaterThanOrEqual(1);
  });

  // 6. Proxy Authorization
  it('6. should submit and record proxy authorization', async () => {
    const proxyRes = await request(app.getHttpServer())
      .post('/api/v1/governance/attendance/proxies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        meetingId,
        principalResidentId: resident2Id,
        proxyResidentId: resident1Id,
        validityDate: '2026-04-30',
        scope: 'Full voting power for AGM 2026',
      });

    expect(proxyRes.status).toBe(201);
    expect(proxyRes.body.data.status).toBe('VERIFIED');
  });

  // 7. Motion & Amendment
  it('7. should propose a formal motion and record immutable amendment', async () => {
    const motRes = await request(app.getHttpServer())
      .post('/api/v1/governance/motions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meetingId,
        title: 'Solar Rooftop Project Budget',
        text: 'Approve ₹10,00,000 for clubhouse rooftop solar.',
        proposedByMemberId: resident1Id,
        voteRequired: true,
      });

    expect(motRes.status).toBe(201);
    motionId = motRes.body.data.id;

    const amendRes = await request(app.getHttpServer())
      .post('/api/v1/governance/motions/amend')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        motionId,
        proposedChange: 'Increase budget to ₹12,50,000 with net metering',
        newMotionText:
          'Approve ₹12,50,000 for clubhouse rooftop solar with 5-year AMC and net metering.',
        proposedByMemberId: resident1Id,
      });

    expect(amendRes.status).toBe(201);
    expect(amendRes.body.data.status).toBe('AMENDED');
    expect(amendRes.body.data.text).toContain('₹12,50,000');
  });

  // 8. Formal Voting & Entitlements
  it('8. should create formal voting session and issue single-use entitlements', async () => {
    const voteRes = await request(app.getHttpServer())
      .post('/api/v1/governance/votes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meetingId,
        motionId,
        title: 'Solar Rooftop Project Approval Vote',
        voteType: 'FORMAL_MOTION',
        thresholdType: 'SIMPLE_MAJORITY',
        thresholdPercentage: 50.0,
      });

    expect(voteRes.status).toBe(201);
    voteId = voteRes.body.data.id;

    const ent1 = await request(app.getHttpServer())
      .post(`/api/v1/governance/votes/${voteId}/entitlements`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ residentId: resident1Id, weight: 1.0 });

    const ent2 = await request(app.getHttpServer())
      .post(`/api/v1/governance/votes/${voteId}/entitlements`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ residentId: resident2Id, weight: 1.0 });

    expect(ent1.status).toBe(201);
    expect(ent2.status).toBe(201);
    entitlement1Id = ent1.body.data.id;
    entitlement2Id = ent2.body.data.id;
  });

  // 9. Cast Vote & Double-Vote Concurrency Prevention
  it('9. should cast digital vote and prevent double-vote consumption', async () => {
    const castRes = await request(app.getHttpServer())
      .post('/api/v1/governance/votes/cast')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        voteId,
        entitlementId: entitlement1Id,
        selectedOption: 'YES',
      });

    expect(castRes.status).toBe(201);
    expect(castRes.body.data.selectedOption).toBe('YES');

    // Duplicate submission with same entitlement must fail with HTTP 409
    const dupRes = await request(app.getHttpServer())
      .post('/api/v1/governance/votes/cast')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        voteId,
        entitlementId: entitlement1Id,
        selectedOption: 'NO',
      });

    expect(dupRes.status).toBe(409);
  });

  // 10. Deterministic Vote Counting
  it('10. should count vote ballots deterministically and publish result', async () => {
    // Cast second vote
    await request(app.getHttpServer())
      .post('/api/v1/governance/votes/cast')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        voteId,
        entitlementId: entitlement2Id,
        selectedOption: 'YES',
      });

    const countRes = await request(app.getHttpServer())
      .post(`/api/v1/governance/votes/${voteId}/count`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(countRes.status).toBe(201);
    expect(countRes.body.data.status).toBe('RESULT_PUBLISHED');
    expect(countRes.body.data.resultStatus).toBe('PASSED');
    expect(countRes.body.data.resultSummary.yesWeight).toBe(2);
  });

  // 11. Resolution Adoption
  it('11. should adopt formal governance resolution with downstream reference', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/governance/resolutions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        communityId,
        meetingId,
        motionId,
        voteId,
        title: 'Adoption of Clubhouse Rooftop Solar Installation Contract',
        resolutionText: 'Resolved that the solar installation proposal for ₹12,50,000 is approved.',
        classification: 'CAPEX',
        linkedDomainType: 'CAPEX_PROJECT',
        linkedDomainId: '11111111-2222-3333-4444-555555555555',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.resolutionNumber).toContain('RES-');
    expect(res.body.data.status).toBe('ADOPTED');
    _resolutionId = res.body.data.id;
  });

  // 12. Structured Meeting Minutes
  it('12. should generate structured meeting minutes draft and approve publication', async () => {
    const draftRes = await request(app.getHttpServer())
      .post('/api/v1/governance/minutes/generate-draft')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meetingId,
        summary: 'Official Minutes of 2026 Annual General Body Meeting',
      });

    expect(draftRes.status).toBe(201);
    expect(draftRes.body.data.status).toBe('UNDER_REVIEW');
    minutesId = draftRes.body.data.id;

    const appRes = await request(app.getHttpServer())
      .post('/api/v1/governance/minutes/approve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        minutesId,
      });

    expect(appRes.status).toBe(201);
    expect(appRes.body.data.status).toBe('PUBLISHED');
  });

  // 13. Notice Publication & Acknowledgement
  it('13. should publish official estate notice and record read receipt vs acknowledgement', async () => {
    const notRes = await request(app.getHttpServer())
      .post('/api/v1/governance/notices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        noticeType: 'MAINTENANCE',
        title: 'Elevator Modernization Shutdown',
        body: 'Passenger elevator A will be offline on Tuesday from 10 AM to 4 PM.',
        requiresAcknowledgement: true,
      });

    expect(notRes.status).toBe(201);
    noticeId = notRes.body.data.id;

    // Read receipt
    const readRes = await request(app.getHttpServer())
      .post(`/api/v1/governance/notices/${noticeId}/read`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ residentId: resident1Id });

    expect(readRes.status).toBe(201);
    expect(readRes.body.data.firstReadAt).toBeDefined();

    // Explicit acknowledgement
    const ackRes = await request(app.getHttpServer())
      .post('/api/v1/governance/notices/acknowledge')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        noticeId,
        residentId: resident1Id,
        method: 'IN_APP',
      });

    expect(ackRes.status).toBe(201);
    expect(ackRes.body.data.status).toBe('ACKNOWLEDGED');
  });

  // 14. Policy Versioning & Resolver
  it('14. should create versioned policy, revise to v2, and query effective version', async () => {
    const polRes = await request(app.getHttpServer())
      .post('/api/v1/governance/policies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        title: 'Pet Care & Leash Policy',
        category: 'PET',
        content: 'Version 1: Pets must be leashed in common garden areas.',
        effectiveFrom: '2026-01-01',
      });

    expect(polRes.status).toBe(201);
    expect(polRes.body.data.policyNumber).toContain('POL-');
    policyId = polRes.body.data.id;
    policyVersion1Id = polRes.body.data.versions[0].id;

    // Acknowledge v1
    const ackRes = await request(app.getHttpServer())
      .post('/api/v1/governance/policies/acknowledge')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        policyVersionId: policyVersion1Id,
        residentId: resident1Id,
      });

    expect(ackRes.status).toBe(201);

    // Revise to v2
    const revRes = await request(app.getHttpServer())
      .post('/api/v1/governance/policies/revise')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        policyId,
        content: 'Version 2: Pets must be leashed in all areas and vaccinated annually.',
        effectiveFrom: '2026-06-01',
        changeSummary: 'Added annual vaccination requirement.',
      });

    expect(revRes.status).toBe(201);
    expect(revRes.body.data.versionNumber).toBe(2);

    // Query effective policy as of March 2026 (returns v1)
    const effRes1 = await request(app.getHttpServer())
      .get(`/api/v1/governance/policies/${policyId}/effective?asOfDate=2026-03-15`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(effRes1.status).toBe(200);
    expect(effRes1.body.data.versionNumber).toBe(1);

    // Query effective policy as of July 2026 (returns v2)
    const effRes2 = await request(app.getHttpServer())
      .get(`/api/v1/governance/policies/${policyId}/effective?asOfDate=2026-07-01`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(effRes2.status).toBe(200);
    expect(effRes2.body.data.versionNumber).toBe(2);
  });
});
