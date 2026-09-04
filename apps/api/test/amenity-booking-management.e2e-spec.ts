import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Phase 20 — Enterprise Amenities, Facilities & Booking Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let organizationId: string;
  let communityId: string;
  let unit101Id: string;
  let residentId: string;
  let householdId: string;
  let badmintonAmenityId: string;
  let court1Id: string;
  let court2Id: string;
  let hallAmenityId: string;
  let _poolAmenityId: string;

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

    const badm = await prisma.amenity.findFirst({ where: { communityId, code: 'AMN-BADMINTON' } });
    badmintonAmenityId = badm!.id;

    const courts = await prisma.amenityResource.findMany({
      where: { amenityId: badmintonAmenityId },
      orderBy: { code: 'asc' },
    });
    court1Id = courts[0]?.id;
    court2Id = courts[1]?.id;

    const hall = await prisma.amenity.findFirst({ where: { communityId, code: 'AMN-PARTY-HALL' } });
    hallAmenityId = hall!.id;

    const pool = await prisma.amenity.findFirst({ where: { communityId, code: 'AMN-POOL' } });
    _poolAmenityId = pool!.id;

    // Generous quota for automated test runs across all policies
    await prisma.amenityBookingPolicy.updateMany({
      data: { maxActiveBookingsPerUnit: 50 },
    });
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  let booking1Id: string;
  let booking2Id: string;
  let approvalBookingId: string;
  let waitlistBookingId: string;
  let waitlistEntryId: string;
  let damageReportId: string;

  // Unique base offset for this run
  const runOffsetHours = 24 * 365 * 10 + Math.floor(Math.random() * 100000);

  it('1. Free Badminton Court booking with instant confirmation & check-in', async () => {
    const start = new Date(Date.now() + runOffsetHours * 3600 * 1000).toISOString();
    const end = new Date(new Date(start).getTime() + 3600 * 1000).toISOString();

    const res = await request(app.getHttpServer())
      .post('/api/v1/amenities/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        amenityId: badmintonAmenityId,
        resourceId: court1Id,
        unitId: unit101Id,
        householdId,
        residentId,
        bookingType: 'SPORT',
        startAt: start,
        endAt: end,
        participantCount: 2,
        termsAccepted: true,
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.bookingNumber).toMatch(/^AMB-/);
    expect(data.status).toBe('CONFIRMED');
    expect(Number(data.basePrice)).toBe(0);

    booking1Id = data.id;

    // Check-in
    const checkRes = await request(app.getHttpServer())
      .post(`/api/v1/amenities/checkin/${booking1Id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(checkRes.status).toBe(201);
    expect(checkRes.body.data.status).toBe('CHECKED_IN');
    expect(checkRes.body.data.checkInAt).toBeDefined();
  });

  it('2. Concurrent Court Race: Simultaneous booking for same court/time is blocked', async () => {
    const start = new Date(Date.now() + runOffsetHours * 3600 * 1000).toISOString();
    const end = new Date(new Date(start).getTime() + 3600 * 1000).toISOString();

    const res = await request(app.getHttpServer())
      .post('/api/v1/amenities/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        amenityId: badmintonAmenityId,
        resourceId: court1Id,
        unitId: unit101Id,
        householdId,
        residentId,
        bookingType: 'SPORT',
        startAt: start,
        endAt: end,
        participantCount: 2,
      });

    expect(res.status).toBe(409); // ConflictException
  });

  it('3. Auto-Assignment: Requesting Any Court allocates available Court 2', async () => {
    const start = new Date(Date.now() + runOffsetHours * 3600 * 1000).toISOString();
    const end = new Date(new Date(start).getTime() + 3600 * 1000).toISOString();

    const res = await request(app.getHttpServer())
      .post('/api/v1/amenities/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        amenityId: badmintonAmenityId,
        unitId: unit101Id,
        householdId,
        residentId,
        bookingType: 'SPORT',
        startAt: start,
        endAt: end,
        participantCount: 2,
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.status).toBe('CONFIRMED');
    expect(data.resourceId).toBe(court2Id);

    booking2Id = data.id;
  });

  it('4. Paid Party Hall booking: Snapshot pricing (₹5,000 + ₹10,000 deposit) with approval requirement', async () => {
    const eventStart = new Date(Date.now() + (runOffsetHours + 24) * 3600 * 1000).toISOString();
    const eventEnd = new Date(new Date(eventStart).getTime() + 4 * 3600 * 1000).toISOString();

    const res = await request(app.getHttpServer())
      .post('/api/v1/amenities/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        amenityId: hallAmenityId,
        unitId: unit101Id,
        householdId,
        residentId,
        bookingType: 'EVENT',
        startAt: eventStart,
        endAt: eventEnd,
        participantCount: 80,
        guestCount: 60,
        parkingRequested: true,
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.status).toBe('PENDING_APPROVAL');
    expect(data.approvalStatus).toBe('PENDING');
    expect(Number(data.basePrice)).toBe(5000);
    expect(Number(data.depositAmount)).toBe(10000);

    approvalBookingId = data.id;
  });

  it('5. Manager approves Party Hall event booking', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/amenities/bookings/approvals/decide')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bookingId: approvalBookingId,
        approved: true,
        reviewNotes: 'Verified noise guidelines and security deposit terms',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.approvalStatus).toBe('APPROVED');
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('6. Waitlist Entry & Automatic Promotion on Cancellation', async () => {
    const peakStart = new Date(Date.now() + (runOffsetHours + 48) * 3600 * 1000).toISOString();
    const peakEnd = new Date(new Date(peakStart).getTime() + 3600 * 1000).toISOString();

    // 1. Initial booking consumes Court 1
    const initRes = await request(app.getHttpServer())
      .post('/api/v1/amenities/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        amenityId: badmintonAmenityId,
        resourceId: court1Id,
        unitId: unit101Id,
        householdId,
        residentId,
        startAt: peakStart,
        endAt: peakEnd,
      });

    expect(initRes.status).toBe(201);
    waitlistBookingId = initRes.body.data.id;

    // 2. Second resident joins waitlist for same slot
    const waitRes = await request(app.getHttpServer())
      .post('/api/v1/amenities/waitlist/join')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amenityId: badmintonAmenityId,
        resourceId: court1Id,
        residentId,
        unitId: unit101Id,
        desiredStartAt: peakStart,
        desiredEndAt: peakEnd,
        partySize: 2,
      });

    expect(waitRes.status).toBe(201);
    expect(waitRes.body.data.status).toBe('WAITING');
    waitlistEntryId = waitRes.body.data.id;

    // 3. Original resident cancels booking -> triggers waitlist offer promotion
    const cancelRes = await request(app.getHttpServer())
      .post(`/api/v1/amenities/bookings/${waitlistBookingId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Schedule conflict' });

    expect(cancelRes.status).toBe(201);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // 4. Verify waitlist entry received offer and accept it
    const acceptRes = await request(app.getHttpServer())
      .post(`/api/v1/amenities/waitlist/${waitlistEntryId}/accept`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(acceptRes.status).toBe(201);
    expect(acceptRes.body.data.status).toBe('ACCEPTED');
  });

  it('7. Reschedule Booking atomically to a new slot', async () => {
    const newStart = new Date(Date.now() + (runOffsetHours + 72) * 3600 * 1000).toISOString();
    const newEnd = new Date(new Date(newStart).getTime() + 3600 * 1000).toISOString();

    const res = await request(app.getHttpServer())
      .post(`/api/v1/amenities/bookings/${booking2Id}/reschedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        startAt: newStart,
        endAt: newEnd,
      });

    expect(res.status).toBe(201);
    expect(new Date(res.body.data.startAt).toISOString()).toBe(newStart);
  });

  it('8. Maintenance Block: Temporary closure flags conflict and blocks new reservations', async () => {
    const blockStart = new Date(Date.now() + (runOffsetHours + 96) * 3600 * 1000).toISOString();
    const blockEnd = new Date(new Date(blockStart).getTime() + 12 * 3600 * 1000).toISOString();

    const res = await request(app.getHttpServer())
      .post('/api/v1/amenities/maintenance-blocks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amenityId: badmintonAmenityId,
        resourceId: court1Id,
        reason: 'Wooden floor re-polishing and LED lighting fixture replacement',
        startAt: blockStart,
        endAt: blockEnd,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.block.status).toBe('ACTIVE');

    // Attempting to book during maintenance window fails
    const bookRes = await request(app.getHttpServer())
      .post('/api/v1/amenities/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        amenityId: badmintonAmenityId,
        resourceId: court1Id,
        unitId: unit101Id,
        startAt: blockStart,
        endAt: new Date(new Date(blockStart).getTime() + 3600 * 1000).toISOString(),
      });

    expect(bookRes.status).toBe(409); // Conflict
  });

  it('9. Facility Damage Report & Security Deposit Settlement', async () => {
    // 1. Report Damage
    const dmgRes = await request(app.getHttpServer())
      .post('/api/v1/amenities/damage-reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bookingId: approvalBookingId,
        amenityId: hallAmenityId,
        description: 'Scratched stage floor panel and broken spotlight bracket',
        severity: 'MEDIUM',
        estimatedAmount: 2000,
      });

    expect(dmgRes.status).toBe(201);
    expect(dmgRes.body.data.status).toBe('REPORTED');
    damageReportId = dmgRes.body.data.id;

    // 2. Settle Deposit (₹2,000 deduction approved, balance refunded)
    const setRes = await request(app.getHttpServer())
      .post('/api/v1/amenities/damage-reports/settle')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bookingId: approvalBookingId,
        damageReportId,
        approvedDeductionAmount: 2000,
      });

    expect(setRes.status).toBe(201);
    expect(setRes.body.data.depositStatus).toBe('PARTIALLY_APPLIED');
  });

  it('10. Availability Engine dynamic slot calculation', async () => {
    const checkDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);

    const res = await request(app.getHttpServer())
      .post('/api/v1/amenities/availability/check')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amenityId: badmintonAmenityId,
        date: checkDate,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.available).toBe(true);
    expect(res.body.data.resources.length).toBe(2);
  });

  it('11. Executive Amenities Dashboard KPIs & Capacity Metrics', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/amenities/dashboard/kpis?communityId=${communityId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalAmenities).toBeGreaterThan(0);
    expect(res.body.data.totalResources).toBeGreaterThan(0);
    expect(res.body.data.averageUtilizationPercent).toBeDefined();
  });
});
