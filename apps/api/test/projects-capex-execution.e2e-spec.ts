import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Phase 17 — Enterprise Projects & CAPEX Execution (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let organizationId: string;
  let _communityId: string;
  let capexInitiativeId: string;
  let vendorId: string;
  let fundId: string;
  let costCenterId: string;

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

    const org = await prisma.organization.findFirst();
    organizationId = org!.id;

    const comm = await prisma.community.findFirst({ where: { organizationId } });
    _communityId = comm!.id;

    const capex = await prisma.capexInitiative.findFirst({ where: { organizationId } });
    capexInitiativeId = capex!.id;

    const vendor = await prisma.vendor.findFirst({ where: { organizationId } });
    vendorId = vendor!.id;

    const fund = await prisma.fund.findFirst();
    fundId = fund!.id;

    const cc = await prisma.costCenter.findFirst();
    costCenterId = cc!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  let createdProjectId: string;
  let createdBoqId: string;
  let boqLine1Id: string;
  let createdPackageId: string;
  let createdMeasurementId: string;
  let createdCertificateId: string;
  let createdSnagId: string;

  it('1. Convert approved CapexInitiative to Project Master', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/projects/convert-capex/${capexInitiativeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.projectNumber).toMatch(/^PRJ-/);
    expect(data.capexInitiativeId).toBe(capexInitiativeId);
    expect(data.status).toBe('DRAFT');
    expect(data.scopes.length).toBeGreaterThan(0);
    expect(data.financialSummary).toBeDefined();

    createdProjectId = data.id;
  });

  it('2. Create Bill of Quantities (BOQ) with MEP & Civil line items', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/boq')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: createdProjectId,
        name: 'Tender BOQ Revision 0',
        currency: 'INR',
        lines: [
          {
            lineNumber: 1,
            sectionCode: 'MEP-ELEV',
            itemCode: 'ELEV-PMSM-01',
            description: 'Permanent Magnet Synchronous Machine (PMSM)',
            specification: 'Dual disk brake 13 passenger machine',
            quantity: 10,
            uomName: 'SET',
            estimatedRate: 200000,
            costCategory: 'EQUIPMENT',
            fundId,
            costCenterId,
          },
          {
            lineNumber: 2,
            sectionCode: 'CIVIL-SHAFT',
            itemCode: 'CIV-BED-01',
            description: 'RCC Machine Bed Casting & Vibration Isolation Pads',
            specification: 'M25 grade concrete with neoprene pads',
            quantity: 10,
            uomName: 'SET',
            estimatedRate: 50000,
            costCategory: 'CIVIL',
            fundId,
            costCenterId,
          },
        ],
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.boqNumber).toMatch(/^BOQ-/);
    expect(data.lines.length).toBe(2);
    expect(Number(data.subtotal)).toBe(2500000); // 10*200k + 10*50k

    createdBoqId = data.id;
    boqLine1Id = data.lines[0].id;
  });

  it('3. Approve BOQ and verify baseline lock', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/boq/${createdBoqId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.status).toBe('APPROVED');
    expect(data.approvedAt).toBeDefined();
  });

  it('4. Revise BOQ: Creates new revision and marks old revision as SUPERSEDED', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/boq/revise')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        boqId: createdBoqId,
        revisionReason: 'Expanded scope for 2 additional freight elevators',
        lines: [
          {
            lineNumber: 1,
            sectionCode: 'MEP-ELEV',
            itemCode: 'ELEV-PMSM-01',
            description: 'Permanent Magnet Synchronous Machine (PMSM)',
            quantity: 12, // Increased from 10 to 12
            uomName: 'SET',
            estimatedRate: 200000,
          },
        ],
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.revisionNumber).toBe(2);
    expect(data.isCurrentRevision).toBe(true);

    // Verify old revision is superseded
    const oldBoq = await prisma.billOfQuantities.findUnique({ where: { id: createdBoqId } });
    expect(oldBoq?.isCurrentRevision).toBe(false);
    expect(oldBoq?.status).toBe('SUPERSEDED');
  });

  it('5. Create Work Package and assign Contractor', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/work-packages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: createdProjectId,
        name: 'Package 1 — Elevator Mechanical Overhaul',
        scope: 'Supply and erection of elevator traction machines',
        estimatedAmount: 2400000,
        vendorId,
        contractValue: 2400000,
        retentionPercent: 5.0,
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.packageNumber).toMatch(/^PKG-/);
    expect(Number(data.contractValue)).toBe(2400000);

    createdPackageId = data.id;
  });

  it('6. Submit Site Measurement in Measurement Book', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/measurements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: createdProjectId,
        workPackageId: createdPackageId,
        boqLineId: boqLine1Id,
        measuredQuantity: 4,
        uomName: 'SET',
        location: 'Tower A Motor Room',
        measurementDetails: 'Positioned 4 PMSM motors on machine bed.',
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.measurementNumber).toMatch(/^MB-/);
    expect(data.status).toBe('SUBMITTED');
    expect(Number(data.measuredQuantity)).toBe(4);

    createdMeasurementId = data.id;
  });

  it('7. Quantity Ceiling: Block measurement exceeding allowed BOQ quantity', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/measurements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: createdProjectId,
        workPackageId: createdPackageId,
        boqLineId: boqLine1Id,
        measuredQuantity: 100, // Exceeds BOQ limit of 10
        uomName: 'SET',
        location: 'Tower A Motor Room',
      });

    expect(res.status).toBe(400);
  });

  it('8. Verify Measurement by Site Engineer', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/measurements/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        measurementId: createdMeasurementId,
        approved: true,
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.status).toBe('VERIFIED');
    expect(data.verifiedAt).toBeDefined();

    // Verify BOQ line measured quantity updated
    const line = await prisma.boqLine.findUnique({ where: { id: boqLine1Id } });
    expect(Number(line?.measuredQuantity)).toBe(4);
  });

  it('9. Create Interim Payment Certificate (RA Bill) with 5% retention deduction', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/progress-certificates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: createdProjectId,
        vendorId,
        workPackageId: createdPackageId,
        periodStart: '2026-05-01',
        periodEnd: '2026-05-31',
        lines: [
          {
            boqLineId: boqLine1Id,
            certifiedQuantity: 4,
          },
        ],
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.certificateNumber).toMatch(/^IPC-/);
    expect(data.status).toBe('SUBMITTED');
    expect(Number(data.grossCertifiedAmount)).toBe(800000); // 4 * 200k
    expect(Number(data.retentionAmount)).toBe(40000); // 5% of 800k
    expect(Number(data.netCertifiedAmount)).toBe(760000); // 800k - 40k

    createdCertificateId = data.id;
  });

  it('10. Over-Certification Lock: Block certificate exceeding verified measurements', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/progress-certificates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: createdProjectId,
        vendorId,
        workPackageId: createdPackageId,
        periodStart: '2026-05-01',
        periodEnd: '2026-05-31',
        lines: [
          {
            boqLineId: boqLine1Id,
            certifiedQuantity: 10, // Exceeds verified measured qty of 4
          },
        ],
      });

    expect(res.status).toBe(400);
  });

  it('11. Approve Certificate & update Retention Register and Financial Summary', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/progress-certificates/${createdCertificateId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.status).toBe('APPROVED');

    // Verify Retention register entry
    const retention = await prisma.projectRetention.findFirst({
      where: { projectId: createdProjectId, vendorId },
    });
    expect(retention).toBeDefined();
    expect(Number(retention?.totalWithheld)).toBe(40000);

    // Verify Financial Summary updated
    const fin = await prisma.projectFinancialSummary.findUnique({
      where: { projectId: createdProjectId },
    });
    expect(Number(fin?.grossCertified)).toBe(800000);
    expect(Number(fin?.retentionWithheld)).toBe(40000);
    expect(Number(fin?.netCertified)).toBe(760000);
  });

  it('12. Project Variation Request & Budget Control evaluation', async () => {
    const createVar = await request(app.getHttpServer())
      .post('/api/v1/project-variations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: createdProjectId,
        variationType: 'SCOPE_CHANGE',
        reason: 'Emergency seismic sensor integration',
        description: 'Install seismic cut-off sensors on lift controllers',
        estimatedCostImpact: 100000,
      });

    expect(createVar.status).toBe(201);
    const varId = createVar.body.data.id;

    const approveVar = await request(app.getHttpServer())
      .post(`/api/v1/project-variations/${varId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveVar.status).toBe(201);
    expect(approveVar.body.data.status).toBe('APPROVED');
    expect(Number(approveVar.body.data.approvedCostImpact)).toBe(100000);
  });

  it('13. Create Quality Snag item and verify Handover Gate blocking', async () => {
    const snagRes = await request(app.getHttpServer())
      .post('/api/v1/project-snags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: createdProjectId,
        title: 'Brake contactor clearance needs readjustment',
        description: 'Micro-switch gap is slightly out of tolerance',
        severity: 'CRITICAL',
        isBlockingHandover: true,
      });

    expect(snagRes.status).toBe(201);
    expect(snagRes.body.data.status).toBe('OPEN');
    createdSnagId = snagRes.body.data.id;

    // Attempt Handover while critical snag is open -> MUST BE BLOCKED
    const blockRes = await request(app.getHttpServer())
      .post('/api/v1/project-handover')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: createdProjectId,
        handoverFrom: 'Apex MEP Consultants',
        handoverTo: 'Tower A Facility Management',
      });

    expect(blockRes.status).toBe(400);
  });

  it('14. Resolve Snag & complete Handover Protocol', async () => {
    // Resolve snag
    const resolveRes = await request(app.getHttpServer())
      .post(`/api/v1/project-snags/${createdSnagId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(resolveRes.status).toBe(201);
    expect(resolveRes.body.data.status).toBe('CLOSED');

    // Handover succeeds
    const hndRes = await request(app.getHttpServer())
      .post('/api/v1/project-handover')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: createdProjectId,
        handoverFrom: 'Apex MEP Consultants',
        handoverTo: 'Tower A Facility Management',
        warrantyStartDate: '2026-06-01',
        defectLiabilityStartDate: '2026-06-01',
        defectLiabilityEndDate: '2027-05-31',
      });

    expect(hndRes.status).toBe(201);
    expect(hndRes.body.data.handoverNumber).toMatch(/^HND-/);
    expect(hndRes.body.data.status).toBe('COMPLETED');
  });

  it('15. Portfolio & Project Financial KPI Dashboard', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/project-dashboard/kpis?organizationId=${organizationId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalProjectsCount).toBeGreaterThan(0);
    expect(res.body.data.totalApprovedBudget).toBeGreaterThan(0);
  });
});
