import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Enterprise Vendor Management & Procurement (Phase 12 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let communityId: string;
  let storeId: string;
  let inventoryItemId: string;
  let uomId: string;
  let categoryId: string;

  let vendorAId: string;
  let vendorBId: string;
  let prId: string;
  let rfqId: string;
  let quoteAId: string;
  let _quoteBId: string;
  let awardId: string;
  let poId: string;
  let poLineId: string;
  let grnId: string;

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
    const loginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: 'admin@communityos.io',
      password: 'Admin@CommunityOS2026!',
    });

    expect(loginRes.status).toBe(200);
    adminAccessToken = loginRes.body.data.tokens.accessToken;

    // 2. Fetch seeded organization, community, inventory item, store, uom
    const org = await prisma.organization.findFirst();
    orgId = org!.id;

    const community = await prisma.community.findFirst({ where: { organizationId: orgId } });
    communityId = community!.id;

    const store = await prisma.inventoryStore.findFirst({ where: { organizationId: orgId } });
    storeId = store!.id;

    const uom = await prisma.unitOfMeasure.findFirst({ where: { organizationId: orgId } });
    uomId = uom!.id;

    const cat = await prisma.inventoryCategory.findFirst({ where: { organizationId: orgId } });
    categoryId = cat!.id;

    const item = await prisma.inventoryItem.findFirst({ where: { organizationId: orgId } });
    inventoryItemId = item!.id;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // =========================================================================
  // 1. ENTERPRISE VENDOR MANAGEMENT LIFECYCLE
  // =========================================================================
  describe('1. Enterprise Vendor Lifecycle', () => {
    it('should create a new Vendor with contacts, address, tax and capabilities', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/vendors')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          vendorCode: `VND-TEST-A-${testSuffix}`,
          legalName: `Precision Engineering Solutions Pvt Ltd ${testSuffix}`,
          displayName: `Precision Engineering ${testSuffix}`,
          vendorType: 'SUPPLIER',
          primaryEmail: `sales@precision${testSuffix}.com`,
          primaryPhone: '+91 98450 00111',
          paymentTerms: 'Net 30 Days',
          riskRating: 'LOW',
          isPreferred: true,
          contacts: [
            {
              name: 'John Sales Manager',
              designation: 'Key Account Manager',
              email: `john@precision${testSuffix}.com`,
              phone: '+91 98450 00112',
              contactType: 'SALES',
              isPrimary: true,
            },
          ],
          addresses: [
            {
              addressType: 'REGISTERED',
              addressLine1: 'Plot 100, Industrial Area',
              city: 'Bengaluru',
              state: 'Karnataka',
              postalCode: '560058',
              countryCode: 'IND',
              isPrimary: true,
            },
          ],
          taxRegistrations: [
            {
              countryCode: 'IND',
              registrationType: 'GSTIN',
              registrationNumber: `29AAAAA0000A1Z${testSuffix.slice(-1)}`,
            },
          ],
          capabilities: [
            {
              inventoryCategoryId: categoryId,
              description: 'Industrial fasteners, electrical fittings and cables',
            },
          ],
        });
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.onboardingStatus).toBe('DRAFT');
      expect(res.body.data.onboardingStatus).toBe('DRAFT');
      vendorAId = res.body.data.id;
    });

    it('should submit vendor for review and approve onboarding', async () => {
      // Submit
      const submitRes = await request(app.getHttpServer())
        .post(`/api/v1/vendors/${vendorAId}/submit`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ organizationId: orgId });

      expect(submitRes.status).toBe(201);
      expect(submitRes.body.data.onboardingStatus).toBe('UNDER_REVIEW');

      // Approve
      const approveRes = await request(app.getHttpServer())
        .post(`/api/v1/vendors/${vendorAId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ organizationId: orgId });

      expect(approveRes.status).toBe(201);
      expect(approveRes.body.data.onboardingStatus).toBe('APPROVED');
      expect(approveRes.body.data.status).toBe('ACTIVE');
    });

    it('should create and approve a second vendor for competitive bidding', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/vendors')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          vendorCode: `VND-TEST-B-${testSuffix}`,
          legalName: `Metro Industrial Traders LLP ${testSuffix}`,
          displayName: `Metro Traders ${testSuffix}`,
          vendorType: 'SUPPLIER',
          primaryEmail: `orders@metro${testSuffix}.com`,
          primaryPhone: '+91 98450 00222',
          capabilities: [{ inventoryCategoryId: categoryId }],
        });
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(201);
      vendorBId = res.body.data.id;

      await request(app.getHttpServer())
        .post(`/api/v1/vendors/${vendorBId}/submit`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ organizationId: orgId });

      await request(app.getHttpServer())
        .post(`/api/v1/vendors/${vendorBId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ organizationId: orgId });
    });

    it('should verify vendor eligibility checks', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/vendors/${vendorAId}/eligibility?organizationId=${orgId}&requiredInventoryCategoryId=${categoryId}`,
        )
        .set('Authorization', `Bearer ${adminAccessToken}`);
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(200);
      expect(res.body.data.isEligible).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');
    });

    it('should upload statutory compliance document and record rating', async () => {
      const docRes = await request(app.getHttpServer())
        .post(`/api/v1/vendors/${vendorAId}/documents`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          documentType: 'GST_CERTIFICATE',
          documentNumber: 'GST-2026-REG',
          isExpiryTracked: false,
        });

      expect(docRes.status).toBe(201);

      const ratingRes = await request(app.getHttpServer())
        .post(`/api/v1/vendors/${vendorAId}/ratings`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          ratingCategory: 'OVERALL',
          score: 5,
          reviewComments: 'Prompt response and genuine OEM supplies',
        });

      expect(ratingRes.status).toBe(201);
      expect(ratingRes.body.data.score).toBe(5);
    });
  });

  // =========================================================================
  // 2. PURCHASE REQUISITION (PR) & DEMAND CAPTURE
  // =========================================================================
  describe('2. Purchase Requisition Lifecycle', () => {
    it('should create a Purchase Requisition with multiple line items', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/procurement/requisitions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          title: `Quarterly Consumables PR ${testSuffix}`,
          description: 'Replenishment for electrical and maintenance stock',
          requestType: 'GOODS',
          priority: 'NORMAL',
          requestingDepartment: 'Facilities',
          targetStoreId: storeId,
          lines: [
            {
              lineType: 'CATALOG_ITEM',
              inventoryItemId,
              description: 'Industrial LED Bulb 9W Cool White',
              quantity: 50,
              uomId,
              estimatedUnitPrice: 500,
            },
          ],
        });
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.requisitionNumber).toMatch(/^PR-/);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.estimatedTotalAmount).toBe(25000);
      prId = res.body.data.id;
    });

    it('should submit and approve Purchase Requisition', async () => {
      const submitRes = await request(app.getHttpServer())
        .post(`/api/v1/procurement/requisitions/${prId}/submit`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ organizationId: orgId });

      expect(submitRes.status).toBe(201);
      expect(submitRes.body.data.status).toBe('SUBMITTED');

      const approveRes = await request(app.getHttpServer())
        .post(`/api/v1/procurement/requisitions/${prId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ organizationId: orgId });

      expect(approveRes.status).toBe(201);
      expect(approveRes.body.data.status).toBe('APPROVED');
    });

    it('should convert inventory reorder shortage suggestions into a Requisition', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/procurement/requisitions/from-reorder-suggestions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          itemIds: [inventoryItemId],
        });
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(201);
      expect(res.body.data.sourceType).toBe('INVENTORY_REORDER');
      expect(res.body.data.lines.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 3. REQUEST FOR QUOTATION (RFQ) & SOURCING
  // =========================================================================
  describe('3. RFQ & Competitive Sourcing', () => {
    it('should create and publish an RFQ inviting multiple eligible vendors', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/procurement/rfqs')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          title: `Competitive Bidding for Maintenance Supplies ${testSuffix}`,
          description: 'Sourcing against approved PR',
          currency: 'INR',
          submissionDeadline: new Date(Date.now() + 5 * 86400000).toISOString(),
          minimumQuotationsRequired: 2,
          vendorIds: [vendorAId, vendorBId],
          lines: [
            {
              lineType: 'CATALOG_ITEM',
              inventoryItemId,
              description: 'Industrial LED Bulb 9W Cool White',
              quantity: 50,
              uomId,
            },
          ],
        });
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(201);
      expect(res.body.data.rfqNumber).toMatch(/^RFQ-/);
      expect(res.body.data.status).toBe('PUBLISHED');
      rfqId = res.body.data.id;
    });

    it('should allow extending the RFQ deadline', async () => {
      const newDeadline = new Date(Date.now() + 10 * 86400000).toISOString();
      const res = await request(app.getHttpServer())
        .post(`/api/v1/procurement/rfqs/${rfqId}/extend`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          newDeadline,
          reason: 'Vendor request for technical review period extension',
        });
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(201);
    });
  });

  // =========================================================================
  // 4. QUOTATION SUBMISSION & COMPARISON MATRIX
  // =========================================================================
  describe('4. Quotations & Comparison Matrix', () => {
    it('should record Quotation from Vendor A with discounts, taxes, and freight', async () => {
      const rfqRes = await request(app.getHttpServer())
        .get(`/api/v1/procurement/rfqs/${rfqId}?organizationId=${orgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const rfqLineId = rfqRes.body.data.lines[0].id;

      const res = await request(app.getHttpServer())
        .post('/api/v1/procurement/quotations')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          rfqId,
          vendorId: vendorAId,
          vendorReferenceNumber: `QT-APEX-${testSuffix}`,
          deliveryLeadTimeDays: 2,
          paymentTerms: 'Net 30 Days',
          warrantyTerms: '1 Year Replacement Warranty',
          lines: [
            {
              rfqLineId,
              description: 'Industrial LED Bulb 9W Cool White',
              offeredQuantity: 50,
              uomId,
              unitPrice: 420,
              discountAmount: 1000,
              taxRate: 18,
              freightAmount: 500,
              brandName: 'Philips',
              modelNumber: 'RC380B',
            },
          ],
        });
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.subtotal).toBe(21000); // 50 * 420
      quoteAId = res.body.data.id;
    });

    it('should record Quotation from Vendor B', async () => {
      const rfqRes = await request(app.getHttpServer())
        .get(`/api/v1/procurement/rfqs/${rfqId}?organizationId=${orgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const rfqLineId = rfqRes.body.data.lines[0].id;

      const res = await request(app.getHttpServer())
        .post('/api/v1/procurement/quotations')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          rfqId,
          vendorId: vendorBId,
          vendorReferenceNumber: `QT-METRO-${testSuffix}`,
          deliveryLeadTimeDays: 5,
          lines: [
            {
              rfqLineId,
              description: 'Industrial LED Bulb 9W Cool White',
              offeredQuantity: 50,
              uomId,
              unitPrice: 480,
              discountAmount: 500,
              taxRate: 18,
              freightAmount: 800,
            },
          ],
        });
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(201);
      _quoteBId = res.body.data.id;
    });

    it('should evaluate technical compliance for quotations', async () => {
      const qRes = await request(app.getHttpServer())
        .get(`/api/v1/procurement/quotations/${quoteAId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const qLineId = qRes.body.data.lines[0].id;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/procurement/quotations/${quoteAId}/evaluate`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          technicalComplianceScore: 100,
          evaluationNotes: 'Fully compliant with lumen and wattage specifications',
          lines: [
            {
              quotationLineId: qLineId,
              technicalCompliance: 'COMPLIANT',
              complianceNotes: 'Datasheet verified',
            },
          ],
        });
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('UNDER_EVALUATION');
    });

    it('should generate normalized quotation comparison matrix with ranking', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/procurement/quotations/compare/${rfqId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(200);
      expect(res.body.data.summary.length).toBe(2);
      expect(res.body.data.summary[0].isLowestCommercial).toBe(true);
      expect(res.body.data.summary[0].vendorId).toBe(vendorAId);
    });
  });

  // =========================================================================
  // 5. SOURCING AWARD & PURCHASE ORDER CREATION
  // =========================================================================
  describe('5. Sourcing Award & PO Issuance', () => {
    it('should recommend and approve a Sourcing Award', async () => {
      const rfqRes = await request(app.getHttpServer())
        .get(`/api/v1/procurement/rfqs/${rfqId}?organizationId=${orgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const qRes = await request(app.getHttpServer())
        .get(`/api/v1/procurement/quotations/${quoteAId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const rfqLineId = rfqRes.body.data.lines[0].id;
      const qLineId = qRes.body.data.lines[0].id;

      const recRes = await request(app.getHttpServer())
        .post('/api/v1/procurement/awards')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          rfqId,
          selectedVendorId: vendorAId,
          isLowestPriceSelected: true,
          recommendationReason: 'Lowest evaluated commercial price with 100% technical compliance',
          lines: [
            {
              rfqLineId,
              quotationId: quoteAId,
              quotationLineId: qLineId,
              vendorId: vendorAId,
              awardedQuantity: 50,
              uomId,
              unitPrice: 420,
            },
          ],
        });

      expect(recRes.status).toBe(201);
      expect(recRes.body.data.awardNumber).toMatch(/^AWD-/);
      expect(recRes.body.data.status).toBe('RECOMMENDED');
      awardId = recRes.body.data.id;

      const appRes = await request(app.getHttpServer())
        .post(`/api/v1/procurement/awards/${awardId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(appRes.status).toBe(201);
      expect(appRes.body.data.status).toBe('APPROVED');
    });

    it('should generate Purchase Order from approved award and issue to vendor', async () => {
      const genRes = await request(app.getHttpServer())
        .post(`/api/v1/procurement/orders/from-award/${awardId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(genRes.status).toBe(201);
      expect(genRes.body.data.length).toBe(1);
      expect(genRes.body.data[0].poNumber).toMatch(/^PO-/);
      poId = genRes.body.data[0].id;
      poLineId = genRes.body.data[0].lines[0].id;

      // Approve PO
      await request(app.getHttpServer())
        .post(`/api/v1/procurement/orders/${poId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      // Issue PO
      const issueRes = await request(app.getHttpServer())
        .post(`/api/v1/procurement/orders/${poId}/issue`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(issueRes.status).toBe(201);
      expect(issueRes.body.data.status).toBe('ISSUED');

      // Acknowledge PO
      const ackRes = await request(app.getHttpServer())
        .post(`/api/v1/procurement/orders/${poId}/acknowledge`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          status: 'ACCEPTED',
          notes: 'Accepted. Delivery scheduled within 48 hours.',
        });

      expect(ackRes.status).toBe(201);
      expect(ackRes.body.data.vendorAcknowledgementStatus).toBe('ACCEPTED');
    });
  });

  // =========================================================================
  // 6. GOODS RECEIPT NOTE (GRN), INSPECTION & INVENTORY POSTING
  // =========================================================================
  describe('6. Goods Receipt Note & Inventory Stock Inwarding', () => {
    it('should block over-receipt exceeding ordered remaining quantity', async () => {
      const overRes = await request(app.getHttpServer())
        .post('/api/v1/procurement/receipts')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          purchaseOrderId: poId,
          storeId,
          deliveryChallanNumber: `DC-${testSuffix}`,
          lines: [
            {
              poLineId,
              deliveredQty: 100, // Ordered was 50
              uomId,
            },
          ],
        });

      expect(overRes.status).toBe(400);
      expect(overRes.body.error?.message || overRes.body.message).toContain('Over-receipt blocked');
    });

    it('should create GRN for delivered quantity', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/procurement/receipts')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          purchaseOrderId: poId,
          storeId,
          deliveryChallanNumber: `DC-${testSuffix}`,
          vendorInvoiceReference: `INV-APEX-${testSuffix}`,
          lines: [
            {
              poLineId,
              deliveredQty: 50,
              uomId,
              batchNumber: `BATCH-${testSuffix}`,
            },
          ],
        });
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(201);
      expect(res.body.data.grnNumber).toMatch(/^GRN-/);
      expect(res.body.data.status).toBe('RECEIVED');
      expect(res.body.data.inspectionStatus).toBe('PENDING');
      grnId = res.body.data.id;
    });

    it('should record GRN quality inspection and accept materials', async () => {
      const grnRes = await request(app.getHttpServer())
        .get(`/api/v1/procurement/receipts/${grnId}?organizationId=${orgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const grnLineId = grnRes.body.data.lines[0].id;

      const inspRes = await request(app.getHttpServer())
        .post(`/api/v1/procurement/receipts/${grnId}/inspect`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          inspectionStatus: 'PASSED',
          comments: 'All 50 units inspected, zero defects found',
          lines: [
            {
              grnLineId,
              acceptedQty: 50,
              rejectedQty: 0,
            },
          ],
        });

      expect(inspRes.status).toBe(201);
      expect(inspRes.body.data.inspectionStatus).toBe('PASSED');
      expect(inspRes.body.data.status).toBe('ACCEPTED');
    });

    it('should post GRN to Phase 11 Inventory stock, updating PO status and creating StockLedger entries', async () => {
      const postRes = await request(app.getHttpServer())
        .post(`/api/v1/procurement/receipts/${grnId}/post`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(postRes.status).toBe(201);
      expect(postRes.body.data.status).toBe('POSTED');
      expect(postRes.body.data.inventoryReceiptId).toBeDefined();

      // Verify PO status updated to FULLY_RECEIVED
      const poCheck = await request(app.getHttpServer())
        .get(`/api/v1/procurement/orders/${poId}?organizationId=${orgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(poCheck.body.data.status).toBe('FULLY_RECEIVED');
      expect(poCheck.body.data.lines[0].receivedQty).toBe(50);
      expect(poCheck.body.data.lines[0].remainingQty).toBe(0);
    });
  });

  // =========================================================================
  // 7. VENDOR SCORECARDS & ANALYTICS
  // =========================================================================
  describe('7. Vendor Performance & Analytics', () => {
    it('should calculate deterministic scorecard metrics for vendor', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/vendors/${vendorAId}/scorecard`)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(200);
      expect(res.body.data.calculatedScore).toBeDefined();
      expect(Number(res.body.data.fulfillmentRate)).toBe(100);
      expect(Number(res.body.data.qualityAcceptanceRate)).toBe(100);
    });

    it('should retrieve procurement operational KPIs', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/procurement/analytics/kpis?organizationId=${orgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      if (res.status >= 400) {
        console.error(
          'API ERROR RESPONSE [' + res.status + ']:',
          JSON.stringify(res.body, null, 2),
        );
      }

      expect(res.status).toBe(200);
      expect(res.body.data.openRequisitions).toBeDefined();
      expect(res.body.data.openPurchaseOrders).toBeDefined();
      expect(res.body.data.totalCommittedSpend).toBeGreaterThanOrEqual(0);
    });
  });
});
