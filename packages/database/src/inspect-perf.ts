import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
  console.log('=== SYSTEM & DATABASE INSPECTION ===\n');

  // 1. Postgres Version & DB Size
  const versionRes: any = await prisma.$queryRawUnsafe('SELECT version();');
  const sizeRes: any = await prisma.$queryRawUnsafe(
    'SELECT pg_size_pretty(pg_database_size(current_database())) as dbsize, current_database() as dbname;',
  );
  console.log('Database Name:', sizeRes[0].dbname);
  console.log('Database Size:', sizeRes[0].dbsize);
  console.log('PostgreSQL Version:', versionRes[0].version.split('\n')[0]);

  // 2. Table Count & Largest Tables
  const tableCounts: any = await prisma.$queryRawUnsafe(`
    SELECT
      relname as table_name,
      n_live_tup as row_count
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC;
  `);

  console.log('\nTotal Tables in Schema:', tableCounts.length);
  console.log('\nTop High-Volume Tables:');
  tableCounts.slice(0, 30).forEach((t: any) => {
    console.log(`  - ${t.table_name.padEnd(35)} : ${String(t.row_count).padStart(8)} rows`);
  });

  // 3. Total Table Size vs Index Size
  const sizeBreakdown: any = await prisma.$queryRawUnsafe(`
    SELECT
      relname as table_name,
      pg_size_pretty(pg_total_relation_size(relid)) as total_size,
      pg_size_pretty(pg_relation_size(relid)) as table_size,
      pg_size_pretty(pg_indexes_size(relid)) as index_size
    FROM pg_catalog.pg_statio_user_tables
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 20;
  `);

  console.log('\nTop 20 Largest Tables by Storage:');
  sizeBreakdown.forEach((s: any) => {
    console.log(
      `  - ${s.table_name.padEnd(35)} Total: ${s.total_size.padStart(10)} | Data: ${s.table_size.padStart(10)} | Indexes: ${s.index_size.padStart(10)}`,
    );
  });

  // 4. Check key business entity counts explicitly
  const counts = {
    organizations: await prisma.organization.count(),
    communities: await prisma.community.count(),
    units: await prisma.unit.count(),
    residents: await prisma.resident.count(),
    users: await prisma.user.count(),
    tickets: await prisma.ticket.count(),
    workOrders: await prisma.workOrder.count(),
    assets: await prisma.asset.count(),
    invoices: await prisma.invoice.count(),
    payments: await prisma.payment.count(),
    journalEntries: await prisma.journalEntry.count(),
    journalLines: await prisma.journalLine.count(),
    visits: await prisma.visit.count(),
    gateAccessEvents: await prisma.gateAccessEvent.count(),
    utilityMeters: await prisma.utilityMeter.count(),
    meterReadings: await prisma.assetMeterReading.count(),
    auditRecords: await prisma.auditRecord.count(),
  };

  console.log('\n=== KEY BUSINESS RECORD COUNTS ===');
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  - ${k.padEnd(25)} : ${v}`);
  }

  await prisma.$disconnect();
}

inspect().catch(console.error);
