import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPerfProfileA() {
  console.log('🚀 [PERF SEED] Initializing isolated Performance Profile A (600 Units)...');
  const startTime = Date.now();

  const suffix = Date.now().toString().slice(-5);
  const orgSlug = `perf-org-600-${suffix}`;
  const commSlug = `perf-comm-600-${suffix}`;

  // 1. Organization & Community
  const org = await prisma.organization.create({
    data: {
      name: 'Benchmark Enterprise Org (600 Units)',
      slug: orgSlug,
      defaultCurrency: 'INR',
      defaultTimezone: 'Asia/Kolkata',
      status: 'ACTIVE',
    },
  });

  const comm = await prisma.community.create({
    data: {
      organizationId: org.id,
      name: 'Benchmark Heights (Profile A)',
      code: `PERF-600-${suffix}`,
      slug: commSlug,
      status: 'ACTIVE',
      addressLine1: '600 Benchmark Blvd',
      city: 'Bengaluru',
      postalCode: '560001',
      countryCode: 'IN',
    },
  });

  // 2. Accounting Entity, Fiscal Calendar, Fiscal Year & Periods
  const entity = await prisma.accountingEntity.create({
    data: {
      organizationId: org.id,
      communityId: comm.id,
      code: `ENT-PERF-${suffix}`,
      name: 'Benchmark Heights Housing Society Entity',
      legalName: 'Benchmark Heights Welfare Society',
      countryCode: 'IND',
      baseCurrency: 'INR',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
    },
  });

  const calendar = await prisma.fiscalCalendar.create({
    data: {
      accountingEntityId: entity.id,
      name: 'FY 2026-27 Performance Calendar',
      fiscalStartMonth: 4,
      fiscalStartDay: 1,
      isDefault: true,
    },
  });

  const fiscalYear = await prisma.fiscalYear.create({
    data: {
      accountingEntityId: entity.id,
      fiscalCalendarId: calendar.id,
      name: `FY 2026-27-${suffix}`,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: 'OPEN',
    },
  });

  const period = await prisma.accountingPeriod.create({
    data: {
      fiscalYearId: fiscalYear.id,
      periodNumber: 1,
      name: 'April 2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      status: 'OPEN',
    },
  });

  // 3. Ledger Accounts
  const cashAcc = await prisma.ledgerAccount.create({
    data: {
      accountingEntityId: entity.id,
      accountCode: `1110-PERF-${suffix}`,
      name: 'Primary Operating Bank Account',
      accountType: 'ASSET',
      accountSubType: 'BANK',
      normalBalance: 'DEBIT',
      status: 'ACTIVE',
    },
  });

  const revAcc = await prisma.ledgerAccount.create({
    data: {
      accountingEntityId: entity.id,
      accountCode: `4100-PERF-${suffix}`,
      name: 'Monthly Resident Maintenance Charges',
      accountType: 'INCOME',
      accountSubType: 'MAINTENANCE_INCOME',
      normalBalance: 'CREDIT',
      status: 'ACTIVE',
    },
  });

  // 4. Batch 600 Units & Billable Accounts
  console.log('   📦 Creating 600 Units and Billable Accounts...');
  const unitData: any[] = [];
  for (let i = 1; i <= 600; i++) {
    const tower = String.fromCharCode(65 + Math.floor((i - 1) / 100)); // Tower A to F
    const floor = Math.floor(((i - 1) % 100) / 4) + 1;
    const num = ((i - 1) % 4) + 1;
    const unitNo = `${tower}-${floor}0${num}`;
    unitData.push({
      organizationId: org.id,
      communityId: comm.id,
      unitNumber: unitNo,
      displayName: `Unit ${unitNo}`,
      unitType: 'APARTMENT',
      status: 'ACTIVE',
      carpetArea: 1250,
      builtUpArea: 1550,
    });
  }
  await prisma.unit.createMany({ data: unitData });

  const allUnits = await prisma.unit.findMany({
    where: { communityId: comm.id },
    select: { id: true, unitNumber: true },
  });

  const baData = allUnits.map((u) => ({
    organizationId: org.id,
    communityId: comm.id,
    unitId: u.id,
    accountNumber: `BA-PERF-${u.unitNumber}-${suffix}`,
    accountType: 'UNIT' as any,
    displayName: `Billable Account ${u.unitNumber}`,
    status: 'ACTIVE' as any,
  }));
  await prisma.billableAccount.createMany({ data: baData });

  const allBAs = await prisma.billableAccount.findMany({
    where: { communityId: comm.id },
    select: { id: true, unitId: true, accountNumber: true },
  });

  // 5. Batch 1,500 Residents
  console.log('   👥 Creating 1,500 Residents...');
  const residentData: any[] = [];
  for (let i = 1; i <= 1500; i++) {
    residentData.push({
      organizationId: org.id,
      communityId: comm.id,
      firstName: `PerfResident${i}`,
      lastName: `Bench${(i % 10) + 1}`,
      email: `perf.resident${i}-${suffix}@benchmark.local`,
      phone: `+9198${String(i).padStart(8, '0')}`,
      status: 'ACTIVE' as any,
    });
  }
  await prisma.resident.createMany({ data: residentData });

  // 6. Billing Periods & 2,400 Invoices (4 months for 600 units)
  console.log('   📜 Generating Billing Periods & 2,400 Invoices...');
  const invData: any[] = [];
  for (let m = 1; m <= 4; m++) {
    const pCode = `2026-0${m}-PERF-${suffix}`;
    const bp = await prisma.billingPeriod.create({
      data: {
        communityId: comm.id,
        code: pCode,
        name: `Month ${m} Benchmark Billing`,
        startDate: new Date(2026, m - 1, 1),
        endDate: new Date(2026, m - 1, 28),
        invoiceDate: new Date(2026, m - 1, 1),
        dueDate: new Date(2026, m - 1, 15),
        graceDate: new Date(2026, m - 1, 20),
        status: m < 4 ? 'CLOSED' : 'OPEN',
      } as any,
    });

    for (let u = 0; u < allUnits.length; u++) {
      const unit = allUnits[u]!;
      const ba = allBAs[u]!;
      invData.push({
        organizationId: org.id,
        communityId: comm.id,
        billableAccountId: ba.id,
        billingPeriodId: bp.id,
        invoiceNumber: `INV-PERF-M${m}-${unit.unitNumber}-${suffix}`,
        subtotal: 5000,
        grandTotal: 5900,
        allocatedAmount: 5900,
        outstandingAmount: 0,
        status: 'PAID' as any,
        invoiceDate: new Date(2026, m - 1, 1),
        dueDate: new Date(2026, m - 1, 15),
      });
    }
  }
  await prisma.invoice.createMany({ data: invData });

  // 7. Balanced General Ledger Postings
  await prisma.journalEntry.create({
    data: {
      accountingEntityId: entity.id,
      fiscalYearId: fiscalYear.id,
      accountingPeriodId: period.id,
      journalNumber: `JRN-PERF-${suffix}`,
      journalDate: new Date('2026-04-15'),
      status: 'POSTED',
      description: 'Profile A Maintenance Assessment Billing Journal (Balanced)',
      totalDebit: 14160000, // 2400 * 5900
      totalCredit: 14160000,
      lines: {
        create: [
          {
            accountId: cashAcc.id,
            debitAmount: 14160000,
            creditAmount: 0,
            baseAmount: 14160000,
            description: 'Cash received for 2400 benchmark maintenance invoices',
            lineNumber: 1,
          },
          {
            accountId: revAcc.id,
            debitAmount: 0,
            creditAmount: 14160000,
            baseAmount: 14160000,
            description: 'Revenue recognized for 2400 benchmark maintenance invoices',
            lineNumber: 2,
          },
        ],
      },
    } as any,
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `✅ [PERF SEED] Profile A (600 Units, 1500 Residents, 2400 Invoices) seeded successfully in ${durationSec}s.`,
  );

  return { orgId: org.id, commId: comm.id, entityId: entity.id };
}

export async function resetPerfData() {
  console.log('🧹 [PERF CLEANUP] Removing all isolated performance benchmark organizations...');
  const perfOrgs = await prisma.organization.findMany({
    where: { slug: { startsWith: 'perf-org-' } },
    select: { id: true },
  });
  const orgIds = perfOrgs.map((o) => o.id);
  if (orgIds.length > 0) {
    const perfEntities = await prisma.accountingEntity.findMany({
      where: { organizationId: { in: orgIds } },
      select: { id: true },
    });
    const entityIds = perfEntities.map((e) => e.id);
    if (entityIds.length > 0) {
      await prisma.journalLine.deleteMany({
        where: { journalEntry: { accountingEntityId: { in: entityIds } } },
      });
      await prisma.journalEntry.deleteMany({
        where: { accountingEntityId: { in: entityIds } },
      });
    }
    const deletedOrgs = await prisma.organization.deleteMany({
      where: { id: { in: orgIds } },
    });
    console.log(
      `✅ Cleaned up ${deletedOrgs.count} isolated benchmark organizations and cascades.`,
    );
  }
}

const isDirectRun = /(^|[\\/])perf-seed\.(ts|js)$/.test(process.argv[1] ?? '');

if (isDirectRun) {
  const command = process.argv.includes('--reset') ? resetPerfData : seedPerfProfileA;
  command().finally(() => prisma.$disconnect());
}
