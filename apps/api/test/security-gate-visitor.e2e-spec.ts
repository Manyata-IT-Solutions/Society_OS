import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Phase 18 — Enterprise Security, Gate & Visitor Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let organizationId: string;
  let communityId: string;
  let unit101Id: string;
  let gate1Id: string;
  let gate2Id: string;
  let vendorId: string;

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

    // Login Admin
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

    const comm =
      (await prisma.community.findFirst({
        where: { organizationId, slug: 'green-valley-township' },
      })) || (await prisma.community.findFirst({ where: { organizationId } }));
    communityId = comm!.id;

    let unit = await prisma.unit.findFirst({ where: { communityId } });
    if (!unit) {
      unit = await prisma.unit.findFirst();
    }
    unit101Id = unit!.id;

    const gates = await prisma.securityGate.findMany({ where: { communityId } });
    gate1Id = gates[0]?.id;
    gate2Id = gates[1]?.id || gates[0]?.id;

    const vendor = await prisma.vendor.findFirst({ where: { organizationId } });
    vendorId = vendor!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  let createdRawToken: string;
  let _createdPassId: string;
  let createdVisitId: string;
  let walkInVisitId: string;
  let walkInApprovalId: string;
  let deniedVisitId: string;
  let deniedApprovalId: string;

  it('1. Resident Pre-Approves Visitor & generates opaque QR pass', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/security/visitors/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        destinationUnitId: unit101Id,
        visitorName: 'David Miller',
        phone: '+12025550333',
        visitType: 'GUEST',
        purpose: 'Dinner Guest',
        expectedFrom: new Date(Date.now() - 60000).toISOString(),
        expectedUntil: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        vehicleExpected: true,
        vehicleNumber: 'KA-04-AB-1234',
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.invitation.invitationNumber).toMatch(/^INV-/);
    expect(data.pass.passNumber).toMatch(/^PASS-/);
    expect(data.rawToken).toMatch(/^SEC-/);

    createdRawToken = data.rawToken;
    _createdPassId = data.pass.id;
  });

  it('2. Gate Rapid Pass Scanner validates QR token & checks in visitor', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/security/access/validate-pass')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        gateId: gate1Id,
        rawToken: createdRawToken,
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.visitNumber).toMatch(/^VIS-/);
    expect(data.status).toBe('ACTIVE');
    expect(data.actualCheckIn).toBeDefined();

    createdVisitId = data.id;

    // Verify ActiveVisit projection
    const active = await prisma.activeVisit.findUnique({ where: { visitId: createdVisitId } });
    expect(active).toBeDefined();
    expect(active?.visitorName).toBe('David Miller');
  });

  it('3. Single-Entry Concurrency Race: Re-scanning already-used pass is blocked', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/security/access/validate-pass')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        gateId: gate2Id,
        rawToken: createdRawToken,
      });

    expect(res.status).toBe(400);
  });

  it('4. Gate Check-Out records departure & removes from ActiveVisit projection', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/security/access/check-out')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        visitId: createdVisitId,
        gateId: gate1Id,
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.status).toBe('CHECKED_OUT');
    expect(data.actualCheckOut).toBeDefined();

    // Verify ActiveVisit projection deleted
    const active = await prisma.activeVisit.findUnique({ where: { visitId: createdVisitId } });
    expect(active).toBeNull();
  });

  it('5. Walk-In Visitor registration creates pending resident approval', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/security/visitors/walk-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        destinationUnitId: unit101Id,
        visitorName: 'Sarah Jenkins',
        phone: '+12025550444',
        visitType: 'GUEST',
        purpose: 'Drop Documents',
        gateId: gate1Id,
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.visit.status).toBe('AWAITING_APPROVAL');
    expect(data.approval.status).toBe('PENDING');

    walkInVisitId = data.visit.id;
    walkInApprovalId = data.approval.id;
  });

  it('6. Resident approves walk-in & Gate executes check-in', async () => {
    const appRes = await request(app.getHttpServer())
      .post('/api/v1/security/approvals/decide')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        approvalId: walkInApprovalId,
        approved: true,
        decisionReason: 'Resident confirmed via intercom',
      });

    expect(appRes.status).toBe(201);
    expect(appRes.body.data.status).toBe('APPROVED');

    // Gate checks in approved walk-in
    const checkInRes = await request(app.getHttpServer())
      .post('/api/v1/security/access/check-in-walk-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        visitId: walkInVisitId,
        gateId: gate1Id,
      });

    expect(checkInRes.status).toBe(201);
    expect(checkInRes.body.data.status).toBe('ACTIVE');
  });

  it('7. Denied Visitor Flow: Resident denies walk-in & check-in is blocked', async () => {
    // 1. Create walk-in
    const walkInRes = await request(app.getHttpServer())
      .post('/api/v1/security/visitors/walk-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        destinationUnitId: unit101Id,
        visitorName: 'Unsolicited Sales Rep',
        phone: '+12025550555',
        visitType: 'OTHER',
        gateId: gate1Id,
      });

    deniedVisitId = walkInRes.body.data.visit.id;
    deniedApprovalId = walkInRes.body.data.approval.id;

    // 2. Deny
    const denyRes = await request(app.getHttpServer())
      .post('/api/v1/security/approvals/decide')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        approvalId: deniedApprovalId,
        approved: false,
        decisionReason: 'Resident does not accept marketing visits',
      });

    expect(denyRes.status).toBe(201);
    expect(denyRes.body.data.status).toBe('DENIED');

    // 3. Attempt check-in -> MUST FAIL
    const blockRes = await request(app.getHttpServer())
      .post('/api/v1/security/access/check-in-walk-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        visitId: deniedVisitId,
        gateId: gate1Id,
      });

    expect(blockRes.status).toBe(400);
  });

  it('8. Revoked Pass: Host revokes pass & scanner rejects entry', async () => {
    // 1. Invite
    const invRes = await request(app.getHttpServer())
      .post('/api/v1/security/visitors/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        destinationUnitId: unit101Id,
        visitorName: 'Cancelled Guest',
        phone: '+12025550666',
        expectedFrom: new Date(Date.now() - 60000).toISOString(),
        expectedUntil: new Date(Date.now() + 3600000).toISOString(),
      });

    const token = invRes.body.data.rawToken;
    const passId = invRes.body.data.pass.id;

    // 2. Revoke
    const revRes = await request(app.getHttpServer())
      .post(`/api/v1/security/visitors/passes/${passId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(revRes.status).toBe(201);
    expect(revRes.body.data.status).toBe('REVOKED');

    // 3. Scan -> MUST FAIL
    const scanRes = await request(app.getHttpServer())
      .post('/api/v1/security/access/validate-pass')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        gateId: gate1Id,
        rawToken: token,
      });

    expect(scanRes.status).toBe(400);
  });

  it('9. Trade Contractor Authorization and Worker Roster registration', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/security/contractors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        vendorId,
        title: 'Waterproofing & Civil Repairs Team',
        authorizedFrom: new Date(Date.now() - 86400000).toISOString(),
        authorizedUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
        allowedGates: 'GATE-SERV-02',
        workerLimit: 5,
        workers: [
          {
            name: 'Vikram Singh',
            workerReference: 'WRK-CIV-01',
            skillTrade: 'Mason',
          },
        ],
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.status).toBe('ACTIVE');
    expect(data.workers.length).toBe(1);
  });

  it('10. Security Watchlist Entry & Supervisor Override Log', async () => {
    // 1. Create Watchlist entry
    const watchRes = await request(app.getHttpServer())
      .post('/api/v1/security/watchlist')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        subjectType: 'VEHICLE',
        subjectIdentifier: 'DL-01-AB-0000',
        severity: 'HIGH',
        action: 'REQUIRE_SUPERVISOR',
        reason: 'Restricted vehicle - multiple parking violations',
      });

    expect(watchRes.status).toBe(201);
    expect(watchRes.body.data.status).toBe('ACTIVE');

    // 2. Supervisor Override
    const ovrRes = await request(app.getHttpServer())
      .post('/api/v1/security/watchlist/override')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        gateId: gate1Id,
        visitorName: 'Escorted Driver',
        reason: 'Emergency drop authorized by facility manager',
        actionTaken: 'SUPERVISOR_ALLOWED_WITH_ESCORT',
      });

    expect(ovrRes.status).toBe(201);
    expect(ovrRes.body.data.actionTaken).toBe('SUPERVISOR_ALLOWED_WITH_ESCORT');
  });

  it('11. Manual Checkout for forgotten departures', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/security/access/manual-checkout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        visitId: walkInVisitId,
        gateId: gate1Id,
        reason: 'Visitor departed through pedestrian turnstile without badge swipe',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('CHECKED_OUT');
  });

  it('12. Security Dashboard KPIs & Live Active Visits retrieval', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/security/dashboard/kpis?communityId=${communityId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalEntriesToday).toBeGreaterThan(0);
    expect(res.body.data.totalExitsToday).toBeGreaterThan(0);
  });
});
