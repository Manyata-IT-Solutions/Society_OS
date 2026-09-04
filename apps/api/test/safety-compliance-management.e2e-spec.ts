import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Phase 24 — Enterprise Emergency, Safety, Risk & Compliance Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let organizationId: string;
  let communityId: string;
  let demoUnitId: string;
  let demoWorkerId: string;
  let demoWorker2Id: string;
  let sosId: string;
  let incidentId: string;
  let evacPlanId: string;
  let _evacOrderId: string;
  let musterSessionId: string;
  let capaId: string;
  let requirementId: string;
  let credentialId: string;

  beforeAll(async () => {
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

    const unit =
      (await prisma.unit.findFirst({
        where: { building: { section: { communityId } } },
      })) || (await prisma.unit.findFirst());
    demoUnitId = unit!.id;

    let workers = await prisma.worker.findMany({
      where: { organizationId },
      take: 2,
    });

    if (workers.length < 2) {
      const w1 = await prisma.worker.create({
        data: {
          organizationId,
          communityId,
          firstName: 'Vikram',
          lastName: 'Sharma',
          email: `vikram.${Date.now()}@communityos.io`,
          workerType: 'EMPLOYEE',
          status: 'ACTIVE',
        },
      });
      const w2 = await prisma.worker.create({
        data: {
          organizationId,
          communityId,
          firstName: 'Anil',
          lastName: 'Verma',
          email: `anil.${Date.now()}@communityos.io`,
          workerType: 'EMPLOYEE',
          status: 'ACTIVE',
        },
      });
      workers = [w1, w2];
    }

    demoWorkerId = workers[0].id;
    demoWorker2Id = workers[1].id;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  // 1. Emergency SOS Alert
  it('1. should raise an emergency SOS panic alert', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/safety/sos/raise')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        sosType: 'MEDICAL',
        initiatorType: 'RESIDENT',
        initiatorId: 'res-user-101',
        unitId: demoUnitId,
        locationDetails: 'Tower A Unit 101 Living Room',
        message: 'Elderly resident experiencing severe chest pain.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.sos.id).toBeDefined();
    expect(res.body.data.isDuplicate).toBe(false);
    sosId = res.body.data.sos.id;
  });

  // 2. Duplicate SOS Retry Protection
  it('2. should return existing SOS idempotently on rapid retry', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/safety/sos/raise')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        sosType: 'MEDICAL',
        initiatorType: 'RESIDENT',
        initiatorId: 'res-user-101',
        unitId: demoUnitId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isDuplicate).toBe(true);
    expect(res.body.data.sos.id).toBe(sosId);
  });

  // 3. Acknowledge SOS & Promote to Incident
  it('3. should acknowledge SOS and promote to an active safety incident', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/safety/sos/acknowledge')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sosId,
        createIncident: true,
        incidentType: 'MEDICAL',
        severity: 'SEV_1_CRITICAL',
        resolutionNotes: 'Ambulance dispatched; first aid responder mobilized.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('INCIDENT_CREATED');
    expect(res.body.data.incidentId).toBeDefined();
    incidentId = res.body.data.incidentId;
  });

  // 4. Activate Command & Assign Responder
  it('4. should activate incident command and assign emergency responders', async () => {
    const cmdRes = await request(app.getHttpServer())
      .post('/api/v1/safety/command/activate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        incidentId,
        incidentCommanderId: demoWorkerId,
        commandLevel: 'BUILDING',
        commandPostLocation: 'Tower A Ground Floor Security Desk',
      });

    expect(cmdRes.status).toBe(201);
    expect(cmdRes.body.data.status).toBe('ACTIVE');

    const respRes = await request(app.getHttpServer())
      .post('/api/v1/safety/command/responders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        incidentId,
        workerId: demoWorkerId,
        teamName: 'First Aid Trauma Response Team',
        role: 'Primary Paramedic',
      });

    expect(respRes.status).toBe(201);
    expect(respRes.body.data.status).toBe('ASSIGNED');
  });

  // 5. Transfer Incident Command
  it('5. should transfer incident command preserving chain of custody', async () => {
    const transferRes = await request(app.getHttpServer())
      .post('/api/v1/safety/command/transfer')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        incidentId,
        newCommanderId: demoWorker2Id,
        reason: 'Shift handover to Night Emergency Incident Commander.',
      });

    expect(transferRes.status).toBe(201);
    expect(transferRes.body.data.incidentCommanderId).toBe(demoWorker2Id);
  });

  // 6. Emergency Actions
  it('6. should create and complete emergency containment actions', async () => {
    const actionRes = await request(app.getHttpServer())
      .post('/api/v1/safety/actions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        incidentId,
        title: 'Grant emergency gate clearance for incoming ambulance',
        priority: 'URGENT',
      });

    expect(actionRes.status).toBe(201);
    const actId = actionRes.body.data.id;

    const completeRes = await request(app.getHttpServer())
      .post('/api/v1/safety/actions/complete')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        actionId: actId,
        completionNotes: 'Gate 1 opened; security escort guided ambulance to Tower A porch.',
      });

    expect(completeRes.status).toBe(201);
    expect(completeRes.body.data.status).toBe('COMPLETED');
  });

  // 7. Evacuation Plan & Order
  it('7. should create evacuation plan and issue evacuation order with muster snapshot', async () => {
    const planRes = await request(app.getHttpServer())
      .post('/api/v1/safety/evacuation/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        communityId,
        name: 'Tower A Emergency Evacuation Plan',
        scope: 'TOWER_A',
        zones: [{ name: 'Tower A Floors 1 to 5', instructions: 'Evacuate via North Staircase' }],
        musterPoints: [
          { name: 'Muster Point Alpha', locationDescription: 'North Open Garden', capacity: 500 },
        ],
      });

    expect(planRes.status).toBe(201);
    evacPlanId = planRes.body.data.id;

    const orderRes = await request(app.getHttpServer())
      .post('/api/v1/safety/evacuation/order')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        incidentId,
        evacuationPlanId: evacPlanId,
        scope: 'Tower A Floors 1 to 5',
        reason: 'Precautionary evacuation due to localized smoke emission.',
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.order.status).toBe('ORDERED');
    expect(orderRes.body.data.session.id).toBeDefined();
    _evacOrderId = orderRes.body.data.order.id;
    musterSessionId = orderRes.body.data.session.id;
  });

  // 8. Resident Self-Safe Confirmation
  it('8. should allow resident to self-confirm safe status during evacuation', async () => {
    const selfRes = await request(app.getHttpServer())
      .post('/api/v1/safety/muster/self-safe')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        incidentId,
        unitId: demoUnitId,
        residentId: 'resident-self-001',
        accountabilityStatus: 'SAFE_AT_MUSTER',
      });

    expect(selfRes.status).toBe(201);
    expect(selfRes.body.data.success).toBe(true);
    expect(selfRes.body.data.entry.accountabilityStatus).toBe('SAFE_AT_MUSTER');
  });

  // 9. Muster Accountability Summary
  it('9. should confirm muster status and compute accountability metrics', async () => {
    const confirmRes = await request(app.getHttpServer())
      .post('/api/v1/safety/muster/confirm')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sessionId: musterSessionId,
        subjectType: 'RESIDENT',
        subjectId: demoUnitId,
        accountabilityStatus: 'SAFE_AT_MUSTER',
      });

    expect(confirmRes.status).toBe(201);

    const summaryRes = await request(app.getHttpServer())
      .get(`/api/v1/safety/muster/summary/${musterSessionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.totalTracked).toBeGreaterThan(0);
    expect(summaryRes.body.data.confirmedSafe).toBeGreaterThan(0);
  });

  // 10. Investigation & 5-Whys Root Cause
  it('10. should record incident investigation with 5-Whys methodology', async () => {
    const invRes = await request(app.getHttpServer())
      .post('/api/v1/safety/investigations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        incidentId,
        leadInvestigatorId: demoWorkerId,
        methodology: '5_WHYS',
        immediateCause: 'Smoke sensor activated due to overheated cable terminal.',
        rootCause: 'Torque specification was not verified during quarterly panel maintenance.',
        contributingFactors: ['High ambient temperature', 'Dust build-up'],
        recommendations: 'Mandate calibrated torque-wrench checks across all riser shafts.',
      });

    expect(invRes.status).toBe(201);
    expect(invRes.body.data.rootCause).toContain('Torque specification');
    expect(invRes.body.data.status).toBe('COMPLETED');
  });

  // 11. Safety CAPA & Independent Verification
  it('11. should create and independently verify a safety corrective action', async () => {
    const capaRes = await request(app.getHttpServer())
      .post('/api/v1/safety/capa')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceType: 'INCIDENT',
        sourceId: incidentId,
        title: 'Thermal Imaging Inspection of all Electrical Risers',
        description: 'Perform IR scan of all power cables and terminal blocks in Tower A.',
        dueDate: '2026-05-15',
        priority: 'HIGH',
      });

    expect(capaRes.status).toBe(201);
    capaId = capaRes.body.data.id;

    const verifyRes = await request(app.getHttpServer())
      .post('/api/v1/safety/capa/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        actionId: capaId,
        verificationOutcome: 'VERIFIED',
        verificationNotes:
          'Certified electrical safety auditor confirmed all terminations inspected with zero hot-spots.',
      });

    expect(verifyRes.status).toBe(201);
    expect(verifyRes.body.data.status).toBe('VERIFIED');
  });

  // 12. Safety Hazard & 5x5 Risk Assessment
  it('12. should report safety hazard and compute 5x5 risk matrix scores', async () => {
    const hazRes = await request(app.getHttpServer())
      .post('/api/v1/safety/hazards-risks/hazards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        title: 'Loose railing on Tower B rooftop terrace',
        description: 'Corner railing section is shaky after recent thunderstorm.',
        category: 'STRUCTURAL',
        severity: 'MAJOR',
      });

    expect(hazRes.status).toBe(201);
    expect(hazRes.body.data.hazardNumber).toBeDefined();

    const riskRes = await request(app.getHttpServer())
      .post('/api/v1/safety/hazards-risks/risks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        title: 'Transformer Oil Leakage & Fire Risk',
        description: 'Potential oil seepage from 11kV step-down transformer yard.',
        category: 'FIRE',
        likelihood: 'POSSIBLE', // 3
        impact: 'MAJOR', // 4
        residualLikelihood: 'UNLIKELY', // 2
        residualImpact: 'MODERATE', // 3
      });

    expect(riskRes.status).toBe(201);
    // Inherent score = 3 * 4 = 12
    expect(Number(riskRes.body.data.inherentRiskScore)).toBe(12);
    // Residual score = 2 * 3 = 6
    expect(Number(riskRes.body.data.residualRiskScore)).toBe(6);
  });

  // 13. Safety Inspection & Critical Finding
  it('13. should conduct safety inspection and generate corrective action from finding', async () => {
    const inspRes = await request(app.getHttpServer())
      .post('/api/v1/safety/inspections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        communityId,
        inspectionType: 'FIRE_SAFETY',
        scope: 'Tower A Basements and Pump House',
        scheduledAt: '2026-04-20',
        itemsPayload: [],
      });

    expect(inspRes.status).toBe(201);
    const inspId = inspRes.body.data.id;

    const findRes = await request(app.getHttpServer())
      .post('/api/v1/safety/inspections/findings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        inspectionId: inspId,
        itemDescription: 'Fire Extinguisher Ext-B1-04 Pressure Low',
        severity: 'CRITICAL',
        description: 'Extinguisher pressure needle is in red discharge zone.',
        createCorrectiveAction: true,
      });

    expect(findRes.status).toBe(201);
    expect(findRes.body.data.correctiveActionId).toBeDefined();
  });

  // 14. Safety Drill in Simulation Mode
  it('14. should plan and complete safety drill in simulation mode', async () => {
    const planDrillRes = await request(app.getHttpServer())
      .post('/api/v1/safety/drills/plan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        communityId,
        drillType: 'FIRE',
        title: 'Tower A Bi-annual Fire & Smoke Drill',
        scenario: 'Simulated electrical fire in 3rd floor corridor with alarm sounding.',
        plannedDate: '2026-05-01',
        objectives: 'Test security response time and resident staircase evacuation speed.',
      });

    expect(planDrillRes.status).toBe(201);
    const drlId = planDrillRes.body.data.id;

    const compDrillRes = await request(app.getHttpServer())
      .post('/api/v1/safety/drills/complete')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        drillId: drlId,
        evacuationDurationMinutes: 7.2,
        musterCompletionPct: 96.5,
        evaluationNotes: 'Excellent performance; all 5 floors evacuated safely in 7.2 minutes.',
      });

    expect(compDrillRes.status).toBe(201);
    expect(compDrillRes.body.data.status).toBe('COMPLETED');
    expect(Number(compDrillRes.body.data.evacuationDurationMinutes)).toBe(7.2);
  });

  // 15. Compliance Requirement & Credential Registration
  it('15. should register compliance requirement, obligation, and statutory credential', async () => {
    const reqRes = await request(app.getHttpServer())
      .post('/api/v1/safety/compliance/requirements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        code: `COMP-LIFT-LIC-${Date.now()}`,
        title: 'Passenger Lift Statutory Operating License',
        category: 'LIFT',
        authorityName: 'Department of Electrical Inspectorate',
      });

    expect(reqRes.status).toBe(201);
    requirementId = reqRes.body.data.id;

    const oblRes = await request(app.getHttpServer())
      .post('/api/v1/safety/compliance/obligations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        requirementId,
        title: 'Annual Lift Safety Inspection & License Renewal',
        dueDate: '2027-02-28',
      });

    expect(oblRes.status).toBe(201);

    const credRes = await request(app.getHttpServer())
      .post('/api/v1/safety/credentials')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        requirementId,
        credentialType: 'LICENSE',
        credentialNumber: `LIC-LIFT-${Date.now()}`,
        title: 'Annual Passenger Elevator Operating License',
        issuingAuthority: 'State Electrical Inspectorate',
        validFrom: '2026-03-01',
        expiryDate: '2027-02-28',
      });

    expect(credRes.status).toBe(201);
    expect(credRes.body.data.status).toBe('ACTIVE');
    credentialId = credRes.body.data.id;
  });

  // 16. Credential Renewal with Historical Preservation
  it('16. should renew compliance credential superseding old record cleanly', async () => {
    const renewRes = await request(app.getHttpServer())
      .post('/api/v1/safety/credentials/renew')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        oldCredentialId: credentialId,
        newCredentialNumber: `LIC-LIFT-RENEWED-${Date.now()}`,
        validFrom: '2027-03-01',
        expiryDate: '2028-02-28',
      });

    expect(renewRes.status).toBe(201);
    expect(renewRes.body.data.status).toBe('ACTIVE');

    // Verify old credential is now SUPERSEDED
    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/safety/credentials?communityId=${communityId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const old = listRes.body.data.find((c: any) => c.id === credentialId);
    expect(old.status).toBe('SUPERSEDED');
  });
});
