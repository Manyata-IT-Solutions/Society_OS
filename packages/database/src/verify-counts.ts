import { db } from './client.js';
import http from 'http';

async function verify() {
  console.log('🔍 [VERIFICATION] Auditing Demo Dataset across all 25 Phases...\n');

  const counts = {
    users: await db.user.count(),
    organizations: await db.organization.count(),
    portfolios: await db.portfolio.count(),
    communities: await db.community.count(),
    sections: await db.communitySection.count(),
    buildings: await db.building.count(),
    floors: await db.floor.count(),
    units: await db.unit.count(),
    households: await db.household.count(),
    residents: await db.resident.count(),
    unitOwnerships: await db.unitOwnership.count(),
    unitOccupancies: await db.unitOccupancy.count(),
    parkingAreas: await db.parkingArea.count(),
    parkingSlots: await db.parkingSlot.count(),
    vehicles: await db.vehicle.count(),
    amenities: await db.amenity.count(),
    amenityBookings: await db.amenityBooking.count(),
    workforceDepartments: await db.workforceDepartment.count(),
    workforceJobRoles: await db.workforceJobRole.count(),
    workers: await db.worker.count(),
    vendors: await db.vendor.count(),
    assets: await db.asset.count(),
    assetMeters: await db.assetMeter.count(),
    assetMeterReadings: await db.assetMeterReading.count(),
    inventoryStores: await db.inventoryStore.count(),
    inventoryItems: await db.inventoryItem.count(),
    helpdeskCategories: await db.ticketCategory.count(),
    tickets: await db.ticket.count(),
    workOrders: await db.workOrder.count(),
    billingPeriods: await db.billingPeriod.count(),
    billableAccounts: await db.billableAccount.count(),
    invoices: await db.invoice.count(),
    payments: await db.payment.count(),
    receipts: await db.receipt.count(),
    governanceCommittees: await db.governanceCommittee.count(),
    governanceMeetings: await db.governanceMeeting.count(),
    governanceResolutions: await db.governanceResolution.count(),
    governanceNotices: await db.governanceNotice.count(),
    governancePolicies: await db.governancePolicy.count(),
    securityGates: await db.securityGate.count(),
    visitorInvitations: await db.visitorInvitation.count(),
    searchDocuments: await db.searchDocument.count(),
  };

  console.log('📊 DATABASE RECORD COUNTS:');
  console.table(counts);

  // Test live API health
  console.log('\n🌐 TESTING LIVE SERVICES:');
  await new Promise((resolve) => {
    http
      .get('http://localhost:4000/api/health', (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          console.log('   ✅ API Health (Port 4000): HTTP ' + res.statusCode + ' - ' + data);
          resolve(null);
        });
      })
      .on('error', (e) => {
        console.log('   ⚠️ API Health check warning:', e.message);
        resolve(null);
      });
  });

  await new Promise((resolve) => {
    http
      .get('http://localhost:3000', (res) => {
        console.log('   ✅ Web App (Port 3000): HTTP ' + res.statusCode);
        resolve(null);
      })
      .on('error', (e) => {
        console.log('   ⚠️ Web App check warning:', e.message);
        resolve(null);
      });
  });

  await db.$disconnect();
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
