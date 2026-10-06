import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Phase 19 — Enterprise Parking & Vehicle Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let organizationId: string;
  let communityId: string;
  let unit101Id: string;
  let residentId: string;
  let householdId: string;
  let parkingAreaId: string;
  let slot1Id: string;
  let slot2Id: string;
  let evSlotId: string;
  let visitId: string;

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
    if (!unit) unit = await prisma.unit.findFirst();
    unit101Id = unit!.id;

    const res = await prisma.resident.findFirst({ where: { organizationId } });
    residentId = res!.id;

    const hh = await prisma.household.findFirst({ where: { communityId } });
    householdId = hh!.id;

    const area = await prisma.parkingArea.findFirst({ where: { communityId } });
    parkingAreaId = area!.id;

    // Create dedicated test slots to ensure clean unallocated state
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newSlot1 = await prisma.parkingSlot.create({
      data: {
        organization: { connect: { id: organizationId } },
        community: { connect: { id: communityId } },
        parkingArea: { connect: { id: parkingAreaId } },
        slotNumber: `B1-TST-${rand}A`,
        slotType: 'CAR',
        status: 'AVAILABLE',
      },
    });
    slot1Id = newSlot1.id;

    const newSlot2 = await prisma.parkingSlot.create({
      data: {
        organization: { connect: { id: organizationId } },
        community: { connect: { id: communityId } },
        parkingArea: { connect: { id: parkingAreaId } },
        slotNumber: `B1-TST-${rand}B`,
        slotType: 'CAR',
        status: 'AVAILABLE',
      },
    });
    slot2Id = newSlot2.id;

    const evSlot = await prisma.parkingSlot.findFirst({
      where: { communityId, isEvEnabled: true },
    });
    evSlotId = evSlot?.id || slot1Id;

    const visit = await prisma.visit.findFirst({ where: { communityId } });
    visitId = visit?.id || '00000000-0000-0000-0000-000000000000';
  });

  afterAll(async () => {
    await app.close();
  });

  let registeredVehicleId: string;
  let authId: string;
  let rightId: string;
  let allocationId: string;
  let _permitId: string;
  let violationId: string;
  let appealId: string;

  it('1. Resident registers vehicle & management verifies document', async () => {
    // 1. Register
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/parking/vehicles/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        registrationNumber: 'KA-04-E2E-2026',
        vehicleType: 'CAR',
        make: 'Tesla',
        model: 'Model Y',
        color: 'Midnight Silver',
        fuelType: 'ELECTRIC',
        isEv: true,
        unitId: unit101Id,
        householdId,
        residentId,
        authorizationType: 'OWNER',
      });

    expect(regRes.status).toBe(201);
    const data = regRes.body.data;
    expect(data.vehicle.registrationNumber).toBe('KA-04-E2E-2026');
    expect(data.authorization.status).toBe('ACTIVE');

    registeredVehicleId = data.vehicle.id;
    authId = data.authorization.id;

    // 2. Verify
    const verRes = await request(app.getHttpServer())
      .post('/api/v1/parking/vehicles/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicleAuthorizationId: authId,
        verified: true,
      });

    expect(verRes.status).toBe(201);
    expect(verRes.body.data.verificationStatus).toBe('VERIFIED');
  });

  it('2. Management grants Parking Right to Unit 101', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/parking/rights')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        unitId: unit101Id,
        householdId,
        residentId,
        rightType: 'ASSIGNED',
        slotTypeEligibility: 'CAR',
        quantity: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.quantity).toBe(2);

    rightId = res.body.data.id;
  });

  it('3. Slot Allocation: Assign slot to vehicle under Parking Right', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/parking/allocations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        parkingRightId: rightId,
        parkingSlotId: slot1Id,
        vehicleId: registeredVehicleId,
        unitId: unit101Id,
        householdId,
        allocationType: 'PERMANENT',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('ACTIVE');

    allocationId = res.body.data.id;
  });

  it('4. Double Slot Allocation Race: Duplicate allocation on same slot is blocked', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/parking/allocations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        parkingRightId: rightId,
        parkingSlotId: slot1Id,
        unitId: unit101Id,
        allocationType: 'PERMANENT',
      });

    expect(res.status).toBe(409); // ConflictException
  });

  it('5. Issue Parking Permit & Link RFID Credential', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/parking/permits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        vehicleId: registeredVehicleId,
        parkingRightId: rightId,
        allocationId,
        permitType: 'RESIDENT',
        rfidCredentialTag: 'RFID-E2E-2026',
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.permitNumber).toMatch(/^PRMIT-/);
    expect(data.rfidCredentialTag).toBe('RFID-E2E-2026');

    _permitId = data.id;
  });

  it('6. Visitor Parking Capacity Check & Session Creation', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/parking/visitor-sessions/evaluate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        communityId,
        visitId,
        vehicleNumber: 'MH-02-VIS-9999',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.allowed).toBe(true);
    expect(res.body.data.sessionId).toBeDefined();

    // Release visitor parking
    const relRes = await request(app.getHttpServer())
      .post(`/api/v1/parking/visitor-sessions/release/${visitId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(relRes.status).toBe(201);
    expect(relRes.body.data.released).toBe(true);
  });

  it('7. Slot Maintenance Block linked to WorkOrder/Project', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/parking/inventory/slots/${slot2Id}/block`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'Epoxy floor repainting in Basement 1',
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('ACTIVE');

    const slot = await prisma.parkingSlot.findUnique({ where: { id: slot2Id } });
    expect(slot?.status).toBe('BLOCKED');
  });

  it('8. Report Parking Violation & Confirm Penalty Amount', async () => {
    // 1. Report
    const violRes = await request(app.getHttpServer())
      .post('/api/v1/parking/violations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        vehicleNumber: 'DL-01-VIOL-1111',
        violationType: 'WRONG_SLOT',
        severity: 'MEDIUM',
        description: 'Parked in private reserved slot without permit',
      });

    expect(violRes.status).toBe(201);
    const data = violRes.body.data;
    expect(data.violationNumber).toMatch(/^VIOL-/);
    expect(data.status).toBe('OPEN');

    violationId = data.id;

    // 2. Confirm
    const confRes = await request(app.getHttpServer())
      .post(`/api/v1/parking/violations/${violationId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        penaltyAmount: 500,
      });

    expect(confRes.status).toBe(201);
    expect(confRes.body.data.status).toBe('CONFIRMED');
    expect(confRes.body.data.penaltyBilled).toBe(true);
  });

  it('9. Resident Violation Appeal & Reviewer Waiver', async () => {
    // 1. Appeal
    const appRes = await request(app.getHttpServer())
      .post(`/api/v1/parking/violations/${violationId}/appeal`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'Security directed me to park in this slot due to water leakage in my slot',
      });

    expect(appRes.status).toBe(201);
    expect(appRes.body.data.status).toBe('SUBMITTED');

    appealId = appRes.body.data.id;

    // 2. Decide Appeal (Approve/Waive)
    const decRes = await request(app.getHttpServer())
      .post('/api/v1/parking/violations/appeals/decide')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        appealId,
        approved: true,
        reviewNotes: 'Verified guard shift log - slot reallocated temporarily',
      });

    expect(decRes.status).toBe(201);
    expect(decRes.body.data.status).toBe('APPROVED');

    // Verify violation waived
    const viol = await prisma.parkingViolation.findUnique({ where: { id: violationId } });
    expect(viol?.status).toBe('WAIVED');
  });

  it('10. EV Charging Session & Energy Consumption Recording', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/parking/ev-charging/sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        parkingSlotId: evSlotId,
        vehicleId: registeredVehicleId,
        residentId,
        householdId,
        meterStartKwh: 120.5,
        meterEndKwh: 138.5,
        energyConsumedKwh: 18.0,
        billedAmount: 216.0,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(Number(res.body.data.energyConsumedKwh)).toBe(18.0);
  });

  it('11. Parking Occupancy Entry & Exit Tracking', async () => {
    // 1. Entry
    const entryRes = await request(app.getHttpServer())
      .post('/api/v1/parking/occupancy/entry')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        communityId,
        vehicleId: registeredVehicleId,
        parkingAreaId,
        parkingSlotId: slot1Id,
        sourceType: 'SECURITY_GATE',
      });

    expect(entryRes.status).toBe(201);
    expect(entryRes.body.data.status).toBe('ACTIVE');

    // 2. Exit
    const exitRes = await request(app.getHttpServer())
      .post(`/api/v1/parking/occupancy/exit/${registeredVehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(exitRes.status).toBe(201);
    expect(exitRes.body.data.status).toBe('COMPLETED');
  });

  it('12. Parking Dashboard KPIs & Capacity Metrics', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/parking/dashboard/kpis?communityId=${communityId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalSlots).toBeGreaterThan(0);
    expect(res.body.data.registeredVehicles).toBeGreaterThan(0);
  });
});
