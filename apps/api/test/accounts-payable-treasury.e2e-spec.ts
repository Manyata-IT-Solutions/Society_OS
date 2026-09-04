jest.setTimeout(45000);

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Enterprise Accounts Payable & Treasury Operations (Phase 15 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let communityId: string;
  let accountingEntityId: string;
  let vendorId: string;
  let vendorAccountId: string;
  let poId: string;
  let poLineId: string;
  let bankAccountId: string;
  let matchedInvoiceId: string;
  let exceptionInvoiceId: string;

  let advanceId: string;
  let proposalId: string;
  let paymentRunId: string;
  let singlePaymentId: string;
  let bankStatementId: string;

  let reconSessionId: string;

  const testSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    jest.setTimeout(45000);
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

    // 2. Fetch seeded organization, community & accounting entity
    const community = await prisma.community.findFirst();
    communityId = community!.id;
    orgId = community!.organizationId;

    const entity = await prisma.accountingEntity.findFirst({ where: { organizationId: orgId } });
    accountingEntityId = entity!.id;

    // 3. Fetch or create test vendor
    let vendor = await prisma.vendor.findFirst({ where: { organizationId: orgId } });
    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          organization: { connect: { id: orgId } },
          vendorCode: `VEND-${testSuffix}`,
          legalName: 'Apex Maintenance Services Ltd',
          tradeName: 'Apex Services',
          status: 'APPROVED',
        },
      });
    }
    vendorId = vendor!.id;

    // 4. Create Store, PO with lines and posted GRN for 3-way matching
    let store = await prisma.inventoryStore.findFirst({ where: { organizationId: orgId } });
    if (!store) {
      store = await prisma.inventoryStore.create({
        data: {
          organization: { connect: { id: orgId } },
          community: { connect: { id: communityId } },
          storeCode: `MAIN-STORE-${testSuffix}`,
          name: 'Main Facilities Store',
          status: 'ACTIVE',
        },
      });
    }

    const po = await prisma.purchaseOrder.create({
      data: {
        organization: { connect: { id: orgId } },
        community: { connect: { id: communityId } },
        vendor: { connect: { id: vendorId } },
        poNumber: `PO-APTEST-${testSuffix}`,
        poType: 'GOODS',
        currency: 'INR',
        subtotal: 50000,
        taxTotal: 0,
        grandTotal: 50000,
        status: 'ISSUED',
        lines: {
          create: [
            {
              lineNumber: 1,
              description: 'Elevator Motor 15HP',
              orderedQty: 2,
              unitPrice: 25000,
              lineTotal: 50000,
            },
          ],
        },
      },
      include: { lines: true },
    });
    poId = po.id;
    poLineId = po.lines[0].id;

    // Create posted GRN accepting 2 units
    await prisma.goodsReceiptNote.create({
      data: {
        organization: { connect: { id: orgId } },
        community: { connect: { id: communityId } },
        purchaseOrder: { connect: { id: poId } },
        vendor: { connect: { id: vendorId } },
        store: { connect: { id: store.id } },
        grnNumber: `GRN-APTEST-${testSuffix}`,
        status: 'POSTED',
        lines: {
          create: [
            {
              lineNumber: 1,
              poLine: { connect: { id: poLineId } },
              deliveredQty: 2,
              acceptedQty: 2,
              rejectedQty: 0,
            },
          ],
        },
      },
    });

    // 5. Fetch or create Bank Account
    let bAcc = await prisma.bankAccount.findFirst({ where: { accountingEntityId } });
    if (!bAcc) {
      const bankGl = await prisma.ledgerAccount.findFirst({
        where: { accountingEntityId, accountCode: '1120' },
      });
      bAcc = await prisma.bankAccount.create({
        data: {
          accountingEntity: { connect: { id: accountingEntityId } },
          glAccount: { connect: { id: bankGl!.id } },
          name: 'Primary Operating Account',
          bankName: 'HDFC Bank',
          accountType: 'CURRENT',
          currency: 'INR',
          maskedAccountNumber: 'XXXXXXXXXX9988',
          status: 'ACTIVE',
        },
      });
    }
    bankAccountId = bAcc.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Vendor Financial Accounts & Payment Terms Setup', () => {
    it('1.1 should create or fetch vendor financial account', async () => {
      let vAcc = await prisma.vendorAccount.findUnique({
        where: { accountingEntityId_vendorId: { accountingEntityId, vendorId } },
      });
      if (!vAcc) {
        vAcc = await prisma.vendorAccount.create({
          data: {
            organization: { connect: { id: orgId } },
            accountingEntity: { connect: { id: accountingEntityId } },
            vendor: { connect: { id: vendorId } },
            accountNumber: `VACC-${testSuffix}`,
            currency: 'INR',
            status: 'ACTIVE',
          },
        });
      }
      vendorAccountId = vAcc.id;
      expect(vendorAccountId).toBeDefined();
    });

    it('1.2 should create payment terms via API', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ap/payment-terms')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          code: `NET_45_${testSuffix}`,
          name: 'Net 45 Days',
          days: 45,
          calculationRule: 'FROM_INVOICE_DATE',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.code).toContain('NET_45');
    });
  });

  describe('2. Supplier Invoice Creation & 2/3-Way Matching Engine', () => {
    it('2.1 should create a PO-backed supplier invoice and prevent exact duplicate', async () => {
      const invoicePayload = {
        organizationId: orgId,
        accountingEntityId,
        communityId,
        vendorId,
        purchaseOrderId: poId,
        supplierInvoiceNumber: `INV-PO-${testSuffix}`,
        invoiceDate: '2026-04-15',
        currency: 'INR',
        invoiceType: 'PO_GOODS',
        lines: [
          {
            poLineId,
            description: 'Elevator Motor 15HP',
            quantity: 2,
            unitPrice: 25000,
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/ap/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(invoicePayload);

      expect(res.status).toBe(201);
      expect(res.body.data.internalInvoiceNumber).toBeDefined();
      expect(Number(res.body.data.grandTotal)).toBe(50000);
      matchedInvoiceId = res.body.data.id;

      // Duplicate detection check
      const dupRes = await request(app.getHttpServer())
        .post('/api/v1/ap/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(invoicePayload);

      expect(dupRes.status).toBe(409);
    });

    it('2.2 should successfully match 3-way invoice against PO and GRN', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ap/invoices/${matchedInvoiceId}/match`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.matchingStatus).toBe('MATCHED');
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('2.3 should create invoice with price variance and trigger MATCH EXCEPTION', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ap/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          accountingEntityId,
          communityId,
          vendorId,
          purchaseOrderId: poId,
          supplierInvoiceNumber: `INV-EXC-${testSuffix}`,
          invoiceDate: '2026-04-16',
          currency: 'INR',
          invoiceType: 'PO_GOODS',
          lines: [
            {
              poLineId,
              description: 'Elevator Motor 15HP Overpriced',
              quantity: 2,
              unitPrice: 28000, // exceeds PO unit price ₹25000
            },
          ],
        });

      expect(res.status).toBe(201);
      exceptionInvoiceId = res.body.data.id;

      const matchRes = await request(app.getHttpServer())
        .post(`/api/v1/ap/invoices/${exceptionInvoiceId}/match`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(matchRes.status).toBe(200);
      expect(matchRes.body.data.matchingStatus).toBe('EXCEPTION');
      expect(matchRes.body.data.matchExceptions.length).toBeGreaterThan(0);
    });

    it('2.4 should resolve match exception with managerial override', async () => {
      const invWithExceptions = await prisma.supplierInvoice.findUnique({
        where: { id: exceptionInvoiceId },
        include: { matchExceptions: true },
      });

      for (const exc of invWithExceptions?.matchExceptions || []) {
        const res = await request(app.getHttpServer())
          .post(`/api/v1/ap/exceptions/${exc.id}/resolve`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({
            resolutionType: 'APPROVE_VARIANCE',
            resolutionReason: 'Approved special freight and emergency replacement surcharge',
          });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('RESOLVED');
      }

      // Check invoice status updated to APPROVED
      const inv = await prisma.supplierInvoice.findUnique({ where: { id: exceptionInvoiceId } });
      expect(inv?.status).toBe('APPROVED');
      expect(inv?.matchingStatus).toBe('OVERRIDDEN');
    });
  });

  describe('3. Payment Hold & General Ledger Posting', () => {
    it('3.1 should apply and remove payment hold on an invoice', async () => {
      const holdRes = await request(app.getHttpServer())
        .post(`/api/v1/ap/invoices/${matchedInvoiceId}/hold`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ hold: true, reason: 'QUALITY_ISSUE', notes: 'Testing motor RPM' });

      expect(holdRes.status).toBe(200);
      expect(holdRes.body.data.isOnHold).toBe(true);

      const unholdRes = await request(app.getHttpServer())
        .post(`/api/v1/ap/invoices/${matchedInvoiceId}/hold`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ hold: false });

      expect(unholdRes.status).toBe(200);
      expect(unholdRes.body.data.isOnHold).toBe(false);
    });

    it('3.2 should post supplier invoice to General Ledger & Vendor Subledger', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ap/invoices/${matchedInvoiceId}/post`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('POSTED');
      expect(res.body.data.postingJournalId).toBeDefined();

      // Verify vendor subledger entry created
      const postedInvoice = await prisma.supplierInvoice.findUnique({
        where: { id: matchedInvoiceId },
      });
      const ledgerEntry = await prisma.vendorLedgerEntry.findFirst({
        where: {
          vendorAccountId,
          referenceType: 'SUPPLIER_INVOICE',
          referenceId: postedInvoice!.internalInvoiceNumber,
        },
      });
      expect(ledgerEntry).toBeDefined();
      expect(Number(ledgerEntry!.credit)).toBe(50000);
    });
  });

  describe('4. Supplier Credit Notes & Vendor Advances', () => {
    it('4.1 should create a supplier credit note and allocate against invoice', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ap/credit-notes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          accountingEntityId,
          vendorId,
          supplierInvoiceId: matchedInvoiceId,
          vendorCreditReference: `CR-APEX-${testSuffix}`,
          creditNoteDate: '2026-04-18',
          amount: 5000,
          reason: 'Volume discount rebate',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.creditNoteNumber).toBeDefined();

      // Verify invoice outstanding decreased to ₹45,000
      const inv = await prisma.supplierInvoice.findUnique({ where: { id: matchedInvoiceId } });
      expect(Number(inv?.outstandingAmount)).toBe(45000);
    });

    it('4.2 should create vendor advance and allocate against invoice', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ap/advances')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          accountingEntityId,
          communityId,
          vendorId,
          bankAccountId,
          amount: 10000,
          paymentDate: '2026-04-19',
          paymentMethod: 'BANK_TRANSFER',
          referenceNumber: `ADV-REF-${testSuffix}`,
          notes: 'Mobilization advance for Q2 contracts',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.advanceNumber).toBeDefined();
      advanceId = res.body.data.id;

      // Allocate ₹5,000 advance against matched invoice
      const allocRes = await request(app.getHttpServer())
        .post(`/api/v1/ap/advances/${advanceId}/allocate`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          supplierInvoiceId: matchedInvoiceId,
          amount: 5000,
        });

      expect(allocRes.status).toBe(200);

      // Verify invoice outstanding decreased to ₹40,000
      const inv = await prisma.supplierInvoice.findUnique({ where: { id: matchedInvoiceId } });
      expect(Number(inv?.outstandingAmount)).toBe(40000);
    });
  });

  describe('5. AP Aging & Payment Proposals', () => {
    it('5.1 should compute AP Aging Matrix accurately', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/ap/aging?accountingEntityId=${accountingEntityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalPayable).toBeGreaterThan(0);
      expect(res.body.data.vendorCount).toBeGreaterThan(0);
    });

    it('5.2 should generate payment proposal for due invoices', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ap/payment-proposals')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          accountingEntityId,
          bankAccountId,
          dueThroughDate: '2026-06-30',
          paymentMethod: 'BANK_TRANSFER',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.proposalNumber).toBeDefined();
      expect(res.body.data.lines.length).toBeGreaterThan(0);
      proposalId = res.body.data.id;
    });

    it('5.3 should create and execute payment run from proposal', async () => {
      const createRunRes = await request(app.getHttpServer())
        .post('/api/v1/ap/payment-runs')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ proposalId });

      expect(createRunRes.status).toBe(201);
      expect(createRunRes.body.data.paymentRunNumber).toBeDefined();
      paymentRunId = createRunRes.body.data.id;

      const execRunRes = await request(app.getHttpServer())
        .post(`/api/v1/ap/payment-runs/${paymentRunId}/execute`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(execRunRes.status).toBe(200);
      expect(execRunRes.body.data.status).toBe('COMPLETED');
    });
  });

  describe('6. Direct Vendor Payments, Remittance & Reversals', () => {
    it('6.1 should record single vendor payment with FIFO invoice allocation and remittance advice', async () => {
      // Create a fresh invoice to pay
      const inv = await prisma.supplierInvoice.create({
        data: {
          organization: { connect: { id: orgId } },
          accountingEntity: { connect: { id: accountingEntityId } },
          vendor: { connect: { id: vendorId } },
          vendorAccount: { connect: { id: vendorAccountId } },
          supplierInvoiceNumber: `INV-PAYTEST-${testSuffix}`,
          normalizedInvoiceNumber: `INVPAYTEST${testSuffix}`,
          internalInvoiceNumber: `APINV-TEMP-${testSuffix}`,
          invoiceDate: new Date('2026-04-20'),
          dueDate: new Date('2026-05-20'),
          status: 'POSTED',
          matchingStatus: 'MATCHED',
          grandTotal: 15000,
          paidAmount: 0,
          outstandingAmount: 15000,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/ap/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          accountingEntityId,
          vendorAccountId,
          bankAccountId,
          amount: 15000,
          paymentDate: '2026-04-20',
          paymentMethod: 'BANK_TRANSFER',
          referenceNumber: `TXN-VPAY-${testSuffix}`,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.paymentNumber).toBeDefined();
      expect(res.body.data.remittanceDocId).toBeDefined();
      singlePaymentId = res.body.data.id;

      const updatedInv = await prisma.supplierInvoice.findUnique({ where: { id: inv.id } });
      expect(updatedInv?.status).toBe('PAID');
      expect(Number(updatedInv?.outstandingAmount)).toBe(0);
    });

    it('6.2 should reverse payment and restore invoice liability', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ap/payments/${singlePaymentId}/reverse`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Bank transaction bounced / wrong beneficiary IFSC' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REVERSED');

      // Verify subledger has reversal entry
      const reversalEntry = await prisma.vendorLedgerEntry.findFirst({
        where: { vendorAccountId, entryType: 'PAYMENT_REVERSAL' },
      });
      expect(reversalEntry).toBeDefined();
    });
  });

  describe('7. Bank Management, Statement Import & Fingerprint Deduplication', () => {
    it('7.1 should create a masked bank account', async () => {
      const bankGl = await prisma.ledgerAccount.findFirst({
        where: { accountingEntityId, accountCode: '1120' },
      });
      const last4 = Math.floor(1000 + Math.random() * 9000).toString();
      const res = await request(app.getHttpServer())
        .post('/api/v1/treasury/accounts')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId,
          glAccountId: bankGl!.id,
          name: 'Axis Escrow Account',
          bankName: 'Axis Bank',
          accountNumber: `9180200384${last4}`,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.maskedAccountNumber).toContain(last4);
    });

    it('7.2 should import bank statement and deduplicate repeated rows via SHA-256 fingerprint', async () => {
      const statementPayload = {
        bankAccountId,
        statementReference: `STMT-APR-${testSuffix}`,
        periodStart: '2026-04-01',
        periodEnd: '2026-04-30',
        openingBalance: 1000000,
        closingBalance: 1030000,
        transactions: [
          {
            transactionDate: '2026-04-10',
            description: 'NEFT Pmt to Apex Maintenance',
            bankReference: `NEFT-APEX-${testSuffix}`,
            amount: 50000,
            direction: 'DEBIT',
          },
          {
            transactionDate: '2026-04-12',
            description: 'UPI Maintenance Inflow Unit 101',
            bankReference: `UPI-IN-${testSuffix}`,
            amount: 3500,
            direction: 'CREDIT',
          },
          {
            transactionDate: '2026-04-15',
            description: 'Monthly Ledger Folio Charges',
            bankReference: `CHG-BNK-${testSuffix}`,
            amount: 250,
            direction: 'DEBIT',
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/treasury/statements/import')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(statementPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.importedCount).toBe(3);
      expect(res.body.data.duplicateCount).toBe(0);
      bankStatementId = res.body.data.statement.id;

      // Re-importing same statement should detect 3 duplicates
      const dupImportRes = await request(app.getHttpServer())
        .post('/api/v1/treasury/statements/import')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(statementPayload);

      expect(dupImportRes.status).toBe(201);
      expect(dupImportRes.body.data.importedCount).toBe(0);
      expect(dupImportRes.body.data.duplicateCount).toBe(3);

      const txns = await prisma.bankTransaction.findMany({ where: { bankStatementId } });
      expect(txns.length).toBe(3);
    });
  });

  describe('8. Bank Reconciliation Workspace, Matching & Bank Fees', () => {
    it('8.1 should create bank reconciliation session', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/treasury/reconciliation/sessions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          bankAccountId,
          statementId: bankStatementId,
          periodStart: '2026-04-01',
          periodEnd: '2026-04-30',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.sessionNumber).toBeDefined();
      reconSessionId = res.body.data.id;
    });

    it('8.2 should execute automated bank matching against AP payments and Resident AR receipts', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/treasury/reconciliation/sessions/${reconSessionId}/auto-match`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('8.3 should post bank fee directly to GL and match transaction', async () => {
      const expenseAcc = await prisma.ledgerAccount.findFirst({
        where: { accountingEntityId, accountType: 'EXPENSE', postingAllowed: true },
      });
      const unattachedDebit = await prisma.bankTransaction.findFirst({
        where: { bankStatementId, status: 'UNMATCHED', direction: 'DEBIT' },
      });

      if (unattachedDebit && expenseAcc) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/treasury/reconciliation/bank-fee')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({
            sessionId: reconSessionId,
            bankTransactionId: unattachedDebit.id,
            expenseAccountId: expenseAcc.id,
            description: 'Monthly Bank Account Service Fee',
          });

        expect(res.status).toBe(200);
        expect(res.body.data.matchType).toBe('MANUAL');
      }
    });

    it('8.4 should complete and reopen reconciliation session', async () => {
      const completeRes = await request(app.getHttpServer())
        .post(`/api/v1/treasury/reconciliation/sessions/${reconSessionId}/complete`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ allowDifferenceOverride: true, overrideReason: 'Approved month-end sign-off' });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.status).toBe('COMPLETED');

      const reopenRes = await request(app.getHttpServer())
        .post(`/api/v1/treasury/reconciliation/sessions/${reconSessionId}/reopen`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Audit review adjustments required' });

      expect(reopenRes.status).toBe(200);
      expect(reopenRes.body.data.status).toBe('REOPENED');
    });

    it('8.5 should fetch Treasury dashboard cash position and unreconciled counts', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/treasury/dashboard?accountingEntityId=${accountingEntityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bankAccounts.length).toBeGreaterThan(0);
    });
  });
});
