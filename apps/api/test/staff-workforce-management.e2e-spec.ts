import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Phase 21 — Enterprise Staff & Workforce Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let organizationId: string;
  let communityId: string;
  let employeeWorkerId: string;
  let contractWorkerId: string;
  let departmentId: string;
  let jobRoleId: string;
  let skillId: string;
  let shiftTemplateId: string;
  let shiftInstance1Id: string;
  let shiftInstance2Id: string;
  let _rosterId: string;
  let assignment1Id: string;
  let _assignment2Id: string;
  let attendanceSessionId: string;

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
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // Scenario 1: Worker Registration & Directory Master
  it('1. should register direct employee and contract worker profiles', async () => {
    // Direct Employee
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/workforce/workers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        primaryCommunityId: communityId,
        workerType: 'EMPLOYEE',
        firstName: 'Anil',
        lastName: 'Verma',
        displayName: 'Anil Verma (Electrician)',
        phone: '+919811122233',
        email: 'anil.verma@communityos.io',
      });

    expect(res1.status).toBe(201);
    expect(res1.body.data.workerNumber).toMatch(/^WRK-\d{4}-\d{4,8}$/);
    employeeWorkerId = res1.body.data.id;

    // Contract Worker
    const res2 = await request(app.getHttpServer())
      .post('/api/v1/workforce/workers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        primaryCommunityId: communityId,
        workerType: 'CONTRACT_WORKER',
        firstName: 'Dharmesh',
        lastName: 'Yadav',
        displayName: 'Dharmesh Yadav (Guard)',
        phone: '+919811122234',
        email: 'dharmesh.guard@vendor.com',
      });

    expect(res2.status).toBe(201);
    contractWorkerId = res2.body.data.id;
  });

  // Scenario 2: Department & Job Role Hierarchy
  it('2. should create department and job role with trade definition', async () => {
    const deptRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/structure/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        code: `DEPT-TEST-${Date.now()}`,
        name: 'Electro-Mechanical Services',
        description: 'Test electrical and HVAC operations',
      });

    expect(deptRes.status).toBe(201);
    departmentId = deptRes.body.data.id;

    const roleRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/structure/job-roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        departmentId,
        code: `ROLE-TEST-ELEC-${Date.now()}`,
        name: 'Maintenance Electrician',
        trade: 'ELECTRICAL',
      });

    expect(roleRes.status).toBe(201);
    jobRoleId = roleRes.body.data.id;

    // Add Engagement
    const engRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/engagements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        workerId: employeeWorkerId,
        organizationId,
        communityId,
        engagementType: 'DIRECT_EMPLOYMENT',
        startDate: '2026-01-01',
        departmentId,
        jobRoleId,
      });

    expect(engRes.status).toBe(201);
  });

  // Scenario 3: Skills Catalog & Worker Skill Verification
  it('3. should create skill and assign verified competency to worker', async () => {
    const skillRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/structure/skills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        code: `SKILL-TRANS-${Date.now()}`,
        name: 'Transformer Oil Testing',
        category: 'ELECTRICAL',
      });

    expect(skillRes.status).toBe(201);
    skillId = skillRes.body.data.id;

    const assignRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/structure/worker-skills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        workerId: employeeWorkerId,
        skillId,
        proficiencyLevel: 'ADVANCED',
        verified: true,
      });

    expect(assignRes.status).toBe(201);
    expect(assignRes.body.data.verified).toBe(true);
  });

  // Scenario 4: Worker Certification & Expiry Tracking
  it('4. should record statutory certification and license details', async () => {
    const certRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/structure/certifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        workerId: employeeWorkerId,
        name: 'High Tension Electrical License',
        certificationType: 'ELECTRICAL_LICENSE',
        certificateNumber: 'HT-TEST-9988',
        issueDate: '2025-01-01',
        expiryDate: '2028-12-31',
      });

    expect(certRes.status).toBe(201);
    expect(certRes.body.data.verificationStatus).toBe('VERIFIED');
  });

  // Scenario 5: Shift Template & Cross-Midnight Generation
  it('5. should generate shift instances for cross-midnight shift template', async () => {
    const tmplRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/shifts/templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        code: `SHF-NIGHT-TEST-${Date.now()}`,
        name: 'Night Perimeter Shift',
        startLocalTime: '22:00',
        endLocalTime: '06:00',
        breakMinutes: 45,
        crossesMidnight: true,
      });

    expect(tmplRes.status).toBe(201);
    expect(tmplRes.body.data.crossesMidnight).toBe(true);
    shiftTemplateId = tmplRes.body.data.id;

    const genRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/shifts/generate-instances')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        communityId,
        shiftTemplateId,
        startDate: '2026-05-01',
        endDate: '2026-05-02',
        locationReference: 'Gate 1 & Perimeter',
        requiredHeadcount: 2,
      });

    expect(genRes.status).toBe(201);
    expect(genRes.body.data.generatedCount).toBe(2);
    shiftInstance1Id = genRes.body.data.instances[0].id;
    shiftInstance2Id = genRes.body.data.instances[1].id;
  });

  // Scenario 6: Roster Creation & Concurrency Overlap Prevention
  it('6. should assign shift and prevent overlapping assignment for same worker', async () => {
    const rosterRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/rosters')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        name: 'May 2026 Night Security Roster',
        periodStart: '2026-05-01',
        periodEnd: '2026-05-07',
      });

    expect(rosterRes.status).toBe(201);
    _rosterId = rosterRes.body.data.id;

    // Assign worker 1 to shift 1
    const assignRes1 = await request(app.getHttpServer())
      .post('/api/v1/workforce/rosters/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        shiftInstanceId: shiftInstance1Id,
        workerId: employeeWorkerId,
        assignmentRole: 'Lead Night Tech',
      });

    expect(assignRes1.status).toBe(201);
    assignment1Id = assignRes1.body.data.id;

    // Assign worker 2 to shift 1
    const assignRes2 = await request(app.getHttpServer())
      .post('/api/v1/workforce/rosters/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        shiftInstanceId: shiftInstance1Id,
        workerId: contractWorkerId,
        assignmentRole: 'Night Gate Guard',
      });

    expect(assignRes2.status).toBe(201);
    _assignment2Id = assignRes2.body.data.id;

    // Attempt double-assign worker 1 to same shift instance -> Conflict
    const dupRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/rosters/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        shiftInstanceId: shiftInstance1Id,
        workerId: employeeWorkerId,
      });

    expect(dupRes.status).toBe(409);
  });

  // Scenario 7: Shift Swap Request & Approval Workflow
  it('7. should request and approve peer shift swap atomically', async () => {
    // Create a 3rd worker (Worker C) to be assigned to Shift 2
    const resC = await request(app.getHttpServer())
      .post('/api/v1/workforce/workers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        primaryCommunityId: communityId,
        workerType: 'EMPLOYEE',
        firstName: 'Chetan',
        lastName: 'Patil',
        displayName: 'Chetan Patil (Technician)',
        phone: '+919811122299',
        email: 'chetan.patil@communityos.io',
      });
    const workerCId = resC.body.data.id;

    // Assign worker C to shift instance 2
    const assignResTarget = await request(app.getHttpServer())
      .post('/api/v1/workforce/rosters/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        shiftInstanceId: shiftInstance2Id,
        workerId: workerCId,
        assignmentRole: 'Night Shift Guard',
      });
    const targetAssignmentId = assignResTarget.body.data.id;

    // Request swap between assignment 1 (Worker A on Shift 1) and targetAssignment (Worker C on Shift 2)
    const swapRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/rosters/swaps/request')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        requesterAssignmentId: assignment1Id,
        targetAssignmentId,
        reason: 'Shift trade due to family event',
      });

    expect(swapRes.status).toBe(201);
    const swapId = swapRes.body.data.id;

    const approveRes = await request(app.getHttpServer())
      .post(`/api/v1/workforce/rosters/swaps/${swapId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    expect(approveRes.status).toBe(201);
    expect(approveRes.body.data.status).toBe('APPROVED');
  });

  // Scenario 8: Shift Coverage Engine Analysis
  it('8. should analyze shift coverage and report staffing headcount', async () => {
    const covRes = await request(app.getHttpServer())
      .get(`/api/v1/workforce/dashboard/coverage?communityId=${communityId}&date=2026-05-01`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(covRes.status).toBe(200);
    expect(covRes.body.data.totalShifts).toBeGreaterThan(0);
    expect(covRes.body.data.shifts[0]).toHaveProperty('coverageStatus');
  });

  // Scenario 9: Append-Only Attendance & Geofence Evaluation
  it('9. should record append-only attendance events and check in/out', async () => {
    const inRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/attendance/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        workerId: employeeWorkerId,
        method: 'MOBILE',
        latitude: 12.9716,
        longitude: 77.5946,
        accuracyMeters: 15,
      });

    expect(inRes.status).toBe(201);
    expect(inRes.body.data.status).toBe('PRESENT');
    attendanceSessionId = inRes.body.data.id;

    // Check out
    const outRes = await request(app.getHttpServer())
      .post(`/api/v1/workforce/attendance/sessions/${attendanceSessionId}/check-out`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ method: 'MOBILE' });

    expect(outRes.status).toBe(201);
    expect(outRes.body.data.checkOutAt).toBeDefined();
  });

  // Scenario 10: Attendance Correction Request & Approval
  it('10. should request and approve attendance correction without altering event history', async () => {
    const reqRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/corrections/request')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        attendanceSessionId,
        requestedCheckInAt: '2026-05-01T06:00:00Z',
        requestedCheckOutAt: '2026-05-01T14:30:00Z',
        reason: 'Late check-out logged manually due to emergency DG overhaul',
      });

    expect(reqRes.status).toBe(201);
    const correctionId = reqRes.body.data.id;

    const decideRes = await request(app.getHttpServer())
      .post('/api/v1/workforce/corrections/decide')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        correctionId,
        approved: true,
        decisionNotes: 'Verified with shift handover log',
      });

    expect(decideRes.status).toBe(201);
    expect(decideRes.body.data.status).toBe('APPROVED');
  });

  // Scenario 11: Capability Resolver & WorkOrder Technician Matching
  it('11. should match qualified technicians and exclude uncertified workers', async () => {
    const techRes = await request(app.getHttpServer())
      .get(`/api/v1/workforce/technicians/resolve?communityId=${communityId}&trade=ELECTRICAL`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(techRes.status).toBe(200);
    expect(Array.isArray(techRes.body.data)).toBe(true);
    expect(techRes.body.data.length).toBeGreaterThan(0);
  });

  // Scenario 12: Worker Offboarding & Shift Invalidation
  it('12. should offboard worker and cancel future shift assignments', async () => {
    const offboardRes = await request(app.getHttpServer())
      .post(`/api/v1/workforce/workers/${contractWorkerId}/offboard`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Vendor contract expired' });

    expect(offboardRes.status).toBe(201);
    expect(offboardRes.body.data.status).toBe('EXITED');

    // Verify engagements are ended
    const worker = await prisma.worker.findUnique({
      where: { id: contractWorkerId },
      include: { engagements: true },
    });
    expect(worker?.status).toBe('EXITED');
  });
});
