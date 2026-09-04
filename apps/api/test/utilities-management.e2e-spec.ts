import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Phase 23 — Enterprise Utilities & Sustainability Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let organizationId: string;
  let communityId: string;
  let demoUnitId: string;
  let demoAssetId: string;
  let demoVendorId: string;
  let elecServiceId: string;
  let mainMeterId: string;
  let unitMeterId: string;
  let tariffPlanId: string;
  let _readingOpeningId: string;
  let readingClosingId: string;
  let consumptionRecordId: string;
  let chargeCalculationId: string;
  let outageId: string;

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

    let asset = await prisma.asset.findFirst({
      where: { organizationId },
    });
    if (!asset) {
      asset = await prisma.asset.create({
        data: {
          organizationId,
          communityId,
          code: `AST-DG-${Date.now()}`,
          name: 'Backup Generator DG-1',
          assetType: 'EQUIPMENT',
          criticality: 'HIGH',
        },
      });
    }
    demoAssetId = asset.id;

    let vendor = await prisma.vendor.findFirst({
      where: { organizationId },
    });
    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          organizationId,
          code: `VND-WT-${Date.now()}`,
          name: 'Blue Waters Tanker Supplies',
        },
      });
    }
    demoVendorId = vendor.id;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  // 1. Utility Service & Supply Source
  it('1. should create a utility service and supply source', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/utilities/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        code: `ELEC-E2E-${Date.now()}`,
        name: 'E2E Power Distribution Service',
        utilityType: 'ELECTRICITY',
        unitOfMeasure: 'kWh',
        billingEnabled: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    elecServiceId = res.body.data.id;

    const srcRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/services/sources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        utilityServiceId: elecServiceId,
        sourceType: 'GRID',
        code: `SRC-GRID-${Date.now()}`,
        name: 'State Electricity Board Feeder',
        capacity: 2000,
        capacityUom: 'kVA',
      });

    expect(srcRes.status).toBe(201);
    expect(srcRes.body.data.status).toBe('ACTIVE');
  });

  // 2. Meters & Unit Assignment
  it('2. should register main and unit sub-meter and assign to unit', async () => {
    const mainRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/meters')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        utilityServiceId: elecServiceId,
        meterNumber: `MTR-MAIN-${Date.now()}`,
        meterType: 'MAIN',
        measurementType: 'ACTIVE_ENERGY',
        uom: 'kWh',
        multiplier: 1.0,
      });

    expect(mainRes.status).toBe(201);
    mainMeterId = mainRes.body.data.id;

    const unitRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/meters')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        utilityServiceId: elecServiceId,
        meterNumber: `MTR-UNIT-${Date.now()}`,
        meterType: 'SUB_METER',
        measurementType: 'ACTIVE_ENERGY',
        uom: 'kWh',
        multiplier: 1.0,
        parentMeterId: mainMeterId,
      });

    expect(unitRes.status).toBe(201);
    unitMeterId = unitRes.body.data.id;

    const assignRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/meters/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meterId: unitMeterId,
        targetType: 'UNIT',
        targetId: demoUnitId,
        effectiveFrom: '2026-01-01',
        allocationPercentage: 100.0,
      });

    expect(assignRes.status).toBe(201);
    expect(assignRes.body.data.meterId).toBe(unitMeterId);
  });

  // 3. Meter Readings & Consumption Calculation
  it('3. should record opening and closing readings and calculate consumption', async () => {
    const openRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/readings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meterId: unitMeterId,
        readingAt: '2026-04-01T00:00:00Z',
        value: 1000.0,
        uom: 'kWh',
        readingType: 'OPENING',
      });

    expect(openRes.status).toBe(201);
    _readingOpeningId = openRes.body.data.id;

    const closeRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/readings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meterId: unitMeterId,
        readingAt: '2026-04-30T23:59:59Z',
        value: 1350.0,
        uom: 'kWh',
        readingType: 'CLOSING',
      });

    expect(closeRes.status).toBe(201);
    readingClosingId = closeRes.body.data.id;

    const consRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/consumption/calculate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meterId: unitMeterId,
        periodStart: '2026-04-01T00:00:00Z',
        periodEnd: '2026-04-30T23:59:59Z',
      });

    expect(consRes.status).toBe(201);
    expect(Number(consRes.body.data.consumption)).toBe(350);
    consumptionRecordId = consRes.body.data.id;
  });

  // 4. Progressive Slab Tariff & Charge Calculation
  it('4. should calculate progressive slab tariff charge breakdown', async () => {
    const tariffRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/tariffs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        utilityServiceId: elecServiceId,
        name: 'E2E Progressive Slab Tariff',
        code: `TRF-${Date.now()}`,
        effectiveFrom: '2026-01-01',
        currency: 'INR',
        billingUom: 'kWh',
        components: [
          {
            componentType: 'FIXED',
            name: 'Fixed Grid Access Charge',
            fixedAmount: 200.0,
          },
          {
            componentType: 'SLAB',
            name: 'Energy Slabs',
            slabs: [
              { fromUnit: 0, toUnit: 100, ratePerUnit: 5.0 },
              { fromUnit: 100, toUnit: 300, ratePerUnit: 7.0 },
              { fromUnit: 300, ratePerUnit: 9.0 },
            ],
          },
        ],
      });

    expect(tariffRes.status).toBe(201);
    tariffPlanId = tariffRes.body.data.id;

    const chargeRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/charges/calculate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meterId: unitMeterId,
        tariffPlanId,
        periodStart: '2026-04-01T00:00:00Z',
        periodEnd: '2026-04-30T23:59:59Z',
      });

    // 350 kWh:
    // Fixed: 200
    // Slab 1 (0-100 @ 5.0): 500
    // Slab 2 (100-300 @ 7.0): 1400
    // Slab 3 (300-350 @ 9.0): 450
    // Total = 200 + 500 + 1400 + 450 = 2550
    expect(chargeRes.status).toBe(201);
    expect(Number(chargeRes.body.data.netAmount)).toBe(2550);
    chargeCalculationId = chargeRes.body.data.id;
  });

  // 5. Idempotent Billing Handoff
  it('5. should hand off calculated charge to billing engine idempotently', async () => {
    const handoffRes1 = await request(app.getHttpServer())
      .post('/api/v1/utilities/charges/handoff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        chargeCalculationId,
        billableAccountId: '22222222-3333-4444-5555-666666666666',
        billingPeriod: '2026-04',
      });

    expect(handoffRes1.status).toBe(201);
    expect(handoffRes1.body.data.success).toBe(true);

    // Duplicate handoff must be idempotent
    const handoffRes2 = await request(app.getHttpServer())
      .post('/api/v1/utilities/charges/handoff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        chargeCalculationId,
        billableAccountId: '22222222-3333-4444-5555-666666666666',
        billingPeriod: '2026-04',
      });

    expect(handoffRes2.status).toBe(201);
    expect(handoffRes2.body.data.message).toContain('Idempotent');
  });

  // 6. Meter Rollover Calculation
  it('6. should calculate consumption correctly across meter rollover', async () => {
    const rollMeter = await request(app.getHttpServer())
      .post('/api/v1/utilities/meters')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        utilityServiceId: elecServiceId,
        meterNumber: `MTR-ROLL-${Date.now()}`,
        uom: 'kWh',
        rolloverValue: 100000,
      });

    const mId = rollMeter.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/utilities/readings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meterId: mId,
        readingAt: '2026-05-01T00:00:00Z',
        value: 99990.0,
        uom: 'kWh',
        readingType: 'OPENING',
      });

    await request(app.getHttpServer())
      .post('/api/v1/utilities/readings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meterId: mId,
        readingAt: '2026-05-31T23:59:59Z',
        value: 10.0,
        uom: 'kWh',
        readingType: 'CLOSING',
      });

    const consRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/consumption/calculate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meterId: mId,
        periodStart: '2026-05-01T00:00:00Z',
        periodEnd: '2026-05-31T23:59:59Z',
      });

    // Rollover: 100000 - 99990 + 10 = 20 kWh
    expect(consRes.status).toBe(201);
    expect(Number(consRes.body.data.consumption)).toBe(20);
  });

  // 7. Reading Correction & Audit
  it('7. should correct a reading, supersede original, and adjust consumption', async () => {
    const corrRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/readings/correct')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        readingId: readingClosingId,
        correctedValue: 1320.0,
        reason: 'Operator typo corrected from photo evidence',
      });

    expect(corrRes.status).toBe(201);
    expect(corrRes.body.data.readingType).toBe('CORRECTION');

    const adjRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/consumption/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        consumptionRecordId,
        deltaConsumption: -30.0,
        reason: 'Correction of April closing reading',
      });

    expect(adjRes.status).toBe(201);
    expect(Number(adjRes.body.data.consumption)).toBe(320);
  });

  // 8. Estimated Readings
  it('8. should record explicit estimated reading when meter is inaccessible', async () => {
    const estRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/readings/estimate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meterId: unitMeterId,
        readingAt: '2026-06-30T23:59:59Z',
        estimatedValue: 1550.0,
        estimationMethod: 'AVERAGE_LAST_3_PERIODS',
      });

    expect(estRes.status).toBe(201);
    expect(estRes.body.data.readingType).toBe('ESTIMATED');
    expect(estRes.body.data.quality).toBe('ESTIMATED');
  });

  // 9. Common Area Allocation
  it('9. should allocate common meter consumption across eligible units', async () => {
    const allocRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/consumption/allocate-common')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        communityId,
        meterId: unitMeterId,
        periodStart: '2026-04-01T00:00:00Z',
        periodEnd: '2026-04-30T23:59:59Z',
        allocationPolicy: 'EQUAL_PER_UNIT',
      });

    expect(allocRes.status).toBe(201);
    expect(allocRes.body.data.totalCommonConsumption).toBeDefined();
    expect(allocRes.body.data.allocatedPerUnit).toBeGreaterThan(0);
  });

  // 10. Water Balance & Tanker Delivery
  it('10. should calculate water balance and verify tanker delivery quantity', async () => {
    const tankerRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/water/tankers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        vendorId: demoVendorId,
        vehicleNumber: 'KA-04-WT-1234',
        deliveryAt: '2026-04-15T10:00:00Z',
        declaredQuantity: 20.0,
        verifiedQuantity: 18.5,
        uom: 'KL',
      });

    expect(tankerRes.status).toBe(201);
    expect(tankerRes.body.data.status).toBe('ACCEPTED');

    const balRes = await request(app.getHttpServer())
      .get(
        `/api/v1/utilities/water/balance?communityId=${communityId}&periodStart=2026-04-01&periodEnd=2026-04-30`,
      )
      .set('Authorization', `Bearer ${adminToken}`);

    expect(balRes.status).toBe(200);
    expect(balRes.body.data.totalFreshwaterInflowKl).toBeGreaterThan(0);
    expect(balRes.body.data.completeness).toBe('COMPLETE');
  });

  // 11. Energy Balance & DG Run Session
  it('11. should record DG run session with efficiency and compute energy balance', async () => {
    const dgRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/energy/dg-runs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        communityId,
        assetId: demoAssetId,
        startAt: '2026-04-10T15:00:00Z',
        endAt: '2026-04-10T17:00:00Z',
        openingEnergyReading: 5000.0,
        closingEnergyReading: 5360.0,
        fuelConsumedLitres: 120.0,
      });

    expect(dgRes.status).toBe(201);
    expect(Number(dgRes.body.data.generatedEnergy)).toBe(360);
    expect(Number(dgRes.body.data.efficiency)).toBe(3); // 360 / 120 = 3 kWh/L

    const nrgBalRes = await request(app.getHttpServer())
      .get(
        `/api/v1/utilities/energy/balance?communityId=${communityId}&periodStart=2026-04-01&periodEnd=2026-04-30`,
      )
      .set('Authorization', `Bearer ${adminToken}`);

    expect(nrgBalRes.status).toBe(200);
    expect(nrgBalRes.body.data.totalAvailableEnergyKwh).toBeGreaterThan(0);
  });

  // 12. Solar Generation & Grid Export
  it('12. should record daily solar generation, self-consumption, and grid export', async () => {
    const solRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/energy/solar-generation')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        communityId,
        assetId: demoAssetId,
        generationDate: '2026-04-20',
        generationKwh: 450.0,
        selfConsumedKwh: 350.0,
        exportedKwh: 100.0,
      });

    expect(solRes.status).toBe(201);
    expect(Number(solRes.body.data.generationKwh)).toBe(450);
  });

  // 13. Grid Outage & Restoration
  it('13. should report grid outage, link communication, and record restoration', async () => {
    const outRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/outages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        utilityServiceId: elecServiceId,
        outageType: 'SUPPLIER_OUTAGE',
        title: 'State Grid 11kV Feeder Tripped',
        startAt: '2026-04-18T14:00:00Z',
        affectedScope: 'Entire Estate (Running on DG)',
      });

    expect(outRes.status).toBe(201);
    outageId = outRes.body.data.id;

    const restRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/outages/restore')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        outageId,
        restoredAt: '2026-04-18T16:30:00Z',
        resolutionNotes: 'BESCOM substation restored main line.',
      });

    expect(restRes.status).toBe(201);
    expect(restRes.body.data.status).toBe('RESTORED');
  });

  // 14. Anomaly Detection & Sustainability Metrics
  it('14. should detect deterministic anomalies and calculate sustainability metrics', async () => {
    const anomRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/anomalies/detect')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        communityId,
        period: '2026-04',
      });

    expect(anomRes.status).toBe(201);

    const susRes = await request(app.getHttpServer())
      .post('/api/v1/utilities/sustainability/calculate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        communityId,
        metricPeriod: '2026-04',
      });

    expect(susRes.status).toBe(201);
    expect(Number(susRes.body.data.estimatedCo2eKg)).toBeGreaterThan(0);
    expect(susRes.body.data.solarSharePct).toBeDefined();
  });
});
