import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Enterprise Inventory & Stores Management (Phase 11 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let communityId: string;

  let uomId: string;
  let categoryId: string;
  let storeAId: string;
  let storeBId: string;
  let binAId: string;
  let binBId: string;
  let standardItemId: string;
  let serializedItemId: string;
  let batchItemId: string;
  let receiptId: string;
  let _batchId: string;
  let serialId: string;
  let workOrderId: string;
  let requirementId: string;
  let reservationId: string;
  let _issueId: string;
  let transferId: string;
  let countId: string;

  const testSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // 1. Login as Platform Admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@communityos.io',
        password: 'Admin@CommunityOS2026!',
      })
      .then((res) => {
        if (res.status !== 200) {
          console.error('E2E ERROR RESPONSE [200]:', res.status, JSON.stringify(res.body, null, 2));
        }
        expect(res.status).toBe(200);
        return res;
      });

    adminAccessToken = loginRes.body.data.tokens.accessToken;

    const org = await prisma.organization.findFirst({
      where: { slug: 'community-os-demo' },
    });
    orgId = org!.id;

    const comm = await prisma.community.findFirst({
      where: { organizationId: orgId, slug: 'green-valley-township' },
    });
    communityId = comm!.id;

    // Fetch or create a sample work order for testing
    let wo = await prisma.workOrder.findFirst({
      where: { organizationId: orgId },
    });
    if (!wo) {
      const admin = await prisma.user.findFirst({ where: { email: 'admin@communityos.io' } });
      wo = await prisma.workOrder.create({
        data: {
          organizationId: orgId,
          communityId: communityId,
          workOrderNumber: `WO-TEST-${testSuffix}`,
          title: `Test Maintenance WO ${testSuffix}`,
          workType: 'CORRECTIVE',
          currentState: 'IN_PROGRESS',
          createdById: admin!.id,
        },
      });
    }
    workOrderId = wo.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Units of Measure & Categories', () => {
    it('POST /api/v1/inventory-uoms - should create a Unit of Measure', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory-uoms')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          code: `UOM_${testSuffix}`,
          name: `Test Unit ${testSuffix}`,
          symbol: `u${testSuffix.slice(0, 3)}`,
          precision: 2,
          isBase: true,
          conversionFactor: 1,
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.code).toBe(`UOM_${testSuffix}`);
      uomId = res.body.data.id;
    });

    it('GET /api/v1/inventory-uoms - should list UOMs for organization', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/inventory-uoms?organizationId=${orgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .then((res) => {
          if (res.status !== 200) {
            console.error(
              'E2E ERROR RESPONSE [200]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(200);
          return res;
        });

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((u: any) => u.id === uomId)).toBe(true);
    });

    it('POST /api/v1/inventory-categories - should create an Inventory Category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory-categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          code: `CAT_${testSuffix}`,
          name: `Mechanical Spares ${testSuffix}`,
          description: 'Spares for pumps and motors',
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.code).toBe(`CAT_${testSuffix}`);
      categoryId = res.body.data.id;
    });

    it('GET /api/v1/inventory-categories - should list categories', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/inventory-categories?organizationId=${orgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .then((res) => {
          if (res.status !== 200) {
            console.error(
              'E2E ERROR RESPONSE [200]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(200);
          return res;
        });

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((c: any) => c.id === categoryId)).toBe(true);
    });
  });

  describe('2. Stores & Bins Configuration', () => {
    it('POST /api/v1/inventory-stores - should create Central Store A', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory-stores')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          code: `STORE_A_${testSuffix}`,
          name: `Central Main Store ${testSuffix}`,
          storeType: 'CENTRAL',
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data).toHaveProperty('id');
      storeAId = res.body.data.id;
    });

    it('POST /api/v1/inventory-stores - should create Sub-Store B', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory-stores')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          code: `STORE_B_${testSuffix}`,
          name: `Sub Store B ${testSuffix}`,
          storeType: 'MAINTENANCE',
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data).toHaveProperty('id');
      storeBId = res.body.data.id;
    });

    it('POST /api/v1/inventory-stores/:storeId/bins - should create Bins in Store A & B', async () => {
      const resA = await request(app.getHttpServer())
        .post(`/api/v1/inventory-stores/${storeAId}/bins`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          code: `BIN_A1_${testSuffix}`,
          name: `Rack 1 Bin 1`,
          rack: 'R1',
          shelf: 'S1',
          bin: 'B1',
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });
      binAId = resA.body.data.id;

      const resB = await request(app.getHttpServer())
        .post(`/api/v1/inventory-stores/${storeBId}/bins`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          code: `BIN_B1_${testSuffix}`,
          name: `Rack 2 Bin 1`,
          rack: 'R2',
          shelf: 'S1',
          bin: 'B1',
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });
      binBId = resB.body.data.id;

      expect(binAId).toBeDefined();
      expect(binBId).toBeDefined();
    });
  });

  describe('3. Item Master & Policy Management', () => {
    it('POST /api/v1/inventory-items - should create standard consumable item', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory-items')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          name: `Hydraulic Valve Seal ${testSuffix}`,
          categoryId: categoryId,
          baseUomId: uomId,
          itemType: 'SPARE_PART',
          minStockLevel: 10,
          reorderLevel: 25,
          maxStockLevel: 100,
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('qrIdentifier');
      standardItemId = res.body.data.id;
    });

    it('POST /api/v1/inventory-items - should create serialized item', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory-items')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          name: `Digital Flow Sensor ${testSuffix}`,
          categoryId: categoryId,
          baseUomId: uomId,
          itemType: 'SPARE_PART',
          isSerialTracked: true,
          minStockLevel: 2,
          reorderLevel: 5,
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data.isSerialTracked).toBe(true);
      serializedItemId = res.body.data.id;
    });

    it('POST /api/v1/inventory-items - should create batch & expiry tracked item', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory-items')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          name: `Synthetic Engine Lubricant ${testSuffix}`,
          categoryId: categoryId,
          baseUomId: uomId,
          itemType: 'CONSUMABLE',
          isBatchTracked: true,
          isExpiryTracked: true,
          minStockLevel: 5,
          reorderLevel: 15,
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data.isBatchTracked).toBe(true);
      expect(res.body.data.isExpiryTracked).toBe(true);
      batchItemId = res.body.data.id;
    });

    it('PUT /api/v1/inventory-items/:itemId/policies/:storeId - should configure store policy', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/inventory-items/${standardItemId}/policies/${storeAId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          minQuantity: 10,
          reorderLevel: 20,
          reorderQuantity: 50,
          maxQuantity: 150,
          defaultBinId: binAId,
          reorderEnabled: true,
        })
        .then((res) => {
          if (res.status !== 200) {
            console.error(
              'E2E ERROR RESPONSE [200]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(200);
          return res;
        });

      expect(res.body.data.minQuantity).toBe(10);
      expect(res.body.data.reorderLevel).toBe(20);
    });
  });

  describe('4. Inward Goods Receipt & Immutable Ledger', () => {
    it('POST /api/v1/inventory-receipts - should create and post goods receipt', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory-receipts')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          storeId: storeAId,
          supplierName: 'FastFlow Spares Ltd',
          sourceReference: `PO-TEST-${testSuffix}`,
          lines: [
            {
              itemId: standardItemId,
              quantity: 80,
              uomId: uomId,
              unitPrice: 150,
              binId: binAId,
            },
            {
              itemId: serializedItemId,
              quantity: 2,
              uomId: uomId,
              unitPrice: 5400,
              binId: binAId,
              serialNumbers: [`SN-${testSuffix}-001`, `SN-${testSuffix}-002`],
            },
            {
              itemId: batchItemId,
              quantity: 30,
              uomId: uomId,
              unitPrice: 850,
              binId: binAId,
              batchNumber: `LOT-${testSuffix}-B1`,
              expiryDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
            },
          ],
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('POSTED');
      receiptId = res.body.data.id;
    });

    it('GET /api/v1/inventory/balances - should verify stock balance projections', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/inventory/balances?organizationId=${orgId}&storeId=${storeAId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .then((res) => {
          if (res.status !== 200) {
            console.error(
              'E2E ERROR RESPONSE [200]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(200);
          return res;
        });

      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      const stdBal = res.body.data.find((b: any) => b.itemId === standardItemId);
      expect(stdBal).toBeDefined();
      expect(stdBal.quantityOnHand).toBe(80);
      expect(stdBal.quantityAvailable).toBe(80);
      expect(stdBal.quantityReserved).toBe(0);
    });

    it('GET /api/v1/inventory/balances/ledger - should verify immutable StockLedgerEntry journal', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/inventory/balances/ledger?organizationId=${orgId}&storeId=${storeAId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .then((res) => {
          if (res.status !== 200) {
            console.error(
              'E2E ERROR RESPONSE [200]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(200);
          return res;
        });

      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      const receiptEntries = res.body.data.filter((e: any) => e.referenceId === receiptId);
      expect(receiptEntries.length).toBe(3);
      expect(receiptEntries[0].transactionType).toBe('RECEIPT');
    });

    it('GET /api/v1/inventory-serials - should verify registered serialized units', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/inventory-serials?itemId=${serializedItemId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .then((res) => {
          if (res.status !== 200) {
            console.error(
              'E2E ERROR RESPONSE [200]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(200);
          return res;
        });

      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].status).toBe('IN_STOCK');
      serialId = res.body.data[0].id;
    });

    it('GET /api/v1/inventory-batches - should verify batch tracking records', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/inventory-batches?itemId=${batchItemId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .then((res) => {
          if (res.status !== 200) {
            console.error(
              'E2E ERROR RESPONSE [200]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(200);
          return res;
        });

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].batchNumber).toBe(`LOT-${testSuffix}-B1`);
      _batchId = res.body.data[0].id;
    });
  });

  describe('5. Two-Phase Reservation & Material Issue for Work Orders', () => {
    it('POST /api/v1/work-orders/:workOrderId/materials/requirements - should create requirement', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/work-orders/${workOrderId}/materials/requirements`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          itemId: standardItemId,
          requiredQty: 10,
          uomId: uomId,
          preferredStoreId: storeAId,
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.requiredQty).toBe(10);
      requirementId = res.body.data.id;
    });

    it('POST /api/v1/work-orders/:workOrderId/materials/reservations - should reserve stock', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/work-orders/${workOrderId}/materials/reservations`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          requirementId: requirementId,
          storeId: storeAId,
          binId: binAId,
          quantity: 10,
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('ACTIVE');
      reservationId = res.body.data.id;

      // Verify Stock Balance: Available = 70, Reserved = 10, OnHand = 80
      const balRes = await request(app.getHttpServer())
        .get(`/api/v1/inventory/balances?organizationId=${orgId}&storeId=${storeAId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .then((res) => {
          if (res.status !== 200) {
            console.error(
              'E2E ERROR RESPONSE [200]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(200);
          return res;
        });

      const bal = balRes.body.data.find((b: any) => b.itemId === standardItemId);
      expect(bal.quantityOnHand).toBe(80);
      expect(bal.quantityReserved).toBe(10);
      expect(bal.quantityAvailable).toBe(70);
    });

    it('POST /api/v1/inventory-issues - should fulfill reservation and issue stock', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory-issues')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          storeId: storeAId,
          workOrderId: workOrderId,
          lines: [
            {
              itemId: standardItemId,
              requestedQty: 10,
              issuedQty: 10,
              uomId: uomId,
              binId: binAId,
              reservationId: reservationId,
              requirementId: requirementId,
            },
          ],
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('POSTED');
      _issueId = res.body.data.id;

      // Verify Stock Balance: OnHand = 70, Reserved = 0, Available = 70
      const balRes = await request(app.getHttpServer())
        .get(`/api/v1/inventory/balances?organizationId=${orgId}&storeId=${storeAId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .then((res) => {
          if (res.status !== 200) {
            console.error(
              'E2E ERROR RESPONSE [200]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(200);
          return res;
        });

      const bal = balRes.body.data.find((b: any) => b.itemId === standardItemId);
      expect(bal.quantityOnHand).toBe(70);
      expect(bal.quantityReserved).toBe(0);
      expect(bal.quantityAvailable).toBe(70);
    });

    it('POST /api/v1/work-orders/:workOrderId/materials/consumptions - should record consumption', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/work-orders/${workOrderId}/materials/consumptions`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          itemId: standardItemId,
          quantity: 8,
          uomId: uomId,
          requirementId: requirementId,
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.quantity).toBe(8);
    });

    it('POST /api/v1/inventory-returns - should return 2 unused parts back to store', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory-returns')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          storeId: storeAId,
          workOrderId: workOrderId,
          returnType: 'WORK_ORDER_UNUSED',
          lines: [
            {
              itemId: standardItemId,
              returnedQty: 2,
              uomId: uomId,
              binId: binAId,
            },
          ],
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('POSTED');

      // Verify Stock Balance: OnHand restored to 72
      const balRes = await request(app.getHttpServer())
        .get(`/api/v1/inventory/balances?organizationId=${orgId}&storeId=${storeAId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .then((res) => {
          if (res.status !== 200) {
            console.error(
              'E2E ERROR RESPONSE [200]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(200);
          return res;
        });

      const bal = balRes.body.data.find((b: any) => b.itemId === standardItemId);
      expect(bal.quantityOnHand).toBe(72);
      expect(bal.quantityAvailable).toBe(72);
    });
  });

  describe('6. Serial to Asset Conversion', () => {
    it('POST /api/v1/inventory-serials/:id/convert-to-asset - should convert serial item to Asset', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/inventory-serials/${serialId}/convert-to-asset`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: `Installed Flow Sensor Unit ${testSuffix}`,
          workOrderId: workOrderId,
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data).toHaveProperty('assetId');
      expect(res.body.data.status).toBe('CONVERTED_TO_ASSET');

      // Verify Asset was actually created in Asset registry
      const asset = await prisma.asset.findUnique({
        where: { id: res.body.data.assetId },
      });
      expect(asset).toBeDefined();
      expect(asset!.name).toBe(`Installed Flow Sensor Unit ${testSuffix}`);
    });
  });

  describe('7. Inter-Store Transfers & Reconciliation', () => {
    it('POST /api/v1/stock-transfers - should dispatch transfer from Store A to Store B', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/stock-transfers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          sourceStoreId: storeAId,
          destinationStoreId: storeBId,
          lines: [
            {
              itemId: standardItemId,
              requestedQty: 12,
              dispatchedQty: 12,
              uomId: uomId,
              sourceBinId: binAId,
              destinationBinId: binBId,
            },
          ],
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data.status).toBe('DISPATCHED');
      transferId = res.body.data.id;

      // Verify Store A deducted by 12 -> 60
      const balA = await prisma.stockBalance.findFirst({
        where: { storeId: storeAId, itemId: standardItemId },
      });
      expect(Number(balA!.quantityOnHand)).toBe(60);
    });

    it('POST /api/v1/stock-transfers/:id/receive - should receive transfer in Store B', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/stock-transfers/${transferId}/receive`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data.status).toBe('RECEIVED');

      // Verify Store B credited by 12
      const balB = await prisma.stockBalance.findFirst({
        where: { storeId: storeBId, itemId: standardItemId },
      });
      expect(Number(balB!.quantityOnHand)).toBe(12);
    });
  });

  describe('8. Compensating Adjustments & Cycle Counts', () => {
    it('POST /api/v1/stock-adjustments - should post scrap/damage adjustment', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/stock-adjustments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          storeId: storeAId,
          reason: 'DAMAGE',
          notes: 'Water damaged valve seals in storage',
          lines: [
            {
              itemId: standardItemId,
              quantityDelta: -5,
              uomId: uomId,
              binId: binAId,
            },
          ],
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data.status).toBe('POSTED');

      // Verify Store A decreased from 60 to 55
      const balA = await prisma.stockBalance.findFirst({
        where: { storeId: storeAId, itemId: standardItemId },
      });
      expect(Number(balA!.quantityOnHand)).toBe(55);
    });

    it('POST /api/v1/stock-counts - should start count session and reconcile variance', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/stock-counts')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          storeId: storeAId,
          countType: 'FULL',
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(createRes.body.data.status).toBe('IN_PROGRESS');
      countId = createRes.body.data.id;

      // Find the line for standard item
      const line = createRes.body.data.lines.find((l: any) => l.itemId === standardItemId);
      expect(line).toBeDefined();
      expect(line.systemSnapshotQty).toBeGreaterThan(0);

      const targetCountedQty = Number(line.systemSnapshotQty) + 3;

      // Record counted qty (+3 found stock variance)
      await request(app.getHttpServer())
        .post(`/api/v1/stock-counts/${countId}/record`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          lines: [
            {
              lineId: line.id,
              countedQty: targetCountedQty,
              notes: 'Found 3 unopened seal packets in shelf rear',
            },
          ],
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      // Reconcile and post variance
      const reconRes = await request(app.getHttpServer())
        .post(`/api/v1/stock-counts/${countId}/reconcile`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(reconRes.body.data.status).toBe('POSTED');

      // Verify Store A balance updated to 58
      const balA = await prisma.stockBalance.findFirst({
        where: { storeId: storeAId, itemId: standardItemId },
      });
      expect(Number(balA!.quantityOnHand)).toBe(58);
    });
  });

  describe('9. QR Scanner & Bulk CSV Import', () => {
    it('GET /api/v1/inventory/scan/:code - should lookup item by QR code', async () => {
      const item = await prisma.inventoryItem.findUnique({ where: { id: standardItemId } });
      const res = await request(app.getHttpServer())
        .get(`/api/v1/inventory/scan/${item!.qrIdentifier}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .then((res) => {
          if (res.status !== 200) {
            console.error(
              'E2E ERROR RESPONSE [200]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(200);
          return res;
        });

      expect(res.body.data.id).toBe(standardItemId);
      expect(res.body.data.name).toBe(item!.name);
    });

    it('POST /api/v1/inventory/import/preview - should validate CSV preview', async () => {
      const csv =
        `name,categoryCode,uomCode,itemType,minStockLevel,reorderLevel\n` +
        `Test CSV Item 1,CAT_${testSuffix},UOM_${testSuffix},SPARE_PART,10,20\n` +
        `Test CSV Item 2,CAT_${testSuffix},UOM_${testSuffix},CONSUMABLE,5,15`;

      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory/import/preview')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          csvData: csv,
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data.validRows).toBe(2);
      expect(res.body.data.invalidRows).toBe(0);
    });

    it('POST /api/v1/inventory/import/execute - should bulk import CSV rows', async () => {
      const rows = [
        {
          name: `Bulk Imported Part 1 ${testSuffix}`,
          categoryCode: `CAT_${testSuffix}`,
          uomCode: `UOM_${testSuffix}`,
          itemType: 'SPARE_PART',
          minStockLevel: 10,
          reorderLevel: 25,
        },
      ];

      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory/import/execute')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          rows,
        })
        .then((res) => {
          if (res.status !== 201) {
            console.error(
              'E2E ERROR RESPONSE [201]:',
              res.status,
              JSON.stringify(res.body, null, 2),
            );
          }
          expect(res.status).toBe(201);
          return res;
        });

      expect(res.body.data.successfulRows).toBe(1);
      expect(res.body.data.failedRows).toBe(0);
    });
  });
});
